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

  it('validates schema.edgeTypes shape and references', () => {
    const valid = {
      meta: { name: 'With Edge Types' },
      schema: {
        types: [{ name: 'Paper' }, { name: 'Concept' }],
        edgeTypes: [
          { name: 'cites', directed: true, sourceTypes: ['Paper'], targetTypes: ['Paper'] },
          { name: 'relates_to', directed: false, sourceTypes: ['Concept'], targetTypes: ['Concept'], noCycle: false },
        ],
      },
    };
    expect(validateTemplatePack(valid).length).toBe(0);

    const invalid = {
      meta: { name: 'Bad Edge Types' },
      schema: {
        types: [{ name: 'Paper' }],
        edgeTypes: [
          { directed: true }, // missing name
          { name: '', directed: 'yes' }, // empty name, wrong directed type
          { name: 'depends_on', directed: true, sourceTypes: ['Task'], targetTypes: ['Paper'] } // Task unknown
        ],
      },
    };
    const errs = validateTemplatePack(invalid);
    expect(errs.some(e => e.includes('schema.edgeTypes[0].name is required'))).toBe(true);
    expect(errs.some(e => e.includes('schema.edgeTypes[1].name is required'))).toBe(true);
    expect(errs.some(e => e.includes('schema.edgeTypes[1].directed must be boolean'))).toBe(true);
    expect(errs.some(e => e.includes("schema.edgeTypes[2].sourceTypes[0] unknown type 'Task'"))).toBe(true);
  });
});
