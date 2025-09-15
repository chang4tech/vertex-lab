import { describe, it, expect } from 'vitest';
import { validatePlugin } from '../../utils/customPluginLoader.js';

describe('customPluginLoader.validatePlugin', () => {
  it('accepts a minimal valid plugin object', () => {
    const plugin = {
      id: 'test.valid',
      slots: {
        sidePanels: [
          { id: 'panel', render: () => null }
        ]
      }
    };
    expect(validatePlugin(plugin)).toBe(true);
  });

  it('accepts plugin without slots (no contributions)', () => {
    const plugin = { id: 'test.noslots' };
    expect(validatePlugin(plugin)).toBe(true);
  });

  it('rejects invalid shapes', () => {
    expect(validatePlugin(null)).toBe(false);
    expect(validatePlugin({})).toBe(false); // missing id
    expect(validatePlugin({ id: '' })).toBe(false);
    expect(validatePlugin({ id: 'x', slots: [] })).toBe(false); // slots must be object
    expect(validatePlugin({ id: 'x', slots: { sidePanels: {} } })).toBe(false); // sidePanels must be array
    expect(validatePlugin({ id: 'x', slots: { sidePanels: [null] } })).toBe(false);
    expect(validatePlugin({ id: 'x', slots: { sidePanels: [{ id: '' }] } })).toBe(false);
    expect(validatePlugin({ id: 'x', slots: { sidePanels: [{ id: 'a' }] } })).toBe(false); // missing render
    expect(validatePlugin({ id: 'x', slots: { sidePanels: [{ id: 'a', render: 123 }] } })).toBe(false);
    expect(validatePlugin({ id: 'x', slots: { sidePanels: [{ id: 'a', render: () => null, visible: 'no' }] } })).toBe(false);
  });
});

