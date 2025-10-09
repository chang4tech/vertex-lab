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

const IGNORED_NODE_SIGNATURE_KEYS = new Set(['createdAt', 'updatedAt']);

const buildGraphSignature = (nodes, edges) => {
  try {
    const normalize = (value, ignoredKeys = new Set()) => {
      if (!value || typeof value !== 'object') return null;
      const entries = Object.entries(value)
        .filter(([key, val]) => !ignoredKeys.has(key) && typeof val !== 'function' && val !== undefined);
      entries.sort(([a], [b]) => {
        if (a === b) return 0;
        return a > b ? 1 : -1;
      });
      return Object.fromEntries(entries);
    };

    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeEdges = Array.isArray(edges) ? edges : [];

    const normalizedNodes = safeNodes
      .map((node) => normalize(node, IGNORED_NODE_SIGNATURE_KEYS))
      .filter(Boolean)
      .sort((a, b) => {
        const aId = a.id ?? '';
        const bId = b.id ?? '';
        if (aId === bId) {
          return JSON.stringify(a).localeCompare(JSON.stringify(b));
        }
        return String(aId).localeCompare(String(bId));
      });

    const normalizedEdges = safeEdges
      .map((edge) => normalize(edge))
      .filter(Boolean)
      .sort((a, b) => {
        const toKey = (edge) => {
          const source = edge.source ?? '';
          const target = edge.target ?? '';
          const directed = edge.directed ? '1' : '0';
          return `${String(source)}->${String(target)}:${directed}`;
        };
        const aKey = toKey(a);
        const bKey = toKey(b);
        if (aKey === bKey) {
          return JSON.stringify(a).localeCompare(JSON.stringify(b));
        }
        return aKey.localeCompare(bKey);
      });

    return JSON.stringify({ nodes: normalizedNodes, edges: normalizedEdges });
  } catch {
    return null;
  }
};

const withSnapshotSignature = (entry) => {
  if (!entry || typeof entry !== 'object') return null;
  if (entry.signature) return entry;
  const signature = buildGraphSignature(entry.nodes, entry.edges);
  return { ...entry, signature };
};

const loadSnapshots = (graphId) => {
  try {
    const raw = localStorage.getItem(snapshotKey(graphId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(withSnapshotSignature).filter(Boolean);
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
  const lastSignatureRef = useRef('');
  const lastCaptureRef = useRef(0);
  const isOpen = !!api?.isVersionHistoryOpen;

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
    const signature = buildGraphSignature(api.nodes, api.edges)
      ?? JSON.stringify({ nodes: api.nodes, edges: api.edges });
    const { nodes, edges } = cloneGraphState(api.nodes, api.edges);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      label,
      source,
      nodes,
      edges,
      summary: summarizeSnapshot({ nodes, edges }),
      signature,
    };
    const maxEntries = settings.maxSnapshots || DEFAULT_SETTINGS.maxSnapshots;
    updateSnapshots((prev) => {
      if (source !== 'manual' && prev?.length > 0 && prev[0]?.signature === signature) {
        return prev;
      }
      return [entry, ...(prev || [])].slice(0, maxEntries);
    });
    lastSignatureRef.current = signature;
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
    const signature = buildGraphSignature(api.nodes, api.edges)
      ?? JSON.stringify({ nodes: api.nodes, edges: api.edges });
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

  useEffect(() => {
    if (snapshots.length === 0) return;
    if (!Array.isArray(api?.nodes) || !Array.isArray(api?.edges)) return;
    const signature = buildGraphSignature(api.nodes, api.edges);
    if (!signature) return;
    const latest = snapshots[0];
    if (latest?.signature === signature) {
      lastSignatureRef.current = signature;
      lastCaptureRef.current = Date.now();
    }
  }, [snapshots, api?.nodes, api?.edges]);

  const closePanel = useCallback(() => {
    if (typeof api?.closeVersionHistory === 'function') {
      api.closeVersionHistory();
    }
  }, [api]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePanel]);

  const canRenderPortal = typeof document !== 'undefined' && document.body;

  const panel = isOpen && canRenderPortal
    ? createPortal(
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
            onClick={closePanel}
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
      </div>,
      document.body,
    )
    : null;

  return panel;
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
