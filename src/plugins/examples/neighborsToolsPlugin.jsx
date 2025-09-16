export const neighborsToolsPlugin = {
  id: 'example.neighborsTools',
  name: 'Neighbors Tools (Example)',
  description: 'Example commands to highlight and clear neighbors of a node',
  version: '1.0.0',
  author: 'Vertex Lab',
  slots: {
    commands: [
      {
        id: 'example.neighbors',
        title: 'Example: Highlight Neighbors',
        when: 'node',
        run: (api, ctx) => {
          const nodeId = ctx?.nodeId;
          if (!nodeId) return;
          const edges = Array.isArray(api?.edges) ? api.edges : [];
          const neighbors = edges.flatMap(e => (e.source === nodeId ? [e.target] : (e.target === nodeId ? [e.source] : [])));
          api?.setHighlightedNodes?.(Array.from(new Set(neighbors)));
        }
      },
      {
        id: 'example.clearHighlights',
        title: 'Example: Clear Highlights',
        when: 'canvas',
        run: (api) => api?.setHighlightedNodes?.([]),
      }
    ]
  }
};

export default neighborsToolsPlugin;
