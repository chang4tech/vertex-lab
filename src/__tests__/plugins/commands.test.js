import { describe, it, expect } from 'vitest';
import { collectPluginCommands, filterCommandsForContext } from '../../plugins/commands.js';

describe('plugin commands', () => {
  const p = {
    id: 'p1',
    slots: {
      commands: [
        { id: 'c1', title: 'On Node', when: 'node', run: () => {} },
        { id: 'c2', title: 'On Canvas', when: 'canvas', run: () => {} },
        { id: 'c3', title: 'Always', run: () => {} },
      ],
    },
  };

  it('collects commands from plugins', () => {
    const cmds = collectPluginCommands([p]);
    expect(cmds.map(c => c.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('filters by context node/canvas', () => {
    const cmds = collectPluginCommands([p]);
    const nodeCtx = filterCommandsForContext(cmds, {}, { nodeId: 'n1' });
    expect(nodeCtx.some(c => c.id === 'c1')).toBe(true);
    expect(nodeCtx.some(c => c.id === 'c2')).toBe(false);
    const canvasCtx = filterCommandsForContext(cmds, {}, {});
    expect(canvasCtx.some(c => c.id === 'c1')).toBe(false);
    expect(canvasCtx.some(c => c.id === 'c2')).toBe(true);
  });
});

