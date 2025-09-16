import React from 'react';

export const selectionToolsPlugin = {
  id: 'core.selectionTools',
  name: 'Selection Tools',
  description: 'Quick actions for selected nodes',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
* Appears when you select one or more nodes.
* Use Edit First to open the editor for the first selected node.
* Toggle Collapse expands/collapses the first selected node.
* Delete Selected removes all selected nodes.
      `.trim(),
      render: () => (
        <div style={{ color: '#374151' }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Appears when you select one or more nodes.</li>
            <li>Use Edit First to open the editor for the first selected node.</li>
            <li>Toggle Collapse expands/collapses the first selected node.</li>
            <li>Delete Selected removes all selected nodes.</li>
          </ul>
        </div>
      )
    },
    configPage: {
      render: () => {
        const prefix = 'plugin_core.selectionTools_';
        const get = (k, d) => {
          try { const v = localStorage.getItem(prefix + k); return v == null ? d : v === 'true'; } catch { return d; }
        };
        const set = (k, v) => { try { localStorage.setItem(prefix + k, String(v)); } catch {} };
        const [showDelete, setShowDelete] = React.useState(() => get('showDelete', true));
        const [showCollapse, setShowCollapse] = React.useState(() => get('showCollapse', true));
        React.useEffect(() => { set('showDelete', showDelete); }, [showDelete]);
        React.useEffect(() => { set('showCollapse', showCollapse); }, [showCollapse]);
        return (
          <div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={showDelete} onChange={(e) => setShowDelete(e.target.checked)} />
              Show Delete button
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={showCollapse} onChange={(e) => setShowCollapse(e.target.checked)} />
              Show Collapse button
            </label>
          </div>
        );
      }
    },
    sidePanels: [
      {
        id: 'selectionToolsPanel',
        visible: (api) => (api?.selectedNodeIds?.length ?? 0) > 0,
        render: (api) => {
          const count = api?.selectedNodeIds?.length ?? 0;
          const first = api?.selectedNodeIds?.[0];
          const prefix = 'plugin_core.selectionTools_';
          const get = (k, d) => {
            try { const v = localStorage.getItem(prefix + k); return v == null ? d : v === 'true'; } catch { return d; }
          };
          const showDelete = get('showDelete', true);
          const showCollapse = get('showCollapse', true);
          return (
            <div style={{ width: 320, padding: 12, borderLeft: '1px solid #e5e7eb', background: '#fff' }}>
              <h3 style={{ margin: '8px 0' }}>Selection Tools</h3>
              <div style={{ color: '#4b5563', marginBottom: 8 }}>{count} selected</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button disabled={!first} onClick={() => first && api?.onEditNode?.(first)}>Edit First</button>
                {showCollapse && (
                  <button disabled={!first} onClick={() => first && api?.onToggleCollapse?.(first)}>Toggle Collapse</button>
                )}
                {showDelete && (
                  <button disabled={count === 0} onClick={() => count > 0 && api?.onDeleteNodes?.(api.selectedNodeIds)}>Delete Selected</button>
                )}
              </div>
            </div>
          );
        }
      }
    ]
  }
};

export default selectionToolsPlugin;
