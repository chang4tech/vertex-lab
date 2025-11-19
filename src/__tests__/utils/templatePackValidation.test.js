import { describe, it, expect } from 'vitest';
import { validateTemplatePack } from '../../utils/templatePackValidation.js';

describe('templatePackValidation', () => {
  it('accepts a minimal valid pack', () => {
    const pack = { meta: { name: 'Example' }, tags: [], nodes: [], edges: [] };
    const errs = validateTemplatePack(pack);
    expect(errs.length).toBe(0);
  });

  it('rejects invalid shapes', () => {
    const pack = { meta: {}, requires: { plugins: {} }, tags: {}, nodes: {}, edges: {} };
    const errs = validateTemplatePack(pack);
    expect(errs.some(e => e.includes('meta.name is required'))).toBe(true);
    expect(errs.some(e => e.includes('requires.plugins must be an array'))).toBe(true);
    expect(errs.some(e => e.includes('tags must be an array'))).toBe(true);
    expect(errs.some(e => e.includes('nodes must be an array'))).toBe(true);
    expect(errs.some(e => e.includes('edges must be an array'))).toBe(true);
  });
});

