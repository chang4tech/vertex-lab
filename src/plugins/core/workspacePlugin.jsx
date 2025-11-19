import React from 'react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLocaleOptions } from '../../i18n/LocaleProvider.jsx';

const WS_INDEX_KEY = 'vertex_workspaces_index';
const WS_ACTIVE_KEY = 'vertex_workspace_active';

function loadIndex() {
  try { const raw = localStorage.getItem(WS_INDEX_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveIndex(list) { try { localStorage.setItem(WS_INDEX_KEY, JSON.stringify(list || [])); } catch {} }
function loadWorkspace(id) { try { const raw = localStorage.getItem(`vertex_workspace_${id}`); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function saveWorkspace(id, data) { try { localStorage.setItem(`vertex_workspace_${id}`, JSON.stringify(data || {})); } catch {} }
function setActive(id) { try { localStorage.setItem(WS_ACTIVE_KEY, id || ''); } catch {} }
function getActive() { try { return localStorage.getItem(WS_ACTIVE_KEY) || ''; } catch { return ''; } }
function uid() { return Math.random().toString(36).slice(2); }

function captureWorkspaceSnapshot(api, themeId, locale) {
  return {
    id: uid(),
    name: 'Workspace',
    version: '1.0.0',
    appVersion: (import.meta.env && import.meta.env.PACKAGE_VERSION) || '0.0.0',
    pluginPrefs: api.pluginPrefs || {},
    pluginConfig: {},
    ui: {
      theme: themeId,
      locale,
      overlayLayoutOverrides: (api.overlayLayout && api.overlayLayout.overrides) || { items: {}, slots: {} },
    },
    defaults: {},
    notes: '',
    lastAppliedTemplatePacks: [],
    createdAt: new Date().toISOString(),
  };
}

function applyWorkspace(ws, api, theme, locale) {
  if (!ws) return;
  // Apply plugin prefs
  const prefs = ws.pluginPrefs || {};
  Object.keys(prefs).forEach((id) => {
    const enabled = prefs[id] !== false;
    try { api.setPluginEnabled?.(id, enabled); } catch {}
  });
  // Apply overlay layout overrides
  const overrides = ws.ui?.overlayLayoutOverrides;
  if (overrides) {
    try { api.resetOverlayLayout?.(); } catch {}
    try { api.setOverlayLayout?.(({ items = {}, slots = {} }) => ({
      items: { ...(items || {}), ...(overrides.items || {}) },
      slots: { ...(slots || {}), ...(overrides.slots || {}) },
    })); } catch {}
  }
  // Theme / locale
  if (ws.ui?.theme && theme?.changeTheme) theme.changeTheme(ws.ui.theme);
  if (ws.ui?.locale && locale?.changeLocale) locale.changeLocale(ws.ui.locale);
}

function WorkspacePanel({ api }) {
  const { currentThemeId, changeTheme } = useTheme();
  const { locale, changeLocale } = useLocaleOptions();
  const [index, setIndex] = React.useState(() => loadIndex());
  const [activeId, setActiveId] = React.useState(() => getActive());
  const [name, setName] = React.useState('My Workspace');
  const [status, setStatus] = React.useState('');

  const refresh = () => { setIndex(loadIndex()); setActiveId(getActive()); };

  const quickSave = () => {
    const snapshot = captureWorkspaceSnapshot(api, currentThemeId, locale);
    snapshot.name = name || 'Workspace';
    const id = snapshot.id;
    saveWorkspace(id, snapshot);
    const list = [...loadIndex(), { id, name: snapshot.name }];
    saveIndex(list); refresh(); setStatus('Saved workspace');
  };

  const activate = (id) => {
    const ws = loadWorkspace(id);
    if (!ws) { setStatus('Not found'); return; }
    applyWorkspace(ws, api, { changeTheme }, { changeLocale });
    setActive(id); refresh(); setStatus('Activated');
  };

  const exportWs = (id) => {
    const ws = loadWorkspace(id);
    if (!ws) return;
    const blob = new Blob([JSON.stringify(ws, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${ws.name || 'workspace'}.json`;
    document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  };

  const importWs = async (file) => {
    const text = await file.text();
    let ws;
    try { ws = JSON.parse(text); } catch (e) { setStatus('Invalid JSON'); return; }
    if (!ws.id) ws.id = uid();
    saveWorkspace(ws.id, ws);
    const list = [...loadIndex(), { id: ws.id, name: ws.name || 'Workspace' }];
    saveIndex(list); refresh(); setStatus('Imported');
  };

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0 }}>Workspaces</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workspace name" style={{ flex: 1 }} />
        <button onClick={quickSave} data-testid="ws-save">Save Current</button>
        <label>
          <input type="file" accept="application/json" style={{ display: 'none' }}
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) await importWs(f); e.target.value=''; }} />
          <span role="button" style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Import…</span>
        </label>
      </div>
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
        {index.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.7 }}>No workspaces saved.</div>
        ) : (
          index.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
              <div>
                <strong>{item.name}</strong>
                {activeId === item.id && <span style={{ marginLeft: 8, fontSize: 12, color: '#16a34a' }}>(active)</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => activate(item.id)} data-testid={`ws-activate-${item.id}`}>Activate</button>
                <button onClick={() => exportWs(item.id)}>Export</button>
              </div>
            </div>
          ))
        )}
      </div>
      {status && <div style={{ fontSize: 12, opacity: 0.8 }}>{status}</div>}
    </div>
  );
}

export const workspacePlugin = {
  id: 'core.workspace',
  name: 'Workspaces',
  version: '0.1.0',
  author: 'Vertex Lab Core',
  slots: {
    sidePanels: [
      {
        id: 'workspacePanel',
        title: 'Workspaces',
        allowCollapse: true,
        visible: () => true,
        render: (api) => <WorkspacePanel api={api} />,
      },
    ],
    commands: [
      { id: 'core.workspace.open', title: 'Open Workspaces', when: 'canvas', run: () => {} },
    ],
  }
};

export default workspacePlugin;

