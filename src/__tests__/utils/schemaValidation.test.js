import { describe, it, expect } from 'vitest';
import { validateSchema } from '../../utils/schemaValidation.js';

describe('schemaValidation', () => {
  it('accepts a valid schema', () => {
    const schema = {
      types: [
        { name: 'Paper', color: '#1e3a8a', properties: [
          { name: 'year', type: 'number', required: true },
          { name: 'authors', type: 'string[]' },
        ]}
      ],
      edgeTypes: [ { name: 'cites', directed: true, sourceTypes: ['Paper'], targetTypes: ['Paper'] } ]
    };
    const errs = validateSchema(schema);
    expect(errs.length).toBe(0);
  });

  it('rejects duplicates and invalid types', () => {
    const schema = {
      types: [
        { name: 'Paper', properties: [ { name: 'x', type: 'number' }, { name: 'x', type: 'number' } ] },
        { name: 'paper' },
      ],
      edgeTypes: 'oops'
    };
    const errs = validateSchema(schema);
    expect(errs.some(e => e.includes('Duplicate type name'))).toBe(true);
    expect(errs.some(e => e.includes('properties must be an array')) || errs.some(e => e.includes('edgeTypes must be an array'))).toBe(true);
  });
});

