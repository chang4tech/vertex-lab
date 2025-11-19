import React from 'react';

function hash32(str) { let h = 2166136261>>>0; for (let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619);} return (h>>>0).toString(16); }
function graphSignature(nodes=[], edges=[]) {
  const ns = [...(nodes||[])].map(n=>({id:n.id})).sort((a,b)=>a.id-b.id).map(n=>`${n.id}`).join('|');
  const es = [...(edges||[])].map(e=>({s:e.source,t:e.target,d:!!e.directed})).sort((a,b)=>(a.s-b.s)||(a.t-b.t)||((a.d===b.d)?0:a.d?1:-1)).map(e=>`${e.s}->${e.t}${e.d?'d':'u'}`).join('|');
  return hash32(`n${nodes.length}|e${edges.length}|${ns}#${es}`);
}

let workerRef = null;
function getWorker() {
  if (typeof Worker === 'undefined') return null;
  if (workerRef) return workerRef;
  try { workerRef = new Worker(new URL('../../workers/centralityWorker.js', import.meta.url), { type: 'module' }); return workerRef; } catch { return null; }
}

function computeDegreeSync(nodes=[], edges=[]) {
  const deg = new Map(nodes.map(n=>[n.id,0]));
  (edges||[]).forEach(e=>{ if (deg.has(e.source)) deg.set(e.source, deg.get(e.source)+1); if (deg.has(e.target)) deg.set(e.target, deg.get(e.target)+1); });
  return nodes.map(n=>({ id:n.id, score: deg.get(n.id)||0 }));
}

const SETTINGS_PREFIX = 'plugin_examples.centralityLens.settings_';
const PANEL_VIS_KEY = 'plugin_examples.centralityLens.showPanel';

function settingsKey(graphId = 'default') {
  const id = graphId || 'default';
  return `${SETTINGS_PREFIX}${id}`;
}

function loadSettings(graphId = 'default') {
  try {
    const raw = localStorage.getItem(settingsKey(graphId));
    if (raw) return { metric: 'pagerank', topK: 10, ...JSON.parse(raw) };
  } catch {}
  return { metric: 'pagerank', topK: 10 };
}

function saveSettings(graphId = 'default', next = {}) {
  try { localStorage.setItem(settingsKey(graphId), JSON.stringify(next)); } catch {}
}

function isPanelVisible() { try { return localStorage.getItem(PANEL_VIS_KEY) === '1'; } catch { return false; } }
function setPanelVisible(v) { try { localStorage.setItem(PANEL_VIS_KEY, v ? '1' : '0'); } catch {} }

export function CentralityPanel({ api }) {
  const graphId = api.graphId || 'default';
  const initial = React.useMemo(() => loadSettings(graphId), [graphId]);
  const [metric, setMetric] = React.useState(initial.metric || 'pagerank');
  const [topK, setTopK] = React.useState(initial.topK || 10);
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const nodes = api.nodes || [];
  const edges = api.edges || [];
  const key = `${api.graphId||'default'}|${graphSignature(nodes, edges)}|${metric}`;

  React.useEffect(() => {
    let cancelled = false;
    const worker = getWorker();
    if (!worker) {
      const res = metric === 'degree' ? computeDegreeSync(nodes, edges) : computeDegreeSync(nodes, edges); // fallback simple
      res.sort((a,b)=>b.score-a.score); setResults(res); return () => { cancelled = true; };
    }
    setLoading(true);
    const requestId = Math.random().toString(36).slice(2);
    const onMessage = (e) => {
      const { type, requestId: rid, result } = e.data || {};
      if (type !== 'centralityResult' || rid !== requestId) return;
      if (!cancelled) { const res = (result||[]).slice().sort((a,b)=>b.score-a.score); setResults(res); setLoading(false); }
      worker.removeEventListener('message', onMessage);
    };
    worker.addEventListener('message', onMessage);
    worker.postMessage({ type: 'centrality', requestId, payload: { nodes, edges, metric } });
    return () => { cancelled = true; worker.removeEventListener('message', onMessage); };
  }, [key, metric]);

  // Persist settings per graph when changed
  React.useEffect(() => {
    saveSettings(graphId, { metric, topK });
  }, [graphId, metric, topK]);

  const top = results.slice(0, Math.max(1, topK));

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0 }}>Centrality</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label>Metric
          <select value={metric} onChange={(e)=>setMetric(e.target.value)} style={{ marginLeft: 6 }}>
            <option value="pagerank">PageRank</option>
            <option value="degree">Degree</option>
          </select>
        </label>
        <label>Top K
          <input type="number" min={1} max={100} value={topK} onChange={(e)=>setTopK(parseInt(e.target.value||'10',10))} style={{ width: 80, marginLeft: 6 }} />
        </label>
        {loading && <span style={{ fontSize: 12, opacity: 0.7 }}>Computing…</span>}
      </div>
      <div>
        {top.map((r, idx) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 18, textAlign: 'right' }}>{idx+1}.</span>
              <span>#{r.id}</span>
              <span style={{ opacity: 0.7, fontSize: 12 }}>{nodes.find(n=>n.id===r.id)?.label || ''}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>{r.score.toFixed ? r.score.toFixed(4) : r.score}</span>
              <button onClick={()=>api.selectNode?.(r.id)}>Select</button>
              <button onClick={()=>api.onHighlightNodes?.([r.id])}>Highlight</button>
            </div>
          </div>
        ))}
        {top.length === 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>No nodes</div>}
      </div>
    </div>
  );
}

export const centralityLensPlugin = {
  id: 'examples.centralityLens',
  name: 'Centrality Lens',
  version: '1.0.0',
  author: 'Vertex Lab Examples',
  slots: {
    sidePanels: [
      { id: 'centralityPanel', title: 'Centrality', allowCollapse: true, visible: () => isPanelVisible(), render: (api) => <CentralityPanel api={api} /> },
    ],
    commands: [
      { id: 'examples.centralityLens.open', title: 'Open Centrality Lens', when: 'canvas', run: () => setPanelVisible(true) },
      { id: 'examples.centralityLens.close', title: 'Hide Centrality Lens', when: 'canvas', run: () => setPanelVisible(false) },
      { id: 'examples.centralityLens.toggle', title: 'Toggle Centrality Lens', when: 'canvas', run: () => setPanelVisible(!isPanelVisible()) },
    ],
    aboutPage: { markdown: `\n# Centrality Lens\n\nCompute centrality metrics (PageRank, Degree) in a worker and list the top nodes with quick Select/Highlight actions. Cached by graph structure.\n\nSettings persist per graph (metric, Top K). Use the command \`examples.centralityLens.toggle\` to quickly show/hide the panel.\n`.trim() },
  }
};

export default centralityLensPlugin;
