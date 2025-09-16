import { describe, it, expect, vi } from 'vitest';
import { neighborsHighlighterPlugin } from '../../plugins/core/neighborsHighlighterPlugin.jsx';

describe('neighborsHighlighterPlugin commands', () => {
  it('computes neighbors via edges and highlights them', () => {
    const cmd = neighborsHighlighterPlugin.slots.commands.find(c => c.id === 'neighbors.highlight');
    const setHighlightedNodes = vi.fn();
    const api = {
      nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      edges: [{ source: 'a', target: 'b' }, { source: 'c', target: 'a' }],
      setHighlightedNodes,
    };
    cmd.run(api, { nodeId: 'a' });
    // neighbors of a are b and c
    expect(setHighlightedNodes).toHaveBeenCalledWith(expect.arrayContaining(['b', 'c']));
  });

  it('clears highlights on canvas command', () => {
    const cmd = neighborsHighlighterPlugin.slots.commands.find(c => c.id === 'neighbors.clear');
    const setHighlightedNodes = vi.fn();
    cmd.run({ setHighlightedNodes }, {});
    expect(setHighlightedNodes).toHaveBeenCalledWith([]);
  });
});

