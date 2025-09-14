// List of common browser shortcuts that might conflict
const BROWSER_SHORTCUTS = [
  { key: 'n', modifiers: ['cmd'], description: 'New Window' },
  { key: 'n', modifiers: ['ctrl'], description: 'New Window' },
  { key: 't', modifiers: ['cmd'], description: 'New Tab' },
  { key: 't', modifiers: ['ctrl'], description: 'New Tab' },
  { key: 'w', modifiers: ['cmd'], description: 'Close Tab' },
  { key: 'w', modifiers: ['ctrl'], description: 'Close Tab' },
  { key: 'r', modifiers: ['cmd'], description: 'Reload' },
  { key: 'r', modifiers: ['ctrl'], description: 'Reload' },
  { key: 'f', modifiers: ['cmd'], description: 'Find' },
  { key: 'f', modifiers: ['ctrl'], description: 'Find' },
  { key: 'p', modifiers: ['cmd'], description: 'Print' },
  { key: 'p', modifiers: ['ctrl'], description: 'Print' },
  { key: 's', modifiers: ['cmd'], description: 'Save Page' },
  { key: 's', modifiers: ['ctrl'], description: 'Save Page' },
  { key: 'a', modifiers: ['cmd'], description: 'Select All' },
  { key: 'a', modifiers: ['ctrl'], description: 'Select All' },
  { key: '+', modifiers: ['cmd'], description: 'Zoom In' },
  { key: '+', modifiers: ['ctrl'], description: 'Zoom In' },
  { key: '-', modifiers: ['cmd'], description: 'Zoom Out' },
  { key: '-', modifiers: ['ctrl'], description: 'Zoom Out' },
  { key: '0', modifiers: ['cmd'], description: 'Reset Zoom' },
  { key: '0', modifiers: ['ctrl'], description: 'Reset Zoom' }
];

// List of our app's shortcuts
export const APP_SHORTCUTS = [
  // File
  { key: 'n', modifiers: ['cmd', 'shift'], description: 'New Diagram' },
  { key: 'n', modifiers: ['ctrl', 'shift'], description: 'New Diagram' },
  { key: 's', modifiers: ['cmd'], description: 'Export JSON' },
  { key: 's', modifiers: ['ctrl'], description: 'Export JSON' },
  { key: 's', modifiers: ['cmd', 'shift'], description: 'Export PNG' },
  { key: 's', modifiers: ['ctrl', 'shift'], description: 'Export PNG' },
  { key: 'o', modifiers: ['cmd', 'shift'], description: 'Import JSON' },
  { key: 'o', modifiers: ['ctrl', 'shift'], description: 'Import JSON' },

  // Edit
  { key: 'z', modifiers: ['cmd'], description: 'Undo' },
  { key: 'z', modifiers: ['ctrl'], description: 'Undo' },
  { key: 'z', modifiers: ['cmd', 'shift'], description: 'Redo' },
  { key: 'z', modifiers: ['ctrl', 'shift'], description: 'Redo' },
  { key: 'l', modifiers: ['cmd'], description: 'Auto Layout' },
  { key: 'l', modifiers: ['ctrl'], description: 'Auto Layout' },
  { key: 'f', modifiers: ['cmd'], description: 'Search' },
  { key: 'f', modifiers: ['ctrl'], description: 'Search' },

  // View
  { key: '+', modifiers: ['alt'], description: 'Zoom In' },
  { key: '=', modifiers: ['alt'], description: 'Zoom In' },
  { key: '-', modifiers: ['alt'], description: 'Zoom Out' },
  { key: '0', modifiers: ['alt'], description: 'Reset Zoom' },
  { key: 'c', modifiers: ['alt'], description: 'Center Diagram' },
  { key: 'i', modifiers: ['cmd'], description: 'Toggle Node Info Panel' },
  { key: 'i', modifiers: ['ctrl'], description: 'Toggle Node Info Panel' },
  { key: 'm', modifiers: [], description: 'Toggle Minimap' },

  // Selection / editing
  { key: 'Delete', modifiers: [], description: 'Delete Selected' },
  { key: 'Backspace', modifiers: [], description: 'Delete Selected' },
  { key: 'F2', modifiers: [], description: 'Edit Node' },
];

/**
 * Checks if two shortcut combinations conflict
 * @param {Object} shortcut1 - { key: string, modifiers: string[] }
 * @param {Object} shortcut2 - { key: string, modifiers: string[] }
 * @returns {boolean}
 */
const doShortcutsConflict = (shortcut1, shortcut2) => {
  if (shortcut1.key !== shortcut2.key) return false;
  
  const modifiers1 = new Set(shortcut1.modifiers);
  const modifiers2 = new Set(shortcut2.modifiers);
  
  if (modifiers1.size !== modifiers2.size) return false;
  
  return Array.from(modifiers1).every(mod => modifiers2.has(mod));
};

/**
 * Get all shortcut conflicts between our app and browser shortcuts
 * @returns {Array<{appShortcut: Object, browserShortcut: Object}>}
 */
export const findShortcutConflicts = () => {
  const conflicts = [];
  
  for (const appShortcut of APP_SHORTCUTS) {
    for (const browserShortcut of BROWSER_SHORTCUTS) {
      if (doShortcutsConflict(appShortcut, browserShortcut)) {
        conflicts.push({
          appShortcut,
          browserShortcut
        });
      }
    }
  }
  
  return conflicts;
};

/**
 * Returns an object mapping each key to its shortcuts
 * @returns {Object.<string, Array<{key: string, modifiers: string[], description: string}>>}
 */
export const getShortcutsByKey = () => {
  const shortcutMap = {};
  
  for (const shortcut of APP_SHORTCUTS) {
    if (!shortcutMap[shortcut.key]) {
      shortcutMap[shortcut.key] = [];
    }
    shortcutMap[shortcut.key].push(shortcut);
  }
  
  return shortcutMap;
};

/**
 * Format a shortcut combination for display
 * @param {Object} shortcut - { key: string, modifiers: string[] }
 * @returns {string}
 */
export const formatShortcut = (shortcut) => {
  const modifierSymbols = {
    cmd: '⌘',
    ctrl: 'Ctrl',
    shift: '⇧',
    alt: '⌥'
  };
  
  const modifierText = shortcut.modifiers
    .map(mod => modifierSymbols[mod] || mod)
    .join(' + ');
    
  const keyText = shortcut.key.length === 1 ? 
    shortcut.key.toUpperCase() : 
    shortcut.key;
    
  return modifierText ? `${modifierText} + ${keyText}` : keyText;
};
