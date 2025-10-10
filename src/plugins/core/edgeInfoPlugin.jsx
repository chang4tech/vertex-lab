import React from 'react';
import EdgeInfoPanel from '../../components/EdgeInfoPanel.jsx';

export const edgeInfoPlugin = {
  id: 'core.edgeInfo',
  name: 'Edge Info',
  nameMessageId: 'plugin.edgeInfo.name',
  description: 'Shows details for edges, including metadata.',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
# Edge Info Panel

The Edge Info panel helps you inspect connections in your graph.

How to use:
- Toggle it from View → Show Edge Info.
- Select an edge (or two connected nodes) to focus the details view.
- Review the edge metadata, direction, and connected node labels.

Tips:
- Use it together with the Node Info panel for a full context view.
- Metadata is automatically flattened when you store nested edge attributes.
      `.trim(),
    },
    configPage: {
      render: () => {
        const KEY = 'vertex_show_edge_info_panel';
        const get = () => { try { return localStorage.getItem(KEY) === 'true'; } catch { return false; } };
        const set = (value) => { try { localStorage.setItem(KEY, String(value)); } catch {} };
        const [showOnStart, setShowOnStart] = React.useState(() => get());
        React.useEffect(() => { set(showOnStart); }, []);
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={showOnStart}
              onChange={(event) => {
                setShowOnStart(event.target.checked);
                set(event.target.checked);
              }}
            />
            Show Edge Info panel by default
          </label>
        );
      }
    },
    sidePanels: [
      {
        id: 'edgeInfoPanel',
        visible: (api) => !!api?.showEdgeInfoPanel,
        render: (api) => (
          <EdgeInfoPanel
            edges={Array.isArray(api?.edges) ? api.edges : []}
            nodes={Array.isArray(api?.nodes) ? api.nodes : []}
            selectedNodeIds={Array.isArray(api?.selectedNodeIds) ? api.selectedNodeIds : []}
            visible={api?.showEdgeInfoPanel}
            onClose={api?.hideEdgeInfoPanel}
            topOffset={api?.menuBarBottom}
            rightOffset={api?.showNodeInfoPanel ? (api?.isMobile ? 280 : 320) : 0}
            onResetView={api.resetView}
          />
        )
      }
    ]
  }
};

export default edgeInfoPlugin;
