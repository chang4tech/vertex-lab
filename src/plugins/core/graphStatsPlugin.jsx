import React from 'react';

export const graphStatsPlugin = {
  id: 'core.graphStats',
  name: 'Graph Stats',
  description: 'Shows counts for nodes, edges, and selection',
  slots: {
    aboutPage: {
      render: () => (
        <div style={{ color: '#374151' }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Always-on panel that summarizes your current graph.</li>
            <li>Toggle which metrics to show under Settings.</li>
          </ul>
        </div>
      )
    },
    configPage: {
      render: () => {
        const prefix = 'plugin_core.graphStats_';
        const get = (k, d) => { try { const v = localStorage.getItem(prefix + k); return v == null ? d : v === 'true'; } catch { return d; } };
        const set = (k, v) => { try { localStorage.setItem(prefix + k, String(v)); } catch {} };
        const [showNodes, setShowNodes] = React.useState(() => get('showNodes', true));
        const [showEdges, setShowEdges] = React.useState(() => get('showEdges', true));
        const [showSelected, setShowSelected] = React.useState(() => get('showSelected', true));
        React.useEffect(() => { set('showNodes', showNodes); }, [showNodes]);
        React.useEffect(() => { set('showEdges', showEdges); }, [showEdges]);
        React.useEffect(() => { set('showSelected', showSelected); }, [showSelected]);
        return (
          <div style={{ display: 'grid', gap: 8 }}>
            <label><input type="checkbox" checked={showNodes} onChange={e => setShowNodes(e.target.checked)} /> Show node count</label>
            <label><input type="checkbox" checked={showEdges} onChange={e => setShowEdges(e.target.checked)} /> Show edge count</label>
            <label><input type="checkbox" checked={showSelected} onChange={e => setShowSelected(e.target.checked)} /> Show selected count</label>
          </div>
        );
      }
    },
    sidePanels: [
      {
        id: 'graphStatsPanel',
        visible: () => true,
        render: (api) => {
          const nodeCount = api?.nodes?.length ?? 0;
          const selected = api?.selectedNodeIds?.length ?? 0;
          const edgeCount = Array.isArray(api?.edges) ? api.edges.length : 0;
          const prefix = 'plugin_core.graphStats_';
          const get = (k, d) => { try { const v = localStorage.getItem(prefix + k); return v == null ? d : v === 'true'; } catch { return d; } };
          const showNodes = get('showNodes', true);
          const showEdges = get('showEdges', true);
          const showSelected = get('showSelected', true);
          return (
            <div style={{ width: 320, padding: 12, borderLeft: '1px solid #e5e7eb', background: '#fff' }}>
              <h3 style={{ margin: '8px 0' }}>Graph Stats</h3>
              {showNodes && <div style={{ color: '#4b5563' }}>Nodes: {nodeCount}</div>}
              {showEdges && <div style={{ color: '#4b5563' }}>Edges: {edgeCount}</div>}
              {showSelected && <div style={{ color: '#4b5563' }}>Selected: {selected}</div>}
            </div>
          );
        }
      }
    ]
  }
};

export default graphStatsPlugin;
