import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { levelsPlugin } from '../../plugins/core/levelsPlugin.jsx';

describe('levelsPlugin', () => {
  const [setLevelCommand, clearParentsCommand] = levelsPlugin.slots.commands;

  beforeEach(() => {
    vi.spyOn(window, 'prompt').mockReturnValue('3');
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets level on a node and clears parent', () => {
    const updateNodes = vi.fn((updater) => {
      const next = updater([{ id: 1, parentId: 5 }]);
      expect(next).toEqual([{ id: 1, parentId: null, level: 3 }]);
    });
    const selectNodes = vi.fn();
    const setHighlightedNodes = vi.fn();
    const api = {
      nodes: [{ id: 1, parentId: 5 }],
      selectedNodeIds: [1],
      updateNodes,
      selectNodes,
      setHighlightedNodes,
    };

    setLevelCommand.run(api, { nodeId: 1 });

    expect(updateNodes).toHaveBeenCalledTimes(1);
    expect(selectNodes).toHaveBeenCalledWith([1], { center: true });
    expect(setHighlightedNodes).toHaveBeenCalledWith([1]);
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('clears parent links across nodes', () => {
    const updateNodes = vi.fn((updater) => {
      const next = updater([
        { id: 1, parentId: 2 },
        { id: 2, parentId: null },
      ]);
      expect(next).toEqual([
        { id: 1, parentId: null },
        { id: 2, parentId: null },
      ]);
    });

    const api = {
      nodes: [{ id: 1, parentId: 2 }, { id: 2, parentId: null }],
      updateNodes,
    };

    clearParentsCommand.run(api);

    expect(updateNodes).toHaveBeenCalledTimes(1);
  });
});
