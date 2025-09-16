import React from 'react';

export const helloPlugin = {
  id: 'example.hello',
  name: 'Hello Panel',
  description: 'Example side panel that displays current selection count.',
  version: '1.0.0',
  author: 'Vertex Lab',
  slots: {
    sidePanels: [
      {
        id: 'helloPanel',
        visible: () => true,
        render: (api) => (
          <div style={{ width: 320, padding: 12, borderLeft: '1px solid #e5e7eb', background: '#fff' }}>
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
