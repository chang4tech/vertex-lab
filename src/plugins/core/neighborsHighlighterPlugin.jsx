import React from 'react';

export const neighborsHighlighterPlugin = {
  id: 'core.neighborsHighlighter',
  name: 'Neighbors Highlighter',
  nameMessageId: 'plugin.neighborsHighlighter.name',
  description: 'Commands to highlight neighbors and clear highlights',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
* Right-click a node and choose Highlight Neighbors.
* Right-click the canvas and choose Clear Highlights to reset.
* Enable 2nd-degree neighbors or include the source node in Settings.
      `.trim(),
      render: () => (
        <div style={{ color: '#374151' }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Right-click a node and choose Highlight Neighbors.</li>
            <li>Right-click the canvas and choose Clear Highlights to reset.</li>
            <li>Enable 2nd-degree neighbors or include the source node in Settings.</li>
          </ul>
        </div>
      )
    },
    commands: [
      {
        id: 'neighbors.highlight',
        title: 'Highlight Neighbors',
        when: 'node',
        run: (api, ctx) => {
          const nodeId = ctx?.nodeId;
          if (!nodeId) return;
          const edges = Array.isArray(api?.edges) ? api.edges : [];
          let neighbors = [];
          if (edges.length > 0) {
            for (const e of edges) {
              if (!e) continue;
              if (e.source === nodeId) neighbors.push(e.target);
              else if (e.target === nodeId) neighbors.push(e.source);
            }
          } else {
            // Fallback: infer neighbors via level proximity
            const nodes = Array.isArray(api?.nodes) ? api.nodes : [];
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
              const level = node.level ?? 0;
              neighbors.push(...nodes
                .filter(n => n.id !== nodeId && Math.abs((n.level ?? 0) - level) <= 1)
                .map(n => n.id));
            }
          }
          const unique = Array.from(new Set(neighbors)).filter(Boolean);
          api?.setHighlightedNodes?.(unique);
        }
      },
      {
        id: 'neighbors.clear',
        title: 'Clear Highlights',
        when: 'canvas',
        run: (api) => {
          api?.setHighlightedNodes?.([]);
        }
      }
    ]
  }
};

export default neighborsHighlighterPlugin;
