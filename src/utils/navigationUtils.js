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

const chooseHorizontalNeighbor = (reference, neighbors, direction) => {
  if (!reference) return null;

  const refLevel = reference.level ?? 0;
  const sameLevel = neighbors.filter(node => (node.level ?? 0) === refLevel);
  if (sameLevel.length === 0) return null;

  const sorted = [...sameLevel].sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
  const refX = reference.x ?? DEFAULT_COORD.x;

  if (direction === 'ArrowRight') {
    const candidates = sorted.filter(node => (node.x ?? 0) > refX);
    return candidates[0] ?? sorted[0];
  }

  const candidates = sorted.filter(node => (node.x ?? 0) < refX);
  return candidates.length > 0 ? candidates[candidates.length - 1] : sorted[sorted.length - 1];
};

const chooseVerticalNeighbor = (reference, neighbors, direction) => {
  if (!reference) return null;

  const refLevel = reference.level ?? 0;
  const isDown = direction === 'ArrowDown';

  const filtered = neighbors.filter(node => {
    const level = node.level ?? 0;
    return isDown ? level > refLevel : level < refLevel;
  });

  if (filtered.length === 0) return null;

  const sorted = [...filtered].sort((a, b) => {
    const levelA = a.level ?? 0;
    const levelB = b.level ?? 0;
    const diffA = Math.abs(levelA - refLevel);
    const diffB = Math.abs(levelB - refLevel);
    if (diffA !== diffB) return diffA - diffB;
    return distance(reference, a) - distance(reference, b);
  });

  return sorted[0];
};

/**
 * Finds the next connected node for Alt+Arrow navigation.
 *
 * @param {Object} params
 * @param {Array} params.nodes - Current list of nodes
 * @param {Array} params.edges - Current list of edges
 * @param {number|null} params.referenceId - Node id to navigate from
 * @param {string} params.direction - Arrow key identifier (ArrowLeft/ArrowRight/ArrowUp/ArrowDown)
 * @returns {Object|null} - The node object to focus next or null if none
 */
export const findNextConnectedNode = ({ nodes, edges, referenceId, direction }) => {
  if (referenceId == null) return null;
  const reference = getNodeById(nodes, referenceId);
  if (!reference) return null;

  const neighbors = collectNeighborNodes(nodes, edges, referenceId);
  if (neighbors.length === 0) return null;

  switch (direction) {
    case 'ArrowLeft':
    case 'ArrowRight':
      return chooseHorizontalNeighbor(reference, neighbors, direction);
    case 'ArrowUp':
    case 'ArrowDown':
      return chooseVerticalNeighbor(reference, neighbors, direction);
    default:
      return null;
  }
};

export const __private__ = {
  collectNeighborNodes,
  chooseHorizontalNeighbor,
  chooseVerticalNeighbor,
};
