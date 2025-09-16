import React from 'react';

export const showcasePlugin = {
  id: 'example.showcase',
  name: 'Plugin Showcase',
  description: 'Demonstrates overlays and context commands',
  version: '1.0.0',
  author: 'Vertex Lab',
  slots: {
    aboutPage: {
      markdown: `
# Plugin Showcase

Demonstrates a simple HUD overlay and two context commands (node + canvas).

How to use:
- Enable the plugin, then right-click a node to find "Plugin: Hello Node".
- Right-click empty canvas to find "Plugin: Hello Canvas".
- Observe a selection HUD at the bottom-left updating as you select nodes.

Tips:
- Use this as a reference for overlay placement and command registration.
      `.trim(),
      render: () => (
        <div style={{ color: "#374151" }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Shows a selection HUD overlay at the bottom-left.</li>
            <li>Adds "Plugin: Hello Node" (node context) and "Plugin: Hello Canvas" commands.</li>
            <li>Use this as a reference for writing your own plugins.</li>
          </ul>
        </div>
      )
    },
    // A simple overlay that shows selection count
    canvasOverlays: [
      {
        id: 'selectionHud',
        visible: () => true,
        render: (api) => (
          <div style={{ position: 'fixed', left: 16, bottom: 16, padding: '6px 10px', background: '#111827', color: '#fff', borderRadius: 6, fontSize: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
            Plugins ✓ — Selected: {api?.selectedNodeIds?.length ?? 0}
          </div>
        ),
      },
    ],
    // Two sample commands, one for node context and one for canvas context
    commands: [
      {
        id: 'example.helloNode',
        title: 'Plugin: Hello Node',
        when: 'node',
        run: (api, ctx) => {
          const id = ctx?.nodeId;
          // Keep it simple and obvious for demo purposes
          alert(`Hello from plugin! Node: ${id}`);
        },
      },
      {
        id: 'example.helloCanvas',
        title: 'Plugin: Hello Canvas',
        when: 'canvas',
        run: () => {
          alert('Hello from plugin! (canvas)');
        },
      },
    ],
  },
};

export default showcasePlugin;
