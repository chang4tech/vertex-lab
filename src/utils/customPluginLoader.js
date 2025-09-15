const CUSTOM_PLUGIN_STORAGE_KEY = 'vertex_custom_plugins';

function readStoredCodes() {
  try {
    const raw = localStorage.getItem(CUSTOM_PLUGIN_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeStoredCodes(codes) {
  try {
    localStorage.setItem(CUSTOM_PLUGIN_STORAGE_KEY, JSON.stringify(codes));
  } catch {}
}

export function getStoredCustomPluginCodes() {
  return readStoredCodes();
}

export function removeStoredCustomPluginCodeById(id) {
  const codes = readStoredCodes();
  const next = codes.filter((item) => item && item.id !== id);
  writeStoredCodes(next);
}

export async function importPluginFromCode(code) {
  // Create a Blob URL and import it as an ES module.
  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  try {
    const mod = await import(/* @vite-ignore */ url);
    const plugin = mod.default || mod.plugin || Object.values(mod).find((v) => v && typeof v === 'object' && v.id);
    if (!validatePlugin(plugin)) throw new Error('Invalid plugin export');
    return plugin;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function validatePlugin(plugin) {
  if (!plugin || typeof plugin !== 'object') return false;
  if (typeof plugin.id !== 'string' || !plugin.id) return false;
  if (plugin.slots && typeof plugin.slots !== 'object') return false;
  const panels = plugin.slots?.sidePanels;
  if (panels && !Array.isArray(panels)) return false;
  if (Array.isArray(panels)) {
    for (const p of panels) {
      if (!p || typeof p !== 'object') return false;
      if (typeof p.id !== 'string' || !p.id) return false;
      if (typeof p.render !== 'function') return false;
      if (p.visible && typeof p.visible !== 'function') return false;
    }
  }
  return true;
}

export async function addCustomPluginCode(code) {
  const plugin = await importPluginFromCode(code);
  const codes = readStoredCodes();
  // Prevent duplicate by id
  if (!codes.find((item) => item && item.id === plugin.id)) {
    codes.push({ id: plugin.id, name: plugin.name || plugin.id, code });
    writeStoredCodes(codes);
  }
  return plugin;
}

export async function loadCustomPluginsFromStorage() {
  const codes = readStoredCodes();
  const plugins = [];
  for (const item of codes) {
    if (!item || !item.code) continue;
    try {
      const plugin = await importPluginFromCode(item.code);
      plugins.push(plugin);
    } catch {
      // Skip invalid or failed imports
    }
  }
  return plugins;
}

