import { describe, it, expect, vi, afterEach } from 'vitest';
import { randomNodeSelectorPlugin } from '../../plugins/core/randomNodeSelectorPlugin.jsx';

describe('randomNodeSelectorPlugin', () => {
  const command = randomNodeSelectorPlugin.slots.commands[0];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is only available when nodes exist', () => {
    expect(command.when({ nodes: [] })).toBe(false);
    expect(command.when({ nodes: [{ id: 1 }] })).toBe(true);
  });

  it('selects and highlights a random node', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6); // pick second node from list of 2
    const selectNodes = vi.fn();
    const setHighlightedNodes = vi.fn();
    const api = {
      nodes: [{ id: 10 }, { id: 20 }],
      selectNodes,
      setHighlightedNodes,
    };

    command.run(api);

    expect(selectNodes).toHaveBeenCalledWith([20], { center: true });
    expect(setHighlightedNodes).toHaveBeenCalledWith([20]);
  });

  it('falls back to selectNode when selectNodes is unavailable', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25); // pick first node
    const selectNode = vi.fn();
    const api = {
      nodes: [{ id: 'a' }, { id: 'b' }],
      selectNode,
    };

    command.run(api);

    expect(selectNode).toHaveBeenCalledWith('a', { center: true });
  });
});
