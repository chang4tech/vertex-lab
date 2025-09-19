export const connectNodesByIdPlugin = {
  id: 'core.connectNodesById',
  name: 'Connect Nodes by ID',
  description: 'Quickly connect or disconnect a node by entering another node\'s ID.',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
* Adds a context menu command on nodes to connect or disconnect them.
* Enter a target node ID to toggle the linkage between the two nodes.
      `.trim(),
    },
    commands: [
      {
        id: 'core.connectNodesById.toggle',
        title: 'Connect/Disconnect by Node ID',
        when: (api, ctx) => ctx?.nodeId != null || (Array.isArray(api?.selectedNodeIds) && api.selectedNodeIds.length === 1),
        run: (api, ctx) => {
          const sourceId = ctx?.nodeId ?? api?.selectedNodeIds?.[0];
          if (sourceId == null) return;

          if (typeof window === 'undefined') {
            console.warn('[connectNodesById] window is not available for prompt input.');
            return;
          }

          const rawInput = window.prompt('Enter target node ID to connect/disconnect:');
          if (rawInput == null) return; // cancelled
          const value = rawInput.trim();
          if (value === '') return;

          const nodes = Array.isArray(api?.nodes) ? api.nodes : [];
          const target = nodes.find(n => String(n?.id) === value) ?? nodes.find(n => n?.id === Number(value));
          if (!target) {
            window.alert?.('Node not found. Check the ID and try again.');
            return;
          }

          if (target.id === sourceId) {
            window.alert?.('Cannot connect a node to itself.');
            return;
          }

          const toggle = typeof api?.toggleConnection === 'function'
            ? api.toggleConnection
            : (typeof api?.onToggleConnections === 'function'
              ? (a, b, options = {}) => api.onToggleConnections([a, b], options)
              : null);

          if (!toggle) {
            console.warn('[connectNodesById] toggleConnection API is unavailable.');
            return;
          }

          toggle(sourceId, target.id, { shift: false });
          api.setHighlightedNodes?.([sourceId, target.id]);
          api.selectNodes?.([sourceId, target.id]);
        }
      }
    ]
  }
};

export default connectNodesByIdPlugin;
