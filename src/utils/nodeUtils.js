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

// Dark theme variants of node colors
export const NODE_COLORS_DARK = {
  DEFAULT: '#2d2d2d',
  BLUE: '#1e3a8a',
  GREEN: '#166534',
  YELLOW: '#a16207',
  ORANGE: '#c2410c',
  RED: '#dc2626',
  PURPLE: '#7c2d12',
  PINK: '#be185d',
  TEAL: '#0f766e',
  INDIGO: '#3730a3',
  BROWN: '#78350f',
  GRAY: '#374151'
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

// Priority levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

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
    level: options.level ?? 0,
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
    level: nodeData.level ?? 0,
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

// Calculate luminance of a color (for text contrast)
function getLuminance(color) {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Apply gamma correction
  const gamma = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
}

// Get theme-appropriate node color
export function getThemeNodeColor(node, theme) {
  if (!node.color) {
    return theme.colors.nodeBackground;
  }
  
  // If it's a dark theme and the node uses a predefined light color, use dark variant
  if (theme.id === 'dark') {
    const colorKey = Object.keys(NODE_COLORS).find(key => NODE_COLORS[key] === node.color);
    if (colorKey && NODE_COLORS_DARK[colorKey]) {
      return NODE_COLORS_DARK[colorKey];
    }
  }
  
  return node.color;
}

// Get appropriate text color for node based on background color
export function getNodeTextColor(node, theme) {
  const backgroundColor = getThemeNodeColor(node, theme);
  
  // Calculate contrast ratio
  const bgLuminance = getLuminance(backgroundColor);
  
  // Use dark text for light backgrounds, light text for dark backgrounds
  // Threshold of 0.5 works well for most cases
  if (bgLuminance > 0.5) {
    return '#333333'; // Dark text for light backgrounds
  } else {
    return '#ffffff'; // Light text for dark backgrounds
  }
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
  if (!Array.isArray(nodes) || parentId == null) return [];

  const hasHierarchy = nodes.some(node => node?.parentId != null);
  if (hasHierarchy) {
    return nodes.filter(node => node?.parentId === parentId);
  }

  const parent = nodes.find(node => node.id === parentId);
  if (!parent) return [];
  const parentLevel = parent.level ?? 0;
  const targetLevel = parentLevel + 1;
  return nodes.filter(node => (node.level ?? 0) === targetLevel);
}

// Get all descendant nodes (recursive)
export function getDescendantNodes(nodes, parentId) {
  if (!Array.isArray(nodes) || parentId == null) return [];

  const hasHierarchy = nodes.some(node => node?.parentId != null);
  if (hasHierarchy) {
    const descendants = [];
    const queue = [parentId];
    const visited = new Set(queue);
    let cursor = 0;

    while (cursor < queue.length) {
      const currentId = queue[cursor++];
      nodes.forEach(node => {
        if (node?.parentId === currentId && !visited.has(node.id)) {
          visited.add(node.id);
          descendants.push(node);
          queue.push(node.id);
        }
      });
    }

    return descendants;
  }

  const parent = nodes.find(node => node.id === parentId);
  if (!parent) return [];
  const parentLevel = parent.level ?? 0;
  return nodes.filter(node => (node.level ?? 0) > parentLevel);
}

// Check if node should be visible (considering collapsed parents)
export function isNodeVisible(nodes, node) {
  if (!node) return false;

  const hasHierarchy = nodes.some(n => n?.parentId != null);
  if (!hasHierarchy) {
    const nodeLevel = node.level ?? 0;
    return !nodes.some(n => n?.isCollapsed && (n.level ?? 0) < nodeLevel);
  }

  const nodeMap = new Map();
  nodes.forEach(n => {
    if (n?.id != null) {
      nodeMap.set(n.id, n);
    }
  });

  const visited = new Set();
  let currentParentId = node.parentId;
  while (currentParentId != null && !visited.has(currentParentId)) {
    visited.add(currentParentId);
    const parent = nodeMap.get(currentParentId);
    if (!parent) break;
    if (parent.isCollapsed) {
      return false;
    }
    currentParentId = parent.parentId ?? null;
  }

  return true;
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
