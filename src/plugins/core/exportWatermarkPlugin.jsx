import React from 'react';
import generateQrMatrix from '../../utils/qrGenerator.js';

const STORAGE_KEY = 'plugin_core.exportWatermark.mode';
const EVENT_KEY = 'vertex:plugin:watermark-mode';
const DEFAULT_MODE = 'graph-id';

const readMode = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
};

const writeMode = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
};

const wrapText = (text, maxLength) => {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else if (next.length > maxLength) {
      lines.push(next);
      current = '';
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
};

const drawTextWatermark = (context, lines) => {
  const { ctx, width, height } = context;
  if (!lines.length) return;
  ctx.save();
  const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.022));
  ctx.font = `${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(17, 24, 39, 0.65)';
  const margin = Math.max(16, Math.round(Math.min(width, height) * 0.04));
  let y = height - margin;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    ctx.fillText(lines[i], width - margin, y);
    y -= fontSize * 1.25;
  }
  ctx.restore();
};

const drawQrWatermark = (context, value) => {
  if (!value) return;
  let modules;
  try {
    modules = generateQrMatrix(value);
  } catch (err) {
    console.warn('[watermark] failed to generate QR code', err);
    return;
  }
  if (!modules || !modules.length) return;
  const { ctx, width, height } = context;
  const count = modules.length;
  const baseSize = Math.min(width, height);
  const size = Math.min(Math.max(112, Math.round(baseSize * 0.22)), 240);
  const cell = size / count;
  const margin = Math.max(12, Math.round(baseSize * 0.035));
  const startX = width - margin - size;
  const startY = height - margin - size;

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillRect(startX - 8, startY - 8, size + 16, size + 16);
  ctx.fillStyle = '#111827';
  for (let r = 0; r < count; r += 1) {
    for (let c = 0; c < count; c += 1) {
      if (modules[r][c]) {
        ctx.fillRect(
          Math.round(startX + c * cell),
          Math.round(startY + r * cell),
          Math.ceil(cell),
          Math.ceil(cell)
        );
      }
    }
  }
  ctx.restore();
};

const WatermarkRegistrar = ({ api }) => {
  const [mode, setMode] = React.useState(() => readMode());

  React.useEffect(() => {
    const handle = () => setMode(readMode());
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handle);
      window.addEventListener(EVENT_KEY, handle);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handle);
        window.removeEventListener(EVENT_KEY, handle);
      }
    };
  }, []);

  React.useEffect(() => {
    if (typeof api?.registerExportDecorator !== 'function') return undefined;
    if (!mode || mode === 'none') {
      return api.registerExportDecorator?.('core.exportWatermark', null, { id: 'watermark' });
    }
    const decorator = (context) => {
      const { graphId, graphUrl, user, userId, userEmail } = context;
      if (mode === 'qr') {
        const target = graphUrl || (graphId ? `vertex:${graphId}` : '');
        drawQrWatermark(context, target);
        return;
      }
      if (mode === 'graph-url') {
        const target = graphUrl || (graphId ? `vertex:${graphId}` : '');
        const lines = wrapText(target, 36);
        drawTextWatermark(context, lines);
        return;
      }
      const lines = [];
      if (graphId) {
        lines.push(`Graph ID: ${graphId}`);
      }
      const resolvedUser = userEmail || userId || user?.name || user?.id;
      if (resolvedUser) {
        lines.push(`User: ${resolvedUser}`);
      }
      drawTextWatermark(context, lines);
    };
    const cleanup = api.registerExportDecorator('core.exportWatermark', decorator, { id: 'watermark', order: 200 });
    return () => cleanup?.();
  }, [api, mode]);

  return null;
};

const WatermarkConfigurator = () => {
  const [mode, setMode] = React.useState(() => readMode());
  const update = (value) => {
    setMode(value);
    writeMode(value);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="radio"
          name="watermark-mode"
          value="graph-id"
          checked={mode === 'graph-id'}
          onChange={(e) => update(e.target.value)}
        />
        Graph ID + User ID
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="radio"
          name="watermark-mode"
          value="graph-url"
          checked={mode === 'graph-url'}
          onChange={(e) => update(e.target.value)}
        />
        Graph URL text
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="radio"
          name="watermark-mode"
          value="qr"
          checked={mode === 'qr'}
          onChange={(e) => update(e.target.value)}
        />
        Graph URL QR code
      </label>
    </div>
  );
};

export const exportWatermarkPlugin = {
  id: 'core.exportWatermark',
  name: 'Export Watermark',
  description: 'Adds an optional watermark to exported PNG files.',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
* Adds a watermark when you export a PNG snapshot of your diagram.
* Choose between graph metadata text or a QR code pointing to the graph URL.
* Disable by toggling the plugin in the Plugins Manager.
      `.trim(),
    },
    configPage: {
      render: () => <WatermarkConfigurator />,
    },
    canvasOverlays: [
      {
        id: 'exportWatermarkRegistrar',
        slot: 'top-right',
        order: 9999,
        style: { display: 'none' },
        render: (api) => <WatermarkRegistrar api={api} />,
      },
    ],
  },
};

export default exportWatermarkPlugin;
