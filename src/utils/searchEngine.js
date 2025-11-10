import { searchNodes as fallbackSearchNodes } from './searchUtils.js';

/**
 * Aggregate results from plugin search providers with a fallback search.
 * Providers return items: { node, score?, exact?, matchedIndices? }
 * We combine results by node, keeping the best scoring record.
 */
export function aggregateSearchResults(query, nodes, providers = [], options = {}) {
  if (!query || !query.trim()) return [];
  const q = query.trim();
  const ql = q.toLowerCase();

  const bestById = new Map();

  const consider = (item) => {
    if (!item || !item.node) return;
    const id = item.node.id;
    const label = String(item.node.label ?? '');
    const prefix = label.toLowerCase().startsWith(ql);
    const rankGroup = item.exact ? 0 : (prefix ? 1 : 2);
    const baseScore = typeof item.score === 'number' ? item.score : 0;
    const rankScore = baseScore + (prefix ? 0.3 : 0) + (item.exact ? 0.5 : 0);
    const enriched = { ...item, prefix, rankGroup, rankScore };

    const prev = bestById.get(id);
    if (!prev) {
      bestById.set(id, enriched);
      return;
    }
    // Keep the better one
    if (enriched.rankGroup < prev.rankGroup) { bestById.set(id, enriched); return; }
    if (enriched.rankGroup > prev.rankGroup) return;
    if (enriched.rankScore > prev.rankScore) { bestById.set(id, enriched); return; }
    if (enriched.rankScore < prev.rankScore) return;
    // Tie-breaker: shorter label, then alphabetical
    const la = String(label).length;
    const lb = String(prev.node.label ?? '').length;
    if (la !== lb) { bestById.set(id, la < lb ? enriched : prev); return; }
    if (String(label).localeCompare(String(prev.node.label ?? '')) < 0) {
      bestById.set(id, enriched);
    }
  };

  // From providers (guarded)
  for (const prov of providers || []) {
    try {
      const list = prov.search(q, nodes) || [];
      for (const item of list) consider(item);
    } catch (err) {
      // Swallow provider errors to keep search resilient
      // console.warn('[search] provider failed', prov?.id, err);
    }
  }

  // Fallback search (ensures baseline behavior)
  const fallbackResults = (options.fallbackSearch || fallbackSearchNodes)(nodes, q);
  for (const r of fallbackResults) consider(r);

  const results = Array.from(bestById.values());
  results.sort((a, b) => {
    if (a.rankGroup !== b.rankGroup) return a.rankGroup - b.rankGroup;
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    return String(a.node.label).localeCompare(String(b.node.label));
  });
  return results;
}

