import React from 'react';
import { getNodeDisplayText } from '../../utils/nodeUtils';

const SETTINGS_KEY = 'vertex_plugin_prospector_settings_v1';
const DEFAULT_SETTINGS = {
  defaultDepth: 2,
  maxResults: 25,
};

let settingsState = loadSettings();
let historyState = [];
const settingsSubscribers = new Set();
const historySubscribers = new Set();

function loadSettings() {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage?.getItem?.(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    const depth = Number(parsed?.defaultDepth);
    const maxResults = Number(parsed?.maxResults);
    return {
      defaultDepth: Number.isFinite(depth) ? Math.min(Math.max(1, depth), 5) : DEFAULT_SETTINGS.defaultDepth,
      maxResults: Number.isFinite(maxResults) ? Math.min(Math.max(5, maxResults), 100) : DEFAULT_SETTINGS.maxResults,
    };
  } catch (error) {
    console.warn('[paperProspectorPlugin] Failed to load settings', error);
    return { ...DEFAULT_SETTINGS };
  }
}

function persistSettings(next) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage?.setItem?.(SETTINGS_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('[paperProspectorPlugin] Failed to persist settings', error);
  }
}

function getSettings() {
  return settingsState;
}

function setSettings(updater) {
  const prev = settingsState;
  const next = typeof updater === 'function' ? updater(prev) : updater;
  settingsState = {
    ...DEFAULT_SETTINGS,
    ...next,
    defaultDepth: Math.min(Math.max(1, next?.defaultDepth ?? DEFAULT_SETTINGS.defaultDepth), 5),
    maxResults: Math.min(Math.max(5, next?.maxResults ?? DEFAULT_SETTINGS.maxResults), 100),
  };
  persistSettings(settingsState);
  settingsSubscribers.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('[paperProspectorPlugin] settings subscriber failed', error);
    }
  });
}

function subscribeSettings(listener) {
  if (typeof listener !== 'function') return () => {};
  settingsSubscribers.add(listener);
  return () => {
    settingsSubscribers.delete(listener);
  };
}

function subscribeHistory(listener) {
  if (typeof listener !== 'function') return () => {};
  historySubscribers.add(listener);
  return () => {
    historySubscribers.delete(listener);
  };
}

function useSettingsSnapshot() {
  return React.useSyncExternalStore(subscribeSettings, getSettings, getSettings);
}

function getHistory() {
  return historyState;
}

function setHistory(updater) {
  const prev = historyState;
  const next = typeof updater === 'function' ? updater(prev) : updater;
  historyState = Array.isArray(next) ? next.slice(0, 10) : prev;
  historySubscribers.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('[paperProspectorPlugin] history subscriber failed', error);
    }
  });
}

function useHistorySnapshot() {
  return React.useSyncExternalStore(subscribeHistory, getHistory, getHistory);
}

function buildAdjacency(edges = []) {
  const adjacency = new Map();
  edges.forEach((edge) => {
    if (!edge || typeof edge !== 'object') return;
    const source = edge.source ?? edge.sourceId;
    const target = edge.target ?? edge.targetId;
    if (source == null || target == null) return;
    const sourceKey = String(source);
    const targetKey = String(target);
    if (!adjacency.has(sourceKey)) adjacency.set(sourceKey, new Set());
    if (!adjacency.has(targetKey)) adjacency.set(targetKey, new Set());
    adjacency.get(sourceKey).add(targetKey);
    adjacency.get(targetKey).add(sourceKey);
  });
  return adjacency;
}

function prospectReferences({ seeds = [], depth = 2, nodes = [], edges = [], maxResults = 25 }) {
  if (!Array.isArray(seeds) || seeds.length === 0 || depth < 1) return [];
  const seedSet = new Set(seeds.map((id) => String(id)));
  const nodeMap = new Map(
    Array.isArray(nodes)
      ? nodes
          .filter((node) => node && node.id != null)
          .map((node) => [String(node.id), node])
      : []
  );
  const adjacency = buildAdjacency(edges);
  const visited = new Map();
  const queue = [];

  seeds.forEach((seed) => {
    const key = String(seed);
    visited.set(key, { depth: 0, path: [key] });
    queue.push({ id: key, depth: 0, path: [key] });
  });

  const results = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.depth >= depth) continue;
    const neighbors = adjacency.get(current.id);
    if (!neighbors) continue;
    neighbors.forEach((neighbor) => {
      if (seedSet.has(neighbor)) return;
      const nextDepth = current.depth + 1;
      const existing = visited.get(neighbor);
      const nextPath = [...current.path, neighbor];
      if (!existing || existing.depth > nextDepth) {
        visited.set(neighbor, { depth: nextDepth, path: nextPath });
        if (nextDepth < depth) {
          queue.push({ id: neighbor, depth: nextDepth, path: nextPath });
        }
        results.set(neighbor, {
          id: neighbor,
          depth: nextDepth,
          path: nextPath,
          node: nodeMap.get(neighbor) || null,
        });
      }
    });
  }

  const ranked = Array.from(results.values())
    .map((entry) => {
      const display = entry.node ? getNodeDisplayText(entry.node) : `Node ${entry.id}`;
      const score = Math.max(1, Math.round(100 / (entry.depth || 1)));
      return {
        id: entry.id,
        depth: entry.depth,
        path: entry.path,
        label: display,
        score,
        node: entry.node,
      };
    })
    .sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth;
      if (b.score !== a.score) return b.score - a.score;
      return a.label.localeCompare(b.label);
    });

  return ranked.slice(0, maxResults);
}

function runProspector({ seeds = [], depth = 2, nodes = [], edges = [], maxResults = 25, pluginApi }) {
  const results = prospectReferences({ seeds, depth, nodes, edges, maxResults });
  if (results.length > 0) {
    const now = new Date();
    const entry = {
      id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
      depth,
      seeds: seeds.map((id) => String(id)),
      topPicks: results.slice(0, 3).map((item) => item.label),
      resultCount: results.length,
      timestamp: now.toISOString(),
    };
    setHistory((prev) => [entry, ...prev].slice(0, 8));
  }
  try {
    pluginApi?.log?.(
      `[Prospector] Depth ${depth} | ${seeds.length} seed(s) -> ${results.length} candidate${results.length === 1 ? '' : 's'}`
    );
  } catch {
    // noop
  }
  return results;
}

function PaperReferenceProspectorPanel({ appApi }) {
  const settings = useSettingsSnapshot();
  const history = useHistorySnapshot();
  const [isRunning, setIsRunning] = React.useState(false);
  const nodes = Array.isArray(appApi?.nodes) ? appApi.nodes : [];
  const edges = Array.isArray(appApi?.edges) ? appApi.edges : [];
  const selectedIds = Array.isArray(appApi?.selectedNodeIds) ? appApi.selectedNodeIds : [];
  const seeds = selectedIds.length > 0 ? selectedIds : [];

  const preview = React.useMemo(() => {
    return prospectReferences({
      seeds,
      depth: settings.defaultDepth,
      nodes,
      edges,
      maxResults: settings.maxResults,
    });
  }, [seeds.join(','), settings.defaultDepth, settings.maxResults, nodes, edges]);

  const handleDepthChange = React.useCallback(
    (event) => {
      const value = Number(event.target.value);
      if (!Number.isFinite(value)) return;
      setSettings((prev) => ({ ...prev, defaultDepth: value }));
    },
    []
  );

  const handleRun = React.useCallback(() => {
    if (seeds.length === 0) return;
    setIsRunning(true);
    runProspector({
      seeds,
      depth: settings.defaultDepth,
      nodes,
      edges,
      maxResults: settings.maxResults,
      pluginApi: appApi?.plugin,
    });
    window.setTimeout(() => setIsRunning(false), 220);
  }, [seeds.join(','), settings.defaultDepth, settings.maxResults, nodes, edges, appApi]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Prospecting depth</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Depth {settings.defaultDepth}</div>
          </div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>
            {seeds.length === 0
              ? 'Select at least one paper node to seed the search.'
              : `${seeds.length} seed${seeds.length === 1 ? '' : 's'} selected`}
          </div>
        </header>
        <input
          type="range"
          min="1"
          max="5"
          value={settings.defaultDepth}
          onChange={handleDepthChange}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: 11, opacity: 0.68 }}>
          Depth controls how many hops away the prospector explores references. Increase for broader sweeps.
        </div>
        <button
          type="button"
          onClick={handleRun}
          disabled={seeds.length === 0 || isRunning}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid rgba(59, 130, 246, 0.35)',
            background: seeds.length === 0 ? 'rgba(148, 163, 184, 0.16)' : 'rgba(59, 130, 246, 0.14)',
            color: seeds.length === 0 ? 'rgba(15, 23, 42, 0.45)' : '#1d4ed8',
            cursor: seeds.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'transform 120ms ease',
          }}
        >
          {isRunning ? 'Scouting…' : `Prospect references (depth ${settings.defaultDepth})`}
        </button>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>
          Suggested references ({preview.length}/{settings.maxResults})
        </div>
        {preview.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {seeds.length === 0
              ? 'Pick a seed paper to generate candidate references.'
              : 'No references found within the current depth. Try expanding the search.'}
          </div>
        ) : (
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            {preview.map((item) => (
              <li key={item.id} style={{ lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600 }}>{item.label}</div>
                <div style={{ opacity: 0.7 }}>
                  Depth {item.depth} · relevance {item.score}
                  {item.path?.length > 1 && (
                    <span>
                      {' '}
                      · path:{' '}
                      {item.path
                        .map((nodeId) => {
                          if (nodeId === item.id) return null;
                          const node = nodes.find((n) => String(n?.id) === nodeId);
                          return node ? getNodeDisplayText(node) : `Node ${nodeId}`;
                        })
                        .filter(Boolean)
                        .join(' → ')}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>Recent runs</div>
        {history.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.7 }}>No prospect runs yet.</div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((entry) => (
              <li key={entry.id} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(15, 23, 42, 0.08)' }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  Depth {entry.depth} · {entry.resultCount} result{entry.resultCount === 1 ? '' : 's'}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  Seeds: {entry.seeds.join(', ') || '—'}
                  {entry.topPicks.length > 0 && (
                    <>
                      {' '}
                      · Top picks: {entry.topPicks.join('; ')}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PaperReferenceProspectorOverlay() {
  const settings = useSettingsSnapshot();
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 999,
        background: 'rgba(15, 23, 42, 0.75)',
        color: '#f8fafc',
        fontSize: 12,
        boxShadow: '0 16px 28px rgba(15, 23, 42, 0.45)',
      }}
    >
      Prospector depth {settings.defaultDepth}
    </div>
  );
}

function ProspectorConfig() {
  const settings = useSettingsSnapshot();
  const handleDepthChange = React.useCallback((event) => {
    const value = Number(event.target.value);
    if (Number.isFinite(value)) {
      setSettings((prev) => ({ ...prev, defaultDepth: value }));
    }
  }, []);

  const handleMaxResultsChange = React.useCallback((event) => {
    const value = Number(event.target.value);
    if (Number.isFinite(value)) {
      setSettings((prev) => ({ ...prev, maxResults: value }));
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
        <span>Default depth</span>
        <input
          type="number"
          min="1"
          max="5"
          value={settings.defaultDepth}
          onChange={handleDepthChange}
          style={{ width: 96, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.45)' }}
        />
        <span style={{ fontSize: 12, opacity: 0.7 }}>Number of hops to explore when seeding new searches.</span>
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
        <span>Result cap</span>
        <input
          type="number"
          min="5"
          max="100"
          step="5"
          value={settings.maxResults}
          onChange={handleMaxResultsChange}
          style={{ width: 96, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.45)' }}
        />
        <span style={{ fontSize: 12, opacity: 0.7 }}>Keep lists manageable by capping the number of surfaced candidates.</span>
      </label>
    </div>
  );
}

export const paperReferenceProspectorPlugin = {
  id: 'example.paperReferenceProspector',
  name: 'Paper Reference Prospector',
  nameMessageId: 'plugin.paperProspector.name',
  description: 'Scout related references from selected seed papers with configurable depth.',
  descriptionId: 'plugin.paperProspector.description',
  version: '0.1.0',
  author: 'Vertex Lab',
  slots: {
    aboutPage: {
      markdown: `
# Paper Reference Prospector

Explore citation neighborhoods quickly. Seed the search with one or more papers, choose how many hops to explore, and capture fresh leads for your literature review.

**Workflow**
- Select one or more seed papers in the canvas.
- Adjust the prospect depth to balance breadth and relevance.
- Run the prospector to log the results and review top candidates.

Configure the default depth and result cap from the plugin settings page.
      `.trim(),
    },
    configPage: {
      render: () => <ProspectorConfig />,
    },
    sidePanels: [
      {
        id: 'paperReferenceProspectorPanel',
        title: 'Reference Prospector',
        order: 65,
        mobileBehavior: 'drawer',
        allowCollapse: true,
        render: (appApi) => <PaperReferenceProspectorPanel appApi={appApi} />,
      },
    ],
    canvasOverlays: [
      {
        id: 'paperReferenceProspectorOverlay',
        slot: 'top-right',
        order: 55,
        render: () => <PaperReferenceProspectorOverlay />,
      },
    ],
    commands: [
      {
        id: 'example.paperProspector.runNode',
        title: 'Prospect References from Here',
        when: 'node',
        run: (api, ctx) => {
          const settings = getSettings();
          const nodeId = ctx?.nodeId ?? api?.selectedNodeIds?.[0];
          if (nodeId == null) return;
          runProspector({
            seeds: [nodeId],
            depth: settings.defaultDepth,
            nodes: Array.isArray(api?.nodes) ? api.nodes : [],
            edges: Array.isArray(api?.edges) ? api.edges : [],
            maxResults: settings.maxResults,
            pluginApi: api?.plugin,
          });
        },
      },
      {
        id: 'example.paperProspector.runSelection',
        title: 'Prospect References (use current selection)',
        when: 'canvas',
        run: (api) => {
          const settings = getSettings();
          const seeds = Array.isArray(api?.selectedNodeIds) ? api.selectedNodeIds : [];
          if (seeds.length === 0) return;
          runProspector({
            seeds,
            depth: settings.defaultDepth,
            nodes: Array.isArray(api?.nodes) ? api.nodes : [],
            edges: Array.isArray(api?.edges) ? api.edges : [],
            maxResults: settings.maxResults,
            pluginApi: api?.plugin,
          });
        },
      },
    ],
  },
};

export default paperReferenceProspectorPlugin;
