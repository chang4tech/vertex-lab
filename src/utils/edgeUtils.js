// Utilities for undirected/directed edges

export const normalizeUndirected = (a, b) => {
  const [x, y] = a <= b ? [a, b] : [b, a];
  return `${x}-${y}`;
};

export const hasUndirectedEdge = (edges, a, b) => {
  const key = normalizeUndirected(a, b);
  return edges.some(e => normalizeUndirected(e.source, e.target) === key && !e.directed);
};

export const addUndirectedEdge = (edges, a, b) => {
  if (a === b) return edges;
  if (hasUndirectedEdge(edges, a, b)) return edges;
  return [...edges, { source: a, target: b, directed: false }];
};

export const removeUndirectedEdge = (edges, a, b) => {
  const key = normalizeUndirected(a, b);
  return edges.filter(e => normalizeUndirected(e.source, e.target) !== key || !!e.directed);
};

export const edgesFromParentIds = (nodes) => {
  const result = [];
  nodes.forEach(n => {
    if (n.parentId != null) {
      const a = n.parentId;
      const b = n.id;
      if (!hasUndirectedEdge(result, a, b)) {
        result.push({ source: a, target: b, directed: false });
      }
    }
  });
  return result;
};

