import React from 'react';
import NodeInfoPanel from '../../components/NodeInfoPanel';

export const nodeInfoPlugin = {
  id: 'core.nodeInfo',
  name: 'Node Info',
  slots: {
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
          />
        )
      }
    ]
  }
};

export default nodeInfoPlugin;

