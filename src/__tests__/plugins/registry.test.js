import { describe, it, expect, vi } from 'vitest';
import { mergePlugins } from '../../plugins/registry.js';

describe('mergePlugins', () => {
  it('dedupes by id and preserves first occurrence order', () => {
    const a = { id: 'core.a' };
    const b = { id: 'core.b' };
    const b2 = { id: 'core.b', name: 'duplicate' };
    const c = { id: 'custom.c' };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const merged = mergePlugins([a, b], [b2, c]);
    expect(merged.map(p => p.id)).toEqual(['core.a', 'core.b', 'custom.c']);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

