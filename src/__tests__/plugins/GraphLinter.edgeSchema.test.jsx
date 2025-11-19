import { describe, it, expect } from 'vitest';
import { schemaEdgeChecks } from '../../plugins/examples/graphLinterPlugin.jsx';

describe('GraphLinter schemaEdgeChecks', () => {
  const nodes = [
    { id: 1, label: 'A', type: 'Paper' },
    { id: 2, label: 'B', type: 'Paper' },
    { id: 3, label: 'C', type: 'Person' },
    { id: 4, label: 'D', type: 'Task' },
  ];

  it('flags unknown edge type', () => {
    const edges = [{ source: 1, target: 2, directed: true, type: 'rel' }];
    const schema = { types: [], edgeTypes: [{ name: 'cites', directed: true }] };
    const issues = schemaEdgeChecks(nodes, edges, schema);
    expect(issues.some((i) => i.rule === 'unknownEdgeType')).toBe(true);
  });

  it('flags source/target type mismatches', () => {
    const edges = [
      { source: 3, target: 2, directed: true, type: 'cites' }, // src mismatch (Person not allowed)
      { source: 1, target: 4, directed: true, type: 'cites' }, // dst mismatch (Task not allowed)
    ];
    const schema = { types: [], edgeTypes: [{ name: 'cites', directed: true, sourceTypes: ['Paper'], targetTypes: ['Paper'] }] };
    const issues = schemaEdgeChecks(nodes, edges, schema);
    const mismatch = issues.filter((i) => i.rule === 'edgeTypeMismatch');
    expect(mismatch.length).toBeGreaterThanOrEqual(2);
    expect(mismatch.some((i) => /source type mismatch/i.test(i.message))).toBe(true);
    expect(mismatch.some((i) => /target type mismatch/i.test(i.message))).toBe(true);
  });

  it('flags relation cycles when noCycle is true', () => {
    const edges = [
      { source: 1, target: 2, directed: true, type: 'depends_on' },
      { source: 2, target: 1, directed: true, type: 'depends_on' },
    ];
    const schema = { types: [], edgeTypes: [{ name: 'depends_on', directed: true, noCycle: true }] };
    const issues = schemaEdgeChecks(nodes, edges, schema);
    const cycles = issues.filter((i) => i.rule === 'relationCycle' && i.edgeType === 'depends_on');
    expect(cycles.length).toBeGreaterThanOrEqual(2); // both nodes in the cycle flagged
    const nodeIds = new Set(cycles.map((c) => c.nodeId));
    expect(nodeIds.has(1)).toBe(true);
    expect(nodeIds.has(2)).toBe(true);
  });
});

