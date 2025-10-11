import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';

vi.mock('../../utils/qrGenerator.js', () => ({
  __esModule: true,
  default: vi.fn(() => [[true, false], [false, true]]),
}));

const STORAGE_KEY = 'plugin_core.exportWatermark.mode';
const { default: generateQrMatrix } = await import('../../utils/qrGenerator.js');
const { exportWatermarkPlugin } = await import('../../plugins/core/exportWatermarkPlugin.jsx');

const overlayConfig = exportWatermarkPlugin.slots.canvasOverlays?.[0];

const createCanvasContext = () => ({
  ctx: {
    save: vi.fn(),
    restore: vi.fn(),
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    fillText: vi.fn(),
    fillRect: vi.fn(),
  },
  width: 600,
  height: 400,
  graphId: 'demo-graph',
  graphUrl: 'https://vertex.example/graph/demo-graph',
  userEmail: 'tester@example.com',
});

const setMode = (value) => {
  localStorage.getItem.mockImplementation((key) => (key === STORAGE_KEY ? value : null));
};

describe('exportWatermarkPlugin', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.getItem.mockReset();
    localStorage.setItem.mockReset();
    setMode(null);
    window.dispatchEvent = vi.fn();
  });

  it('registers text decorator for default mode', async () => {
    setMode(null); // defaults to graph-id
    const registerExportDecorator = vi.fn(() => vi.fn());
    render(overlayConfig.render({ registerExportDecorator }));

    await waitFor(() => expect(registerExportDecorator).toHaveBeenCalled());
    const [, decorator] = registerExportDecorator.mock.calls.at(-1);
    const context = createCanvasContext();
    decorator(context);
    expect(context.ctx.fillText).toHaveBeenCalledWith(expect.stringContaining('Graph ID:'), expect.any(Number), expect.any(Number));
  });

  it('renders graph URL text when mode is graph-url', async () => {
    setMode('graph-url');
    const registerExportDecorator = vi.fn(() => vi.fn());
    render(overlayConfig.render({ registerExportDecorator }));

    await waitFor(() => expect(registerExportDecorator).toHaveBeenCalled());
    const decorator = registerExportDecorator.mock.calls.at(-1)[1];
    const context = createCanvasContext();
    decorator(context);
    expect(context.ctx.fillText).toHaveBeenCalled();
    const renderedLines = context.ctx.fillText.mock.calls.map(([text]) => text).join(' ');
    expect(renderedLines).toContain('https://vertex.example/graph/demo-graph');
  });

  it('renders QR code when mode is qr', async () => {
    setMode('qr');
    const registerExportDecorator = vi.fn(() => vi.fn());
    render(overlayConfig.render({ registerExportDecorator }));

    await waitFor(() => expect(registerExportDecorator).toHaveBeenCalled());
    const decorator = registerExportDecorator.mock.calls.at(-1)[1];
    const context = createCanvasContext();
    decorator(context);
    expect(generateQrMatrix).toHaveBeenCalledWith('https://vertex.example/graph/demo-graph');
    expect(context.ctx.fillRect).toHaveBeenCalled();
  });

  it('unregisters decorator when mode is none', async () => {
    setMode('none');
    const registerExportDecorator = vi.fn(() => vi.fn());
    render(overlayConfig.render({ registerExportDecorator }));

    await waitFor(() => {
      expect(registerExportDecorator).toHaveBeenCalledWith('core.exportWatermark', null, expect.objectContaining({ id: 'watermark' }));
    });
  });
});
