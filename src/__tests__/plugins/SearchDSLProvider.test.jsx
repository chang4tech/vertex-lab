import { describe, it, expect } from 'vitest';
import { searchDSLProviderPlugin } from '../../plugins/examples/searchDSLProviderPlugin.jsx';

describe('Search DSL Provider', () => {
  const provider = searchDSLProviderPlugin.slots.searchProviders[0];
  const nodes = [
    { id: 1, label: 'Alpha', type: 'Paper', year: 2021, tags: ['ml'] },
    { id: 2, label: 'Beta', type: 'Paper', year: 2019, tags: ['nlp'] },
    { id: 3, label: 'Gamma', type: 'Person', tags: ['ml'] },
  ];

  it('filters by type and numeric comparison', () => {
    const res = provider.search('type:Paper year>=2020', nodes);
    const ids = res.map(r => r.node.id).sort();
    expect(ids).toEqual([1]);
  });

  it('filters by tag', () => {
    const res = provider.search('tag:ml', nodes);
    const ids = res.map(r => r.node.id).sort();
    expect(ids).toEqual([1, 3]);
  });

  it('supports quoted strings for label contains', () => {
    const res = provider.search('label:"Alpha"', nodes);
    const ids = res.map(r => r.node.id);
    expect(ids).toEqual([1]);
  });

  it('returns empty for unknown property', () => {
    const res = provider.search('foo:bar', nodes);
    expect(res.length).toBe(0);
  });
});

