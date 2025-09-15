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

