import { describe, it, expect } from 'vitest';
import { aggregateSearchResults } from '../../utils/searchEngine.js';

describe('aggregateSearchResults', () => {
  const nodes = [
    { id: 1, label: 'Alpha Beta' },
    { id: 2, label: 'Gamma Alpha' },
    { id: 3, label: 'Alphanumeric' },
  ];

  it('falls back to default search and sorts prefix before mid-string', () => {
    const results = aggregateSearchResults('Al', nodes, []);
    expect(results.map(r => r.node.id)).toEqual([1, 3, 2]);
  });

  it('allows a provider to surface an exact match on top', () => {
    const provider = {
      id: 'test.provider',
      search: (q, all) => {
        if (q.toLowerCase() !== 'al') return [];
        const target = all.find(n => n.id === 3);
        return [{ node: target, exact: true, score: 1, matchedIndices: [0,1] }];
      },
    };
    const results = aggregateSearchResults('Al', nodes, [provider]);
    expect(results[0].node.id).toBe(3);
  });
});

