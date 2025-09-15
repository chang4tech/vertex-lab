import { describe, it, expect } from 'vitest';
import { filterCommandsForContext } from '../../plugins/commands.js';

describe('commands predicate with api', () => {
  it('uses api in when-function to filter', () => {
    const cmds = [
      { id: 'c1', title: 'Needs selection', when: (api) => (api?.selectedNodeIds?.length ?? 0) > 0, run: () => {} },
      { id: 'c2', title: 'Always', run: () => {} },
    ];
    const withSel = filterCommandsForContext(cmds, { selectedNodeIds: ['a'] }, {});
    expect(withSel.map(c => c.id)).toEqual(['c1', 'c2']);
    const noSel = filterCommandsForContext(cmds, { selectedNodeIds: [] }, {});
    expect(noSel.map(c => c.id)).toEqual(['c2']);
  });
});

