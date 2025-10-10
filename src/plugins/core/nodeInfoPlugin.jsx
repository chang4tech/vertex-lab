import React from 'react';
import NodeInfoPanel from '../../components/NodeInfoPanel';

export const nodeInfoPlugin = {
  id: 'core.nodeInfo',
  name: 'Node Info',
  nameMessageId: 'plugin.nodeInfo.name',
  description: 'Shows details for the selected node or a summary for multiple selections.',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
# Node Info Panel

The Node Info panel shows details for the currently selected node, or a summary when multiple nodes are selected.

How to use:
- Open it via View → Show Node Info, or press Cmd/Ctrl + I.
- Click a node to see its properties, tags, notes, and timestamps.
- With multiple nodes selected, the panel shows counts and distributions.

Tips:
- Use the Edit, Collapse/Expand, and Delete actions at the bottom of the panel.
- The panel’s visibility is remembered between sessions.
      `.trim(),
    },
    configPage: {
      render: () => {
        const KEY = 'vertex_show_node_info_panel';
        const get = () => { try { return localStorage.getItem(KEY) === 'true'; } catch { return false; } };
        const set = (v) => { try { localStorage.setItem(KEY, String(v)); } catch {} };
        const [showOnStart, setShowOnStart] = React.useState(() => get());
        React.useEffect(() => { set(showOnStart); }, []);
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={showOnStart} onChange={(e) => { setShowOnStart(e.target.checked); set(e.target.checked); }} />
            Show Node Info panel by default
          </label>
        );
      }
    },
    sidePanels: [
      {
        id: 'nodeInfoPanel',
        visible: (api) => !!api.showNodeInfoPanel,
        render: (api) => (
          <NodeInfoPanel
            selectedNodes={api.selectedNodes || []}
            visible={api.showNodeInfoPanel}
            onClose={api.hideNodeInfoPanel}
            onEditNode={api.onEditNode}
            onDeleteNodes={api.onDeleteNodes}
            onToggleCollapse={api.onToggleCollapse}
            topOffset={api.menuBarBottom}
            onResetView={api.resetView}
          />
        )
      }
    ]
  }
};

export default nodeInfoPlugin;
