import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { levelsPlugin } from '../../plugins/core/levelsPlugin.jsx';

const [setLevelCommand, clearParentsCommand] = levelsPlugin.slots.commands;

describe('levelsPlugin', () => {
  beforeEach(() => {
    vi.spyOn(window, 'prompt').mockReturnValue('3');
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets level on a node and clears parent', () => {
    const updateNodes = vi.fn((updater) => {
      const next = updater([{ id: 1, parentId: 5, level: 2 }]);
      expect(next).toEqual([{ id: 1, parentId: null, level: 3 }]);
    });
    const selectNodes = vi.fn();
    const setHighlightedNodes = vi.fn();
    const api = {
      nodes: [{ id: 1, parentId: 5, level: 2 }],
      selectedNodeIds: [1],
      updateNodes,
      selectNodes,
      setHighlightedNodes,
      maxLevel: 5,
    };

    setLevelCommand.run(api, { nodeId: 1 });

    expect(updateNodes).toHaveBeenCalledTimes(1);
    expect(selectNodes).toHaveBeenCalledWith([1], { center: true });
    expect(setHighlightedNodes).toHaveBeenCalledWith([1]);
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('alerts when entered level is invalid', () => {
    window.prompt.mockReturnValue('abc');
    setLevelCommand.run({ selectedNodeIds: [1], updateNodes: vi.fn(), setHighlightedNodes: vi.fn() }, { nodeId: 1 });
    expect(window.alert).toHaveBeenCalledWith('Level must be a valid number.');
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
      nodes: [{ id: 1, parentId: 2, level: 1 }, { id: 2, parentId: null, level: 0 }],
      updateNodes,
      maxLevel: 5,
    };

    clearParentsCommand.run(api);

    expect(updateNodes).toHaveBeenCalledTimes(1);
  });
});
