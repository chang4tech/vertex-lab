import { describe, it, expect } from 'vitest';
import { findNextConnectedNode } from '../../utils/navigationUtils.js';

const sampleGraph = () => {
  const nodes = [
    { id: 1, level: 1, x: 0, y: 0 },
    { id: 2, level: 1, x: -120, y: 0 },
    { id: 3, level: 1, x: 140, y: 0 },
    { id: 4, level: 0, x: 0, y: -160 },
    { id: 5, level: 2, x: 60, y: 160 },
    { id: 6, level: 2, x: 200, y: 140 },
  ];

  const edges = [
    { source: 1, target: 2, directed: false },
    { source: 1, target: 3, directed: false },
    { source: 1, target: 4, directed: false },
    { source: 1, target: 5, directed: false },
    { source: 5, target: 6, directed: false },
  ];

  return { nodes, edges };
};

describe('navigationUtils.findNextConnectedNode', () => {
  it('moves to the nearest same-level neighbor on ArrowRight', () => {
    const { nodes, edges } = sampleGraph();
    const target = findNextConnectedNode({ nodes, edges, referenceId: 1, direction: 'ArrowRight' });
    expect(target?.id).toBe(3);
  });

  it('moves to the nearest same-level neighbor on ArrowLeft', () => {
    const { nodes, edges } = sampleGraph();
    const target = findNextConnectedNode({ nodes, edges, referenceId: 1, direction: 'ArrowLeft' });
    expect(target?.id).toBe(2);
  });

  it('wraps horizontally when no neighbor is past the reference', () => {
    const { nodes, edges } = sampleGraph();
    const target = findNextConnectedNode({ nodes, edges, referenceId: 2, direction: 'ArrowLeft' });
    expect(target?.id).toBe(1);
  });

  it('prefers shallower connected nodes on ArrowUp', () => {
    const { nodes, edges } = sampleGraph();
    const target = findNextConnectedNode({ nodes, edges, referenceId: 1, direction: 'ArrowUp' });
    expect(target?.id).toBe(4);
  });

  it('prefers deeper connected nodes on ArrowDown', () => {
    const { nodes, edges } = sampleGraph();
    const target = findNextConnectedNode({ nodes, edges, referenceId: 1, direction: 'ArrowDown' });
    expect(target?.id).toBe(5);
  });

  it('uses the current preview as the next reference point', () => {
    const { nodes, edges } = sampleGraph();
    const first = findNextConnectedNode({ nodes, edges, referenceId: 5, direction: 'ArrowRight' });
    expect(first?.id).toBe(6);
    const second = findNextConnectedNode({ nodes, edges, referenceId: 6, direction: 'ArrowLeft' });
    expect(second?.id).toBe(5);
  });

  it('returns null when no connected node matches the direction', () => {
    const { nodes, edges } = sampleGraph();
    const target = findNextConnectedNode({ nodes, edges, referenceId: 3, direction: 'ArrowUp' });
    expect(target).toBeNull();
  });

  it('supports string-based identifiers', () => {
    const { nodes, edges } = sampleGraph();
    const target = findNextConnectedNode({ nodes, edges, referenceId: '1', direction: 'ArrowRight' });
    expect(target?.id).toBe(3);
  });
});
