import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function GraphStatsAbout() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  return (
    <div style={{ color: colors.primaryText }}>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>Always-on panel that summarizes your current graph.</li>
        <li>Toggle which metrics to show under Settings.</li>
      </ul>
    </div>
  );
}

function GraphStatsPanel({ nodeCount, edgeCount, selectedCount, showNodes, showEdges, showSelected }) {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  return (
    <div
      style={{
        width: 320,
        padding: 16,
        borderRadius: 12,
        border: `1px solid ${colors.panelBorder}`,
        background: colors.panelBackground,
        boxShadow: `0 12px 24px ${colors.panelShadow}`,
        color: colors.primaryText,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <h3 style={{ margin: 0, color: colors.primaryText }}>Graph Stats</h3>
      {showNodes && (
        <div style={{ color: colors.secondaryText }}>
          Nodes: <strong style={{ color: colors.primaryText }}>{nodeCount}</strong>
        </div>
      )}
      {showEdges && (
        <div style={{ color: colors.secondaryText }}>
          Edges: <strong style={{ color: colors.primaryText }}>{edgeCount}</strong>
        </div>
      )}
      {showSelected && (
        <div style={{ color: colors.secondaryText }}>
          Selected: <strong style={{ color: colors.primaryText }}>{selectedCount}</strong>
        </div>
      )}
    </div>
  );
}

export const graphStatsPlugin = {
  id: 'core.graphStats',
  name: 'Graph Stats',
  description: 'Shows counts for nodes, edges, and selection',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
* Always-on panel that summarizes your current graph.
* Toggle which metrics to show under Settings.
      `.trim(),
      render: () => <GraphStatsAbout />
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
            <GraphStatsPanel
              nodeCount={nodeCount}
              edgeCount={edgeCount}
              selectedCount={selected}
              showNodes={showNodes}
              showEdges={showEdges}
              showSelected={showSelected}
            />
          );
        }
      }
    ]
  }
};

export default graphStatsPlugin;
