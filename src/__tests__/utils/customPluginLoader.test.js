import { describe, it, expect } from 'vitest';
import { validatePlugin } from '../../utils/customPluginLoader.js';

describe('customPluginLoader.validatePlugin', () => {
  it('accepts a minimal valid plugin', () => {
    const plugin = {
      id: 'test.minimal',
      slots: {
        sidePanels: [
          { id: 'p', render: () => null }
        ]
      }
    };
    expect(validatePlugin(plugin)).toBe(true);
  });

  it('rejects missing id', () => {
    const plugin = { slots: { sidePanels: [] } };
    expect(validatePlugin(plugin)).toBe(false);
  });

  it('rejects invalid sidePanels', () => {
    const plugin = { id: 'x', slots: { sidePanels: [{ id: 'p' }] } }; // missing render
    expect(validatePlugin(plugin)).toBe(false);
  });
});

