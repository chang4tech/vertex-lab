import pluginConfig from './pluginConfig.json';

const pluginModules = import.meta.glob('./**/*.jsx', { eager: true });

function resolvePlugin(path) {
  const mod = pluginModules[path];
  if (!mod) {
    console.warn(`[plugins] Module '${path}' not found`);
    return null;
  }
  if (mod.default) return mod.default;
  const candidate = Object.values(mod).find((value) => value && typeof value === 'object' && 'id' in value);
  if (!candidate) {
    console.warn(`[plugins] Module '${path}' does not export a plugin object`);
    return null;
  }
  return candidate;
}

const loadPlugins = (paths = []) => paths.map(resolvePlugin).filter(Boolean);

export const corePlugins = loadPlugins(pluginConfig.core);
export const bundledCustomPlugins = loadPlugins(pluginConfig.bundled);
