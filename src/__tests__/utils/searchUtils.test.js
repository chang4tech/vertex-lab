import { fuzzySearch, searchNodes, highlightMatches } from '../../utils/searchUtils';

describe('searchUtils', () => {
  describe('fuzzySearch', () => {
    it('finds exact matches', () => {
      const result = fuzzySearch('test', 'This is a test');
      expect(result.matches).toBe(true);
      expect(result.exact).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.matchedIndices).toEqual([10, 11, 12, 13]);
    });

    it('finds fuzzy matches', () => {
      const result = fuzzySearch('tst', 'test');
      expect(result.matches).toBe(true);
      expect(result.exact).toBe(false);
      expect(result.score).toBeGreaterThan(0.6);
    });

    it('returns no match for unrelated text', () => {
      const result = fuzzySearch('xyz', 'hello world');
      expect(result.matches).toBe(false);
      expect(result.score).toBe(0);
    });

    it('is case insensitive', () => {
      const result = fuzzySearch('TEST', 'this is a test');
      expect(result.matches).toBe(true);
      expect(result.exact).toBe(true);
    });

    it('handles empty inputs', () => {
      expect(fuzzySearch('', 'test').matches).toBe(false);
      expect(fuzzySearch('test', '').matches).toBe(false);
    });
  });

  describe('searchNodes', () => {
    const nodes = [
      { id: 1, label: 'Central Topic' },
      { id: 2, label: 'Branch One' },
      { id: 3, label: 'Branch Two' },
      { id: 4, label: 'Another Branch' },
      { id: 5, label: 'Special Node' }
    ];

    it('finds matching nodes', () => {
      const results = searchNodes(nodes, 'branch');
      expect(results).toHaveLength(3);
      expect(results.map(r => r.node.id)).toEqual([2, 3, 4]);
    });

    it('sorts exact matches first', () => {
      const results = searchNodes(nodes, 'Branch One');
      expect(results[0].node.id).toBe(2);
      expect(results[0].exact).toBe(true);
    });

    it('boosts prefix matches above mid-string matches', () => {
      const custom = [
        { id: 10, label: 'Alpha Beta' },
        { id: 11, label: 'Gamma Alpha' },
        { id: 12, label: 'Alphanumeric' },
      ];
      const results = searchNodes(custom, 'Al');
      expect(results.map(r => r.node.id)).toEqual([10, 12, 11]);
    });

    it('returns empty array for empty query', () => {
      const results = searchNodes(nodes, '');
      expect(results).toHaveLength(0);
    });

    it('returns empty array for no matches', () => {
      const results = searchNodes(nodes, 'xyz123');
      expect(results).toHaveLength(0);
    });
  });

  describe('highlightMatches', () => {
    it('highlights matched characters', () => {
      const result = highlightMatches('hello world', [0, 1, 2, 3, 4]);
      expect(result).toBe('<mark>hello</mark> world');
    });

    it('handles multiple highlight groups', () => {
      const result = highlightMatches('hello world', [0, 1, 6, 7, 8, 9, 10]);
      expect(result).toBe('<mark>he</mark>llo <mark>world</mark>');
    });

    it('returns original text when no matches', () => {
      const result = highlightMatches('hello world', []);
      expect(result).toBe('hello world');
    });

    it('handles single character matches', () => {
      const result = highlightMatches('hello', [1]);
      expect(result).toBe('h<mark>e</mark>llo');
    });
  });
});
