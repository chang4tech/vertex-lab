import React from 'react';

export const showcasePlugin = {
  id: 'example.showcase',
  name: 'Plugin Showcase',
  description: 'Demonstrates overlays and context commands',
  version: '1.0.0',
  author: 'Vertex Lab',
  slots: {
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

