// Web Worker: Graph Linter heavy computations

function buildAdjacency(nodes = [], edges = []) {
  const idSet = new Set(nodes.map(n => n.id));
  const adj = new Map();
  nodes.forEach(n => adj.set(n.id, []));
  (edges || []).forEach(e => {
    const s = e.source; const t = e.target;
    if (!idSet.has(s) || !idSet.has(t)) return;
    const directed = !!e.directed;
    if (directed) {
      adj.get(s).push(t);
    } else {
      adj.get(s).push(t);
      adj.get(t).push(s);
    }
  });
  return adj;
}

function detectDuplicates(nodes = [], settings) {
  const byLabel = new Map();
  nodes.forEach(n => {
    const key = String(n.label || '').trim().toLowerCase();
    if (!byLabel.has(key)) byLabel.set(key, []);
    byLabel.get(key).push(n);
  });
  const issues = [];
  byLabel.forEach((arr, key) => {
    if (!key) return;
    if (arr.length > 1) {
      arr.slice(1).forEach((n) => {
        if (Array.isArray(n.lintSuppressions) && n.lintSuppressions.includes('duplicates')) return;
        issues.push({ id: `dup:${n.id}`, rule: 'duplicates', severity: settings.severity.duplicates, nodeId: n.id, message: `Duplicate label: "${arr[0].label}"` });
      });
    }
  });
  return issues;
}

function detectOrphans(nodes = [], edges = [], settings) {
  const adj = buildAdjacency(nodes, edges);
  const issues = [];
  nodes.forEach(n => {
    const suppressed = Array.isArray(n.lintSuppressions) && n.lintSuppressions.includes('orphans');
    if (suppressed) return;
    const deg = (adj.get(n.id) || []).length;
    if (deg === 0) issues.push({ id: `orph:${n.id}`, rule: 'orphans', severity: settings.severity.orphans, nodeId: n.id, message: 'Orphan node (no connections)' });
  });
  return issues;
}

function detectDirectedCycles(nodes = [], edges = [], settings) {
  const directedEdges = (edges || []).filter(e => !!e.directed);
  if (directedEdges.length === 0) return [];
  const adj = new Map();
  nodes.forEach(n => adj.set(n.id, []));
  directedEdges.forEach(e => { if (adj.has(e.source)) adj.get(e.source).push(e.target); });
  const issues = [];
  const temp = new Set();
  const perm = new Set();
  const onStack = [];
  function dfs(u) {
    temp.add(u);
    onStack.push(u);
    for (const v of adj.get(u) || []) {
      if (!temp.has(v) && !perm.has(v)) dfs(v);
      else if (temp.has(v)) {
        const cycle = [...onStack.slice(onStack.indexOf(v)), v];
        cycle.forEach(id => {
          const node = nodes.find(n => n.id === id);
          if (!node) return;
          const suppressed = Array.isArray(node.lintSuppressions) && node.lintSuppressions.includes('cycles');
          if (!suppressed) issues.push({ id: `cycle:${id}`, rule: 'cycles', severity: settings.severity.cycles, nodeId: id, message: 'Directed cycle detected' });
        });
      }
    }
    onStack.pop();
    temp.delete(u);
    perm.add(u);
  }
  nodes.forEach(n => { if (!perm.has(n.id)) dfs(n.id); });
  return issues;
}

function detectLongLabels(nodes = [], settings) {
  const maxLen = settings.maxLabelLength;
  const issues = [];
  nodes.forEach(n => {
    const suppressed = Array.isArray(n.lintSuppressions) && n.lintSuppressions.includes('longLabel');
    if (suppressed) return;
    const label = String(n.label || '');
    if (label.length > maxLen) issues.push({ id: `long:${n.id}`, rule: 'longLabel', severity: settings.severity.longLabel, nodeId: n.id, message: `Label too long (${label.length} > ${maxLen})` });
  });
  return issues;
}

self.onmessage = (e) => {
  const { type, requestId, payload } = e.data || {};
  if (type !== 'lint') return;
  const { nodes = [], edges = [], settings = {} } = payload || {};
  try {
    const issues = [];
    issues.push(...detectDuplicates(nodes, settings));
    issues.push(...detectOrphans(nodes, edges, settings));
    issues.push(...detectDirectedCycles(nodes, edges, settings));
    issues.push(...detectLongLabels(nodes, settings));
    self.postMessage({ type: 'lintResult', requestId, issues });
  } catch (err) {
    self.postMessage({ type: 'lintError', requestId, message: String(err && err.message || err) });
  }
};

