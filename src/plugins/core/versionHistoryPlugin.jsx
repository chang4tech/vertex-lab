import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const SETTINGS_KEY = 'plugin_core.versionHistory.settings';
const SNAPSHOT_KEY_PREFIX = 'plugin_core.versionHistory.snapshots.';
const SETTINGS_EVENT = 'vertex:plugin:version-history-settings';
const DEFAULT_SETTINGS = { autoCapture: true, maxSnapshots: 20 };
const AUTO_CAPTURE_INTERVAL = 45000;

const readSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      autoCapture: parsed?.autoCapture !== false,
      maxSnapshots: Number.isFinite(parsed?.maxSnapshots) ? Math.max(1, Math.min(100, parsed.maxSnapshots)) : DEFAULT_SETTINGS.maxSnapshots,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

const writeSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore persistence errors
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }
};

const snapshotKey = (graphId) => `${SNAPSHOT_KEY_PREFIX}${graphId || 'default'}`;

const loadSnapshots = (graphId) => {
  try {
    const raw = localStorage.getItem(snapshotKey(graphId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const saveSnapshots = (graphId, snapshots) => {
  try {
    localStorage.setItem(snapshotKey(graphId), JSON.stringify(snapshots));
  } catch {
    // ignore
  }
};

const cloneGraphState = (nodes, edges) => {
  try {
    return {
      nodes: JSON.parse(JSON.stringify(nodes ?? [])),
      edges: JSON.parse(JSON.stringify(edges ?? [])),
    };
  } catch {
    return {
      nodes: Array.isArray(nodes) ? nodes.map((n) => ({ ...n })) : [],
      edges: Array.isArray(edges) ? edges.map((e) => ({ ...e })) : [],
    };
  }
};

const summarizeSnapshot = (snapshot) => {
  const nodeCount = Array.isArray(snapshot?.nodes) ? snapshot.nodes.length : 0;
  const edgeCount = Array.isArray(snapshot?.edges) ? snapshot.edges.length : 0;
  return { nodeCount, edgeCount };
};

const useVersionHistorySettings = () => {
  const [settings, setSettings] = useState(() => readSettings());
  useEffect(() => {
    const handle = () => setSettings(readSettings());
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handle);
      window.addEventListener(SETTINGS_EVENT, handle);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handle);
        window.removeEventListener(SETTINGS_EVENT, handle);
      }
    };
  }, []);
  return [settings, (next) => {
    const merged = { ...settings, ...next };
    writeSettings(merged);
    setSettings(merged);
  }];
};

const formatTimestamp = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};

const VersionHistoryConfig = () => {
  const [settings, updateSettings] = useVersionHistorySettings();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="checkbox"
          checked={settings.autoCapture}
          onChange={(e) => updateSettings({ autoCapture: e.target.checked })}
        />
        Auto-capture snapshots when the graph changes
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span>Maximum snapshots per graph</span>
        <input
          type="number"
          min={1}
          max={100}
          value={settings.maxSnapshots}
          onChange={(e) => updateSettings({ maxSnapshots: Math.max(1, Math.min(100, Number(e.target.value) || DEFAULT_SETTINGS.maxSnapshots)) })}
          style={{ width: 80, padding: '6px 8px' }}
        />
      </label>
    </div>
  );
};

const VersionHistoryOverlay = ({ api }) => {
  const graphId = api?.graphId || 'default';
  const [settings] = useVersionHistorySettings();
  const [snapshots, setSnapshots] = useState(() => loadSnapshots(graphId));
  const [open, setOpen] = useState(false);
  const lastSignatureRef = useRef('');
  const lastCaptureRef = useRef(0);

  useEffect(() => {
    setSnapshots(loadSnapshots(graphId));
    lastSignatureRef.current = '';
    lastCaptureRef.current = 0;
  }, [graphId]);

  const updateSnapshots = useCallback((updater) => {
    setSnapshots((prev) => {
      const next = updater(prev || []);
      saveSnapshots(graphId, next);
      return next;
    });
  }, [graphId]);

  const captureSnapshot = useCallback((label, source = 'manual') => {
    if (!Array.isArray(api?.nodes) || !Array.isArray(api?.edges)) return;
    const { nodes, edges } = cloneGraphState(api.nodes, api.edges);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      label,
      source,
      nodes,
      edges,
      summary: summarizeSnapshot({ nodes, edges }),
    };
    const maxEntries = settings.maxSnapshots || DEFAULT_SETTINGS.maxSnapshots;
    updateSnapshots((prev) => [entry, ...prev].slice(0, maxEntries));
    lastSignatureRef.current = JSON.stringify({ nodes: api.nodes, edges: api.edges });
    lastCaptureRef.current = Date.now();
  }, [api, updateSnapshots, settings.maxSnapshots]);

  const removeSnapshot = useCallback((id) => {
    updateSnapshots((prev) => prev.filter((entry) => entry.id !== id));
  }, [updateSnapshots]);

  const restoreSnapshot = useCallback((entry) => {
    if (typeof api?.replaceGraph !== 'function') return;
    api.replaceGraph(entry.nodes, entry.edges);
  }, [api]);

  useEffect(() => {
    if (!settings.autoCapture) return;
    if (!Array.isArray(api?.nodes) || !Array.isArray(api?.edges)) return;
    const signature = JSON.stringify({ nodes: api.nodes, edges: api.edges });
    if (signature === lastSignatureRef.current) return;
    const now = Date.now();
    if (lastCaptureRef.current && now - lastCaptureRef.current < AUTO_CAPTURE_INTERVAL) {
      lastSignatureRef.current = signature;
      return;
    }
    lastSignatureRef.current = signature;
    lastCaptureRef.current = now;
    captureSnapshot('Auto snapshot', 'auto');
  }, [api?.nodes, api?.edges, settings.autoCapture, captureSnapshot]);

  useEffect(() => {
    if (snapshots.length === 0 && Array.isArray(api?.nodes) && Array.isArray(api?.edges)) {
      captureSnapshot('Initial state', 'initial');
    }
  }, [snapshots.length, api?.nodes, api?.edges, captureSnapshot]);

  const panel = open ? createPortal(
    <div
      style={{
        position: 'fixed',
        top: 'calc(80px + env(safe-area-inset-top))',
        right: 'calc(24px + env(safe-area-inset-right))',
        width: 360,
        maxHeight: '70vh',
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 18px 40px rgba(15,23,42,0.18)',
        border: '1px solid rgba(148,163,184,0.35)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 10200,
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(226,232,240,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Version History</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{snapshots.length} snapshot{snapshots.length === 1 ? '' : 's'}</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }}
          aria-label="Close version history"
        >
          ×
        </button>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        <button
          type="button"
          onClick={() => captureSnapshot('Manual snapshot')}
          style={{
            alignSelf: 'flex-start',
            background: '#1f2937',
            color: '#fff',
            borderRadius: 6,
            padding: '6px 12px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Capture snapshot
        </button>
        {snapshots.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 13 }}>No snapshots yet.</div>
        ) : (
          snapshots.map((entry) => (
            <div key={entry.id} style={{
              border: '1px solid rgba(226,232,240,0.8)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: '#f8fafc',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{entry.label || 'Snapshot'}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{formatTimestamp(entry.timestamp)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => restoreSnapshot(entry)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(100,116,139,0.4)', background: '#fff', cursor: 'pointer' }}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSnapshot(entry.id)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(248,113,113,0.6)', color: '#dc2626', background: '#fff', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#475569' }}>
                <span>{entry.summary?.nodeCount ?? 0} nodes</span>
                <span>{entry.summary?.edgeCount ?? 0} edges</span>
                <span style={{ color: '#94a3b8' }}>{entry.source === 'auto' ? 'Auto' : entry.source === 'initial' ? 'Initial' : 'Manual'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>, document.body)
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          padding: '8px 14px',
          borderRadius: 8,
          border: '1px solid rgba(148,163,184,0.4)',
          background: '#ffffff',
          color: '#1e293b',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
        }}
      >
        History
      </button>
      {panel}
    </>
  );
};

export const versionHistoryPlugin = {
  id: 'core.versionHistory',
  name: 'Version History',
  description: 'Capture and restore snapshots of your graph.',
  version: '1.0.0',
  author: 'Vertex Lab Core',
  slots: {
    aboutPage: {
      markdown: `
* Automatically captures snapshots while you work (configurable).
* Restore any saved snapshot or capture manual milestones.
* Snapshots are stored per graph in your browser.
      `.trim(),
    },
    configPage: {
      render: () => <VersionHistoryConfig />,
    },
    canvasOverlays: [
      {
        id: 'versionHistoryOverlay',
        slot: 'top-right',
        order: 25,
        render: (api) => <VersionHistoryOverlay api={api} />,
      },
    ],
  },
};

export default versionHistoryPlugin;
