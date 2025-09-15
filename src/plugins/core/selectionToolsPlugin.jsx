import React from 'react';

export const selectionToolsPlugin = {
  id: 'core.selectionTools',
  name: 'Selection Tools',
  description: 'Quick actions for selected nodes',
  slots: {
    sidePanels: [
      {
        id: 'selectionToolsPanel',
        visible: (api) => (api?.selectedNodeIds?.length ?? 0) > 0,
        render: (api) => {
          const count = api?.selectedNodeIds?.length ?? 0;
          const first = api?.selectedNodeIds?.[0];
          return (
            <div style={{ width: 320, padding: 12, borderLeft: '1px solid #e5e7eb', background: '#fff' }}>
              <h3 style={{ margin: '8px 0' }}>Selection Tools</h3>
              <div style={{ color: '#4b5563', marginBottom: 8 }}>{count} selected</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button disabled={!first} onClick={() => first && api?.onEditNode?.(first)}>Edit First</button>
                <button disabled={!first} onClick={() => first && api?.onToggleCollapse?.(first)}>Toggle Collapse</button>
                <button disabled={count === 0} onClick={() => count > 0 && api?.onDeleteNodes?.(api.selectedNodeIds)}>Delete Selected</button>
              </div>
            </div>
          );
        }
      }
    ]
  }
};

export default selectionToolsPlugin;

