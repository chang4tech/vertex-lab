import React from 'react';

// Example Node Editor extension: shows a quick action for Paper type
export const nodeEditorExamplePlugin = {
  id: 'examples.nodeEditorExample',
  name: 'Node Editor Example',
  version: '1.0.0',
  author: 'Vertex Lab Examples',
  slots: {
    nodeEditor: [
      {
        id: 'paperQuickActions',
        title: 'Quick Actions (Paper)',
        order: 10,
        when: (api, node) => String(node?.type || '').toLowerCase() === 'paper',
        render: (api, node) => {
          const year = new Date().getFullYear();
          return (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => api.editor.setField('year', year)}>Set year to {year}</button>
              <button onClick={() => api.editor.setField('author', 'Unknown')}>Set author to "Unknown"</button>
            </div>
          );
        },
      },
    ],
    aboutPage: {
      markdown: `\n# Node Editor Example\n\nContributes a small section to the Node Editor Extensions tab that is visible for \`type: Paper\`. Demonstrates \`slots.nodeEditor\` and editor API (\`api.editor.setField\`).\n`.trim(),
    },
  },
};

export default nodeEditorExamplePlugin;

