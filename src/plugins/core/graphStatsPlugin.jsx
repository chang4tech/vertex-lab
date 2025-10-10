import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useTheme } from '../../contexts/ThemeContext';

function GraphStatsAbout() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  return (
    <div style={{ color: colors.primaryText }}>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <FormattedMessage
            id="plugin.graphStats.about.summary"
            defaultMessage="Always-on panel that summarizes your current graph."
          />
        </li>
        <li>
          <FormattedMessage
            id="plugin.graphStats.about.toggle"
            defaultMessage="Toggle which metrics to show under Settings."
          />
        </li>
      </ul>
    </div>
  );
}

function GraphStatsPanel({ nodeCount, edgeCount, selectedCount, showNodes, showEdges, showSelected }) {
  const { currentTheme } = useTheme();
  const intl = useIntl();
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
      <h3 style={{ margin: 0, color: colors.primaryText }}>
        <FormattedMessage id="plugin.graphStats.title" defaultMessage="Graph Stats" />
      </h3>
      {showNodes && (
        <div style={{ color: colors.secondaryText }}>
          <FormattedMessage
            id="plugin.graphStats.nodes"
            defaultMessage="Nodes: {count}"
            values={{
              count: (
                <strong style={{ color: colors.primaryText }}>
                  {intl.formatNumber(nodeCount)}
                </strong>
              ),
            }}
          />
        </div>
      )}
      {showEdges && (
        <div style={{ color: colors.secondaryText }}>
          <FormattedMessage
            id="plugin.graphStats.edges"
            defaultMessage="Edges: {count}"
            values={{
              count: (
                <strong style={{ color: colors.primaryText }}>
                  {intl.formatNumber(edgeCount)}
                </strong>
              ),
            }}
          />
        </div>
      )}
      {showSelected && (
        <div style={{ color: colors.secondaryText }}>
          <FormattedMessage
            id="plugin.graphStats.selected"
            defaultMessage="Selected: {count}"
            values={{
              count: (
                <strong style={{ color: colors.primaryText }}>
                  {intl.formatNumber(selectedCount)}
                </strong>
              ),
            }}
          />
        </div>
      )}
    </div>
  );
}

function GraphStatsConfig() {
  const intl = useIntl();
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
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={showNodes} onChange={e => setShowNodes(e.target.checked)} />
        {intl.formatMessage({
          id: 'plugin.graphStats.showNodes',
          defaultMessage: 'Show node count',
        })}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={showEdges} onChange={e => setShowEdges(e.target.checked)} />
        {intl.formatMessage({
          id: 'plugin.graphStats.showEdges',
          defaultMessage: 'Show edge count',
        })}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={showSelected} onChange={e => setShowSelected(e.target.checked)} />
        {intl.formatMessage({
          id: 'plugin.graphStats.showSelected',
          defaultMessage: 'Show selected count',
        })}
      </label>
    </div>
  );
}

export const graphStatsPlugin = {
  id: 'core.graphStats',
  name: 'Graph Stats',
  nameMessageId: 'plugin.graphStats.title',
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
      render: () => <GraphStatsConfig />
    },
    sidePanels: [
      {
        id: 'graphStatsPanel',
        title: 'Graph Stats',
        allowCollapse: true,
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
