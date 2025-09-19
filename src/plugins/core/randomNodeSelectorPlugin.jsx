import React from 'react';

export const randomNodeSelectorPlugin = {
  id: 'core.randomNodeSelector',
  name: 'Random Node Selector',
  description: 'Pick a random node and select it instantly.',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
* Adds a context menu command to select a random node.
* Useful for brainstorming or jumping around large graphs.
      `.trim(),
      render: () => (
        <div style={{ color: '#374151' }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Adds a context menu command to select a random node.</li>
            <li>Great for inspiration or reviewing different sections of your graph.</li>
          </ul>
        </div>
      )
    },
    commands: [
      {
        id: 'core.randomNodeSelector.selectRandom',
        title: 'Select Random Node',
        when: (api) => Array.isArray(api?.nodes) && api.nodes.length > 0,
        run: (api) => {
          if (!Array.isArray(api?.nodes) || api.nodes.length === 0) return;
          const nodes = api.nodes.filter((node) => node && typeof node.id !== 'undefined');
          if (nodes.length === 0) return;
          const index = Math.floor(Math.random() * nodes.length);
          const selected = nodes[index];
          if (!selected) return;

          if (typeof api.selectNodes === 'function') {
            api.selectNodes([selected.id], { center: true });
          } else if (typeof api.selectNode === 'function') {
            api.selectNode(selected.id, { center: true });
          }

          if (typeof api.setHighlightedNodes === 'function') {
            api.setHighlightedNodes([selected.id]);
          }
        }
      }
    ]
  }
};

export default randomNodeSelectorPlugin;
