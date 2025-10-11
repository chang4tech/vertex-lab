import { describe, it, expect } from 'vitest';
import {
  normalizeUndirected,
  hasUndirectedEdge,
  addUndirectedEdge,
  removeUndirectedEdge,
  edgesFromParentIds,
} from '../../utils/edgeUtils.js';

describe('edgeUtils', () => {
  it('normalizes undirected edges by ordering ids', () => {
    expect(normalizeUndirected('b', 'a')).toBe('a-b');
    expect(normalizeUndirected(1, 5)).toBe('1-5');
  });

  it('detects undirected edges regardless of order', () => {
    const edges = [{ source: 'a', target: 'b', directed: false }];
    expect(hasUndirectedEdge(edges, 'b', 'a')).toBe(true);
    expect(hasUndirectedEdge(edges, 'a', 'c')).toBe(false);
  });

  it('adds undirected edges without duplicates and ignores self loops', () => {
    const edges = [{ source: 'a', target: 'b', directed: false }];
    expect(addUndirectedEdge(edges, 'a', 'a')).toBe(edges);
    expect(addUndirectedEdge(edges, 'b', 'a')).toBe(edges);
    const next = addUndirectedEdge(edges, 'b', 'c');
    expect(next).toHaveLength(2);
    expect(next.at(-1)).toEqual({ source: 'b', target: 'c', directed: false });
  });

  it('removes undirected edges by key but preserves directed edges', () => {
    const edges = [
      { source: 'a', target: 'b', directed: false },
      { source: 'a', target: 'b', directed: true },
    ];
    const filtered = removeUndirectedEdge(edges, 'b', 'a');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].directed).toBe(true);
  });

  it('builds edges from parent relationships without duplicates', () => {
    const nodes = [
      { id: 1, parentId: null },
      { id: 2, parentId: 1 },
      { id: 3, parentId: 1 },
      { id: 4, parentId: 2 },
      { id: 5, parentId: 2 },
    ];
    const edges = edgesFromParentIds(nodes);
    expect(edges).toHaveLength(4);
    expect(edges).toContainEqual({ source: 1, target: 2, directed: false });
    expect(edges).toContainEqual({ source: 1, target: 3, directed: false });
  });
});
