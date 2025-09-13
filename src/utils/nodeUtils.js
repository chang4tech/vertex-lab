// Node shape constants
export const NODE_SHAPES = {
  CIRCLE: 'circle',
  RECTANGLE: 'rectangle',
  ROUNDED_RECTANGLE: 'rounded-rectangle',
  DIAMOND: 'diamond',
  HEXAGON: 'hexagon',
  ELLIPSE: 'ellipse'
};

// Predefined node colors
export const NODE_COLORS = {
  DEFAULT: '#ffffff',
  BLUE: '#e3f2fd',
  GREEN: '#e8f5e8',
  YELLOW: '#fff9c4',
  ORANGE: '#fff3e0',
  RED: '#ffebee',
  PURPLE: '#f3e5f5',
  PINK: '#fce4ec',
  TEAL: '#e0f2f1',
  INDIGO: '#e8eaf6',
  BROWN: '#efebe9',
  GRAY: '#f5f5f5'
};

// Node color metadata
export const NODE_COLOR_INFO = {
  [NODE_COLORS.DEFAULT]: { name: 'Default', border: '#1976d2' },
  [NODE_COLORS.BLUE]: { name: 'Blue', border: '#1976d2' },
  [NODE_COLORS.GREEN]: { name: 'Green', border: '#388e3c' },
  [NODE_COLORS.YELLOW]: { name: 'Yellow', border: '#f57c00' },
  [NODE_COLORS.ORANGE]: { name: 'Orange', border: '#f57c00' },
  [NODE_COLORS.RED]: { name: 'Red', border: '#d32f2f' },
  [NODE_COLORS.PURPLE]: { name: 'Purple', border: '#7b1fa2' },
  [NODE_COLORS.PINK]: { name: 'Pink', border: '#c2185b' },
  [NODE_COLORS.TEAL]: { name: 'Teal', border: '#00796b' },
  [NODE_COLORS.INDIGO]: { name: 'Indigo', border: '#303f9f' },
  [NODE_COLORS.BROWN]: { name: 'Brown', border: '#5d4037' },
  [NODE_COLORS.GRAY]: { name: 'Gray', border: '#616161' }
};

// Common node tags/categories
export const COMMON_TAGS = [
  { id: 'important', name: 'Important', color: '#f44336' },
  { id: 'urgent', name: 'Urgent', color: '#ff9800' },
  { id: 'idea', name: 'Idea', color: '#ffeb3b' },
  { id: 'task', name: 'Task', color: '#4caf50' },
  { id: 'question', name: 'Question', color: '#2196f3' },
  { id: 'note', name: 'Note', color: '#9c27b0' },
  { id: 'decision', name: 'Decision', color: '#e91e63' },
  { id: 'resource', name: 'Resource', color: '#00bcd4' }
];

// Node icons (emoji-based)
export const NODE_ICONS = {
  NONE: '',
  LIGHTBULB: '💡',
  STAR: '⭐',
  HEART: '❤️',
  CHECKMARK: '✅',
  WARNING: '⚠️',
  QUESTION: '❓',
  EXCLAMATION: '❗',
  FIRE: '🔥',
  TARGET: '🎯',
  ROCKET: '🚀',
  GEAR: '⚙️',
  BOOK: '📚',
  CHART: '📊',
  CALENDAR: '📅',
  FOLDER: '📁'
};

// Create a new enhanced node
export function createNode(id, label, x, y, parentId = null, options = {}) {
  return {
    id,
    label,
    x,
    y,
    parentId,
    // Enhanced properties
    color: options.color || NODE_COLORS.DEFAULT,
    shape: options.shape || NODE_SHAPES.CIRCLE,
    tags: options.tags || [],
    icon: options.icon || NODE_ICONS.NONE,
    fontSize: options.fontSize || 16,
    fontWeight: options.fontWeight || 'normal',
    fontStyle: options.fontStyle || 'normal',
    isCollapsed: options.isCollapsed || false,
    notes: options.notes || '',
    createdAt: options.createdAt || new Date().toISOString(),
    updatedAt: options.updatedAt || new Date().toISOString()
  };
}

// Create enhanced node from existing node data
export function createEnhancedNode(nodeData) {
  return {
    // Basic properties
    id: nodeData.id,
    label: nodeData.label,
    x: nodeData.x,
    y: nodeData.y,
    parentId: nodeData.parentId,
    // Enhanced properties with defaults
    color: nodeData.color || NODE_COLORS.DEFAULT,
    shape: nodeData.shape || NODE_SHAPES.CIRCLE,
    tags: nodeData.tags || [],
    icon: nodeData.icon || NODE_ICONS.NONE,
    fontSize: nodeData.fontSize || 16,
    fontWeight: nodeData.fontWeight || 'normal',
    fontStyle: nodeData.fontStyle || 'normal',
    isCollapsed: nodeData.isCollapsed || false,
    notes: nodeData.notes || '',
    createdAt: nodeData.createdAt || new Date().toISOString(),
    updatedAt: nodeData.updatedAt || new Date().toISOString()
  };
}

// Update node with enhanced properties
export function updateNode(node, updates) {
  return {
    ...node,
    ...updates,
    updatedAt: new Date().toISOString()
  };
}

// Get node display text (with icon if present)
export function getNodeDisplayText(node) {
  if (node.icon && node.icon !== NODE_ICONS.NONE) {
    return `${node.icon} ${node.label}`;
  }
  return node.label;
}

// Get border color for node
export function getNodeBorderColor(node, theme) {
  if (node.color && NODE_COLOR_INFO[node.color]) {
    return NODE_COLOR_INFO[node.color].border;
  }
  return theme.colors.nodeBorder;
}

// Check if node has tags
export function hasTag(node, tagId) {
  return node.tags && node.tags.includes(tagId);
}

// Add tag to node
export function addTag(node, tagId) {
  if (!node.tags) {
    return { ...node, tags: [tagId] };
  }
  if (node.tags.includes(tagId)) {
    return node; // Tag already exists
  }
  return { ...node, tags: [...node.tags, tagId] };
}

// Remove tag from node
export function removeTag(node, tagId) {
  if (!node.tags) {
    return node;
  }
  return { ...node, tags: node.tags.filter(id => id !== tagId) };
}

// Get all unique tags from nodes array
export function getAllTags(nodes) {
  const tagSet = new Set();
  nodes.forEach(node => {
    if (node.tags) {
      node.tags.forEach(tag => tagSet.add(tag));
    }
  });
  return Array.from(tagSet);
}

// Filter nodes by tag
export function filterNodesByTag(nodes, tagId) {
  return nodes.filter(node => hasTag(node, tagId));
}

// Get child nodes (for collapsing functionality)
export function getChildNodes(nodes, parentId) {
  return nodes.filter(node => node.parentId === parentId);
}

// Get all descendant nodes (recursive)
export function getDescendantNodes(nodes, parentId) {
  const descendants = [];
  const children = getChildNodes(nodes, parentId);
  
  children.forEach(child => {
    descendants.push(child);
    descendants.push(...getDescendantNodes(nodes, child.id));
  });
  
  return descendants;
}

// Check if node should be visible (considering collapsed parents)
export function isNodeVisible(nodes, node) {
  if (!node.parentId) {
    return true; // Root nodes are always visible
  }
  
  const parent = nodes.find(n => n.id === node.parentId);
  if (!parent) {
    return true; // Orphaned nodes are visible
  }
  
  if (parent.isCollapsed) {
    return false; // Hidden by collapsed parent
  }
  
  return isNodeVisible(nodes, parent); // Check recursively
}

// Get visible nodes (filtering out collapsed children)
export function getVisibleNodes(nodes) {
  return nodes.filter(node => isNodeVisible(nodes, node));
}

// Convert legacy nodes to enhanced format
export function upgradeNode(legacyNode) {
  if (legacyNode.color !== undefined) {
    return legacyNode; // Already upgraded
  }
  
  return createEnhancedNode(legacyNode);
}

// Ensure all nodes in array are upgraded
export function upgradeNodes(nodes) {
  return nodes.map(upgradeNode);
}