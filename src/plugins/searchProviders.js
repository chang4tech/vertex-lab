/**
 * Collect search providers from plugins.
 * Provider shape:
 *   { id: string, search: (query, nodes, api?) => Array<{ node, score?: number, exact?: boolean, matchedIndices?: number[] }> }
 */
export function collectSearchProviders(plugins = []) {
  const providers = [];
  for (const p of plugins || []) {
    const list = p?.slots?.searchProviders;
    if (!Array.isArray(list)) continue;
    for (const prov of list) {
      if (!prov || typeof prov !== 'object') continue;
      if (typeof prov.id !== 'string' || !prov.id) continue;
      if (typeof prov.search !== 'function') continue;
      providers.push({ ...prov, pluginId: p.id });
    }
  }
  return providers;
}

