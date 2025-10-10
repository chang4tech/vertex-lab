import React from 'react';

export const helloPlugin = {
  id: 'example.hello',
  name: 'Hello Panel',
  description: 'Example side panel that displays current selection count.',
  descriptionId: 'plugin.example.hello.desc',
  version: '1.0.0',
  author: 'Vertex Lab',
  slots: {
    aboutPage: {
      markdown: `
# Hello Panel

This example plugin adds a simple side panel that always renders and shows the current selection count.

How to use:
- Open the Plugins dialog and ensure "Hello Panel" is enabled.
- Select one or more nodes to see the count update live.

Tips:
- Use this as a minimal starting point for building your own side panels.
      `.trim(),
    },
    sidePanels: [
      {
        id: 'helloPanel',
        title: 'Hello Panel',
        allowCollapse: true,
        visible: () => true,
        render: (api) => (
          <div style={{ width: '100%', padding: 12, borderRadius: 14, background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <h3 style={{ margin: '8px 0' }}>Hello</h3>
            <div style={{ color: '#4b5563' }}>
              {`Selected: ${api.selectedNodeIds?.length ?? 0}`}
            </div>
          </div>
        ),
      },
    ],
  },
};

export default helloPlugin;
