export const PLUGIN_PREFS_KEY = 'vertex_plugins_enabled';

export function loadPluginPrefs(defaultPlugins = []) {
  try {
    const raw = localStorage.getItem(PLUGIN_PREFS_KEY);
    if (!raw) {
      // default: all provided plugins enabled
      const defaults = {};
      defaultPlugins.forEach(p => { defaults[p.id] = true; });
      return defaults;
    }
    const parsed = JSON.parse(raw);
    // Ensure any new default plugins are enabled if not present in prefs
    defaultPlugins.forEach(p => {
      if (!(p.id in parsed)) parsed[p.id] = true;
    });
    return parsed;
  } catch {
    const defaults = {};
    defaultPlugins.forEach(p => { defaults[p.id] = true; });
    return defaults;
  }
}

export function savePluginPrefs(prefs) {
  try { localStorage.setItem(PLUGIN_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

/**
 * Detect conflicts between plugins based on their conflicts field.
 * Returns an array of conflict objects describing which plugins conflict with each other.
 * @param {Array} plugins - Array of all available plugins
 * @param {Object} pluginPrefs - Object mapping plugin IDs to enabled/disabled state
 * @returns {Array<{pluginId: string, conflictsWith: string[], enabledConflicts: string[]}>}
 */
export function detectPluginConflicts(plugins, pluginPrefs = {}) {
  const conflicts = [];
  const enabledPlugins = plugins.filter(p => pluginPrefs[p.id] !== false);

  for (const plugin of enabledPlugins) {
    if (!plugin.conflicts || !Array.isArray(plugin.conflicts) || plugin.conflicts.length === 0) {
      continue;
    }

    // Find which conflicting plugins are currently enabled
    const enabledConflicts = plugin.conflicts.filter(conflictId => {
      const conflictingPlugin = plugins.find(p => p.id === conflictId);
      return conflictingPlugin && pluginPrefs[conflictId] !== false;
    });

    if (enabledConflicts.length > 0) {
      conflicts.push({
        pluginId: plugin.id,
        conflictsWith: plugin.conflicts,
        enabledConflicts
      });
    }
  }

  return conflicts;
}

/**
 * Check if enabling a plugin would create conflicts with currently enabled plugins.
 * @param {string} pluginId - ID of the plugin to check
 * @param {Array} plugins - Array of all available plugins
 * @param {Object} pluginPrefs - Current plugin preferences
 * @returns {{hasConflict: boolean, conflicts: string[]}}
 */
export function checkPluginConflicts(pluginId, plugins, pluginPrefs = {}) {
  const plugin = plugins.find(p => p.id === pluginId);
  if (!plugin) {
    return { hasConflict: false, conflicts: [] };
  }

  // Check if any of the conflicting plugins are currently enabled
  const enabledConflicts = (plugin.conflicts && Array.isArray(plugin.conflicts))
    ? plugin.conflicts.filter(conflictId => pluginPrefs[conflictId] !== false)
    : [];

  // Also check if any enabled plugin lists this plugin as a conflict
  const reverseConflicts = plugins
    .filter(p => pluginPrefs[p.id] !== false && p.id !== pluginId)
    .filter(p => p.conflicts && Array.isArray(p.conflicts) && p.conflicts.includes(pluginId))
    .map(p => p.id);

  const allConflicts = [...new Set([...enabledConflicts, ...reverseConflicts])];

  return {
    hasConflict: allConflicts.length > 0,
    conflicts: allConflicts
  };
}

