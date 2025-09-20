const DEFAULT_COORD = { x: 0, y: 0 };

const getNodeById = (nodes, id) => {
  if (id == null) return undefined;
  const matchKey = String(id);
  return nodes.find(node => String(node.id) === matchKey);
};

const collectNeighborNodes = (nodes, edges, currentId) => {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return [];

  const neighborIds = new Set();

  for (const edge of edges) {
    if (!edge) continue;
    const { source, target } = edge;
    if (source != null && target != null) {
      if (String(source) === String(currentId)) {
        neighborIds.add(String(target));
      }
      if (String(target) === String(currentId)) {
        neighborIds.add(String(source));
      }
    }
  }

  if (neighborIds.size === 0) return [];

  return nodes.filter(node => neighborIds.has(String(node.id)));
};

const distance = (a, b) => {
  const ax = a?.x ?? DEFAULT_COORD.x;
  const ay = a?.y ?? DEFAULT_COORD.y;
  const bx = b?.x ?? DEFAULT_COORD.x;
  const by = b?.y ?? DEFAULT_COORD.y;
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
};

const sortByXAsc = (list) => [...list].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
const sortByXDesc = (list) => [...list].sort((a, b) => (b.x ?? 0) - (a.x ?? 0));

const orderHorizontalCandidates = (reference, neighbors, direction) => {
  if (!reference) return [];

  const refLevel = reference.level ?? 0;
  const sameLevel = neighbors.filter(node => (node.level ?? 0) === refLevel);
  if (sameLevel.length === 0) return [];

  const refX = reference.x ?? DEFAULT_COORD.x;
  const left = sameLevel.filter(node => (node.x ?? 0) < refX);
  const sameX = sameLevel.filter(node => (node.x ?? 0) === refX);
  const right = sameLevel.filter(node => (node.x ?? 0) > refX);

  if (direction === 'ArrowRight') {
    return [
      ...sortByXAsc(right),
      ...sameX,
      ...sortByXDesc(left),
    ];
  }

  return [
    ...sortByXDesc(left),
    ...sameX,
    ...sortByXAsc(right),
  ];
};

const orderVerticalCandidates = (reference, neighbors, direction) => {
  if (!reference) return [];

  const refLevel = reference.level ?? 0;
  const isDown = direction === 'ArrowDown';

  const filtered = neighbors.filter(node => {
    const level = node.level ?? 0;
    return isDown ? level > refLevel : level < refLevel;
  });

  if (filtered.length === 0) return [];

  return filtered.sort((a, b) => {
    const levelA = a.level ?? 0;
    const levelB = b.level ?? 0;
    const diffA = Math.abs(levelA - refLevel);
    const diffB = Math.abs(levelB - refLevel);
    if (diffA !== diffB) return diffA - diffB;
    return distance(reference, a) - distance(reference, b);
  });
};

export const getConnectedNavigationCandidates = ({ nodes, edges, anchorId, direction }) => {
  if (anchorId == null) return [];
  const reference = getNodeById(nodes, anchorId);
  if (!reference) return [];

  const neighbors = collectNeighborNodes(nodes, edges, anchorId);
  if (neighbors.length === 0) return [];

  switch (direction) {
    case 'ArrowLeft':
    case 'ArrowRight':
      return orderHorizontalCandidates(reference, neighbors, direction);
    case 'ArrowUp':
    case 'ArrowDown':
      return orderVerticalCandidates(reference, neighbors, direction);
    default:
      return [];
  }
};

/**
 * Finds the next connected node for Alt+Arrow navigation.
 */
export const findNextConnectedNode = ({ nodes, edges, referenceId, direction }) => {
  const [next] = getConnectedNavigationCandidates({
    nodes,
    edges,
    anchorId: referenceId,
    direction,
  });
  return next ?? null;
};

export const __private__ = {
  collectNeighborNodes,
  orderHorizontalCandidates,
  orderVerticalCandidates,
};
