import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function SelectionToolsAbout() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  return (
    <div style={{ color: colors.primaryText }}>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>Appears when you select one or more nodes.</li>
        <li>Use Edit First to open the editor for the first selected node.</li>
        <li>Toggle Collapse expands/collapses the first selected node.</li>
        <li>Delete Selected removes all selected nodes.</li>
      </ul>
    </div>
  );
}

function ActionButton({ disabled, onClick, children }) {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        border: 'none',
        borderRadius: 8,
        padding: '8px 12px',
        background: colors.primaryButton,
        color: colors.primaryButtonText,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 150ms ease, opacity 150ms ease',
      }}
    >
      {children}
    </button>
  );
}

function SelectionToolsPanel({ count, firstSelectedId, showCollapse, showDelete, api }) {
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
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h3 style={{ margin: 0 }}>Selection Tools</h3>
      <div style={{ color: colors.secondaryText }}>{count} selected</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ActionButton
          disabled={!firstSelectedId}
          onClick={() => firstSelectedId && api?.onEditNode?.(firstSelectedId)}
        >
          Edit First
        </ActionButton>
        {showCollapse && (
          <ActionButton
            disabled={!firstSelectedId}
            onClick={() => firstSelectedId && api?.onToggleCollapse?.(firstSelectedId)}
          >
            Toggle Collapse
          </ActionButton>
        )}
        {showDelete && (
          <ActionButton
            disabled={count === 0}
            onClick={() => count > 0 && api?.onDeleteNodes?.(api.selectedNodeIds)}
          >
            Delete Selected
          </ActionButton>
        )}
      </div>
    </div>
  );
}

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
      render: () => <SelectionToolsAbout />
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
            <SelectionToolsPanel
              count={count}
              firstSelectedId={first}
              showCollapse={showCollapse}
              showDelete={showDelete}
              api={api}
            />
          );
        }
      }
    ]
  }
};

export default selectionToolsPlugin;
