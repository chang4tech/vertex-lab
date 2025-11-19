// Web Worker: Centrality metrics (degree, PageRank)

function buildGraph(nodes = [], edges = [], directedMode = 'auto') {
  const idToIndex = new Map();
  const indexToId = [];
  (nodes || []).forEach((n, idx) => { idToIndex.set(n.id, idx); indexToId[idx] = n.id; });
  const N = indexToId.length;
  const out = new Array(N); const undeg = new Array(N); const indeg = new Array(N);
  for (let i = 0; i < N; i++) { out[i] = []; undeg[i] = 0; indeg[i] = 0; }
  const useDirected = directedMode === 'directed' || (directedMode === 'auto' && (edges || []).some(e => !!e.directed));
  (edges || []).forEach((e) => {
    const s = idToIndex.get(e.source); const t = idToIndex.get(e.target);
    if (s == null || t == null) return;
    if (useDirected || e.directed) {
      out[s].push(t); indeg[t]++;
    } else {
      out[s].push(t); out[t].push(s);
      undeg[s]++; undeg[t]++;
    }
  });
  return { idToIndex, indexToId, out, undeg, indeg, N, directed: useDirected };
}

function degreeCentrality(graph) {
  const { N, out, undeg, directed } = graph;
  const deg = new Array(N).fill(0);
  if (directed) {
    for (let i = 0; i < N; i++) deg[i] = out[i].length + (graph.indeg[i] || 0);
  } else {
    for (let i = 0; i < N; i++) deg[i] = (out[i]?.length || 0); // undirected edges were inserted symmetrically
    if (undeg.some(v => v > 0)) { for (let i = 0; i < N; i++) deg[i] = undeg[i]; }
  }
  return deg;
}

function pageRank(graph, { damping = 0.85, iterations = 50 } = {}) {
  const { N, out } = graph;
  if (N === 0) return [];
  const pr = new Array(N).fill(1 / N);
  const outdeg = out.map(a => a.length);
  for (let it = 0; it < iterations; it++) {
    const next = new Array(N).fill((1 - damping) / N);
    let leak = 0;
    for (let i = 0; i < N; i++) {
      if (outdeg[i] === 0) leak += pr[i];
      else {
        const share = damping * pr[i] / outdeg[i];
        for (const j of out[i]) next[j] += share;
      }
    }
    if (leak > 0) {
      const add = damping * leak / N;
      for (let i = 0; i < N; i++) next[i] += add;
    }
    for (let i = 0; i < N; i++) pr[i] = next[i];
  }
  return pr;
}

self.onmessage = (e) => {
  const { type, requestId, payload } = e.data || {};
  if (type !== 'centrality') return;
  const { nodes = [], edges = [], metric = 'pagerank', params = {} } = payload || {};
  try {
    const graph = buildGraph(nodes, edges);
    let scores;
    if (metric === 'degree') scores = degreeCentrality(graph);
    else scores = pageRank(graph, params);
    const result = scores.map((v, idx) => ({ id: graph.indexToId[idx], score: v }));
    self.postMessage({ type: 'centralityResult', requestId, result });
  } catch (err) {
    self.postMessage({ type: 'centralityError', requestId, message: String(err && err.message || err) });
  }
};

