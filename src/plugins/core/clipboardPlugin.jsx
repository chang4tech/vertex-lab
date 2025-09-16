import React from 'react';

export const clipboardPlugin = {
  id: 'core.clipboard',
  name: 'Clipboard Tools',
  description: 'Commands to copy selection or node ids',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
* Right-click a node to copy its ID.
* Select nodes and right-click canvas to copy selected IDs.
* Choose your preferred copy format in Settings.
      `.trim(),
      render: () => (
        <div style={{ color: '#374151' }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Right-click a node to copy its ID.</li>
            <li>Select nodes and right-click canvas to copy selected IDs.</li>
            <li>Choose your preferred copy format in Settings.</li>
          </ul>
        </div>
      )
    },
    configPage: {
      render: () => {
        const prefix = 'plugin_core.clipboard_';
        const getStr = (k, d) => { try { const v = localStorage.getItem(prefix + k); return v ?? d; } catch { return d; } };
        const setStr = (k, v) => { try { localStorage.setItem(prefix + k, v); } catch {} };
        const [format, setFormat] = React.useState(() => getStr('format', 'comma'));
        React.useEffect(() => { setStr('format', format); }, [format]);
        return (
          <div>
            <label>Copy format:&nbsp;
              <select value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="comma">Comma-separated</option>
                <option value="newline">New line per id</option>
                <option value="json">JSON array</option>
              </select>
            </label>
          </div>
        );
      }
    },
    commands: [
      {
        id: 'clipboard.copySelectionIds',
        title: 'Copy Selected IDs',
        when: (api) => (api?.selectedNodeIds?.length ?? 0) > 0,
        run: async (api) => {
          const prefix = 'plugin_core.clipboard_';
          const getStr = (k, d) => { try { const v = localStorage.getItem(prefix + k); return v ?? d; } catch { return d; } };
          const fmt = getStr('format', 'comma');
          const ids = api?.selectedNodeIds || [];
          const text = fmt === 'newline' ? ids.join('\n') : fmt === 'json' ? JSON.stringify(ids) : ids.join(', ');
          api?.plugin?.log?.(`Copied ${ids.length} id(s) using format=${fmt}`);
          try { await navigator.clipboard?.writeText?.(text); } catch {}
        },
      },
      {
        id: 'clipboard.copyNodeId',
        title: 'Copy Node ID',
        when: 'node',
        run: async (_api, ctx) => {
          const val = String(ctx?.nodeId ?? '');
          _api?.plugin?.log?.('Copied node id');
          try { await navigator.clipboard?.writeText?.(val); } catch {}
        },
      },
    ],
  },
};

export default clipboardPlugin;
