import React from 'react';

export const graphStatsPlugin = {
  id: 'core.graphStats',
  name: 'Graph Stats',
  description: 'Shows counts for nodes, edges, and selection',
  slots: {
    sidePanels: [
      {
        id: 'graphStatsPanel',
        visible: () => true,
        render: (api) => {
          const nodeCount = api?.nodes?.length ?? 0;
          const selected = api?.selectedNodeIds?.length ?? 0;
          const edgeCount = Array.isArray(api?.edges) ? api.edges.length : 0;
          return (
            <div style={{ width: 320, padding: 12, borderLeft: '1px solid #e5e7eb', background: '#fff' }}>
              <h3 style={{ margin: '8px 0' }}>Graph Stats</h3>
              <div style={{ color: '#4b5563' }}>Nodes: {nodeCount}</div>
              <div style={{ color: '#4b5563' }}>Edges: {edgeCount}</div>
              <div style={{ color: '#4b5563' }}>Selected: {selected}</div>
            </div>
          );
        }
      }
    ]
  }
};

export default graphStatsPlugin;

