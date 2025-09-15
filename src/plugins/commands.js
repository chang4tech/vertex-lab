/**
 * Collect commands from plugins.
 * Command shape: { id, title, run(api, ctx), when?: 'node' | 'canvas' | ((api, ctx) => boolean) }
 */
export function collectPluginCommands(plugins = []) {
  const cmds = [];
  for (const p of plugins) {
    const list = p?.slots?.commands;
    if (!Array.isArray(list)) continue;
    for (const c of list) {
      if (!c || typeof c !== 'object') continue;
      if (typeof c.id !== 'string' || !c.id) continue;
      if (typeof c.title !== 'string' || !c.title) continue;
      if (typeof c.run !== 'function') continue;
      cmds.push({ ...c, pluginId: p.id });
    }
  }
  return cmds;
}

export function filterCommandsForContext(commands, api, ctx) {
  return commands.filter((c) => {
    if (!c.when) return true;
    if (typeof c.when === 'function') return !!c.when(api, ctx);
    if (c.when === 'node') return !!ctx?.nodeId;
    if (c.when === 'canvas') return !ctx?.nodeId;
    return true;
  });
}

