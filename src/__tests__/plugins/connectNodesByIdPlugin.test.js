import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { connectNodesByIdPlugin } from '../../plugins/core/connectNodesByIdPlugin.jsx';

describe('connectNodesByIdPlugin', () => {
  const command = connectNodesByIdPlugin.slots.commands[0];

  beforeEach(() => {
    vi.spyOn(window, 'prompt').mockReturnValue('2');
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('toggles connection and updates highlights', () => {
    const toggleConnection = vi.fn();
    const setHighlightedNodes = vi.fn();
    const selectNodes = vi.fn();
    const api = {
      nodes: [{ id: 1 }, { id: 2 }],
      toggleConnection,
      setHighlightedNodes,
      selectNodes,
      selectedNodeIds: [1],
    };

    command.run(api, { nodeId: 1 });

    expect(toggleConnection).toHaveBeenCalledWith(1, 2, { shift: false });
    expect(setHighlightedNodes).toHaveBeenCalledWith([1, 2]);
    expect(selectNodes).toHaveBeenCalledWith([1, 2]);
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('alerts when node id not found', () => {
    window.prompt.mockReturnValue('999');
    const toggleConnection = vi.fn();
    const api = { nodes: [{ id: 1 }, { id: 2 }], toggleConnection };

    command.run(api, { nodeId: 1 });

    expect(toggleConnection).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Node not found. Check the ID and try again.');
  });

  it('alerts when attempting to connect node to itself', () => {
    window.prompt.mockReturnValue('1');
    const toggleConnection = vi.fn();
    const api = { nodes: [{ id: 1 }, { id: 2 }], toggleConnection };

    command.run(api, { nodeId: 1 });

    expect(toggleConnection).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Cannot connect a node to itself.');
  });
});
