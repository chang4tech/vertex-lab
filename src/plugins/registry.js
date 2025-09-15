// Simple utilities for merging and deduping plugins by id

/**
 * Merge multiple plugin arrays, deduping by id.
 * First occurrence wins; later duplicates are ignored with a console.warn.
 * Preserves order of first appearance across provided arrays.
 * @param  {...Array} lists
 * @returns {Array}
 */
export function mergePlugins(...lists) {
  const seen = new Set();
  const result = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const p of list) {
      if (!p || typeof p !== 'object' || typeof p.id !== 'string') continue;
      if (seen.has(p.id)) {
        console.warn(`[plugins] Duplicate plugin id '${p.id}' ignored`);
        continue;
      }
      seen.add(p.id);
      result.push(p);
    }
  }
  return result;
}

