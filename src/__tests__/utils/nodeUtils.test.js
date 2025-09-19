import { describe, it, expect } from 'vitest';
import { 
  createEnhancedNode,
  upgradeNode,
  getVisibleNodes,
  NODE_SHAPES,
  hasTag,
  addTag,
  removeTag,
  getAllTags,
  isNodeVisible
} from '../../utils/nodeUtils';

describe('nodeUtils', () => {
  describe('createEnhancedNode', () => {
    it('should create a node with enhanced properties', () => {
      const basicNode = {
        id: 1,
        label: 'Test Node',
        x: 100,
        y: 200,
        parentId: null
      };

      const enhancedNode = createEnhancedNode(basicNode);

      expect(enhancedNode.id).toBe(1);
      expect(enhancedNode.label).toBe('Test Node');
      expect(enhancedNode.x).toBe(100);
      expect(enhancedNode.y).toBe(200);
      expect(enhancedNode.parentId).toBe(null);
      expect(enhancedNode.shape).toBe(NODE_SHAPES.CIRCLE);
      expect(enhancedNode.color).toBe('#ffffff');
      expect(enhancedNode.tags).toEqual([]);
      expect(enhancedNode.isCollapsed).toBe(false);
    });

    it('should preserve existing enhanced properties', () => {
      const nodeWithProps = {
        id: 2,
        label: 'Custom Node',
        x: 150,
        y: 250,
        parentId: 1,
        shape: NODE_SHAPES.RECTANGLE,
        color: '#FF6B6B',
        tags: ['important'],
        isCollapsed: true
      };

      const enhancedNode = createEnhancedNode(nodeWithProps);

      expect(enhancedNode.shape).toBe(NODE_SHAPES.RECTANGLE);
      expect(enhancedNode.color).toBe('#FF6B6B');
      expect(enhancedNode.tags).toEqual(['important']);
      expect(enhancedNode.isCollapsed).toBe(true);
    });
  });

  describe('upgradeNode', () => {
    it('should upgrade a basic node to enhanced node', () => {
      const basicNode = {
        id: 3,
        label: 'Basic Node',
        x: 300,
        y: 400,
        parentId: 2
      };

      const upgradedNode = upgradeNode(basicNode);

      expect(upgradedNode.shape).toBe(NODE_SHAPES.CIRCLE);
      expect(upgradedNode.color).toBe('#ffffff');
      expect(upgradedNode.tags).toEqual([]);
      expect(upgradedNode.isCollapsed).toBe(false);
    });
  });

  describe('getVisibleNodes', () => {
    it('should return all nodes when none are collapsed', () => {
      const nodes = [
        createEnhancedNode({ id: 1, label: 'Root', x: 0, y: 0, level: 0 }),
        createEnhancedNode({ id: 2, label: 'Child 1', x: 100, y: 100, level: 1 }),
        createEnhancedNode({ id: 3, label: 'Child 2', x: 200, y: 200, level: 1 }),
        createEnhancedNode({ id: 4, label: 'Grandchild', x: 300, y: 300, level: 2 })
      ];

      const visibleNodes = getVisibleNodes(nodes);
      expect(visibleNodes).toHaveLength(4);
    });

    it('should hide children of collapsed nodes', () => {
      const nodes = [
        createEnhancedNode({ id: 1, label: 'Root', x: 0, y: 0, level: 0 }),
        createEnhancedNode({ id: 2, label: 'Level 1', x: 100, y: 100, level: 1, isCollapsed: true }),
        createEnhancedNode({ id: 3, label: 'Peer Level 1', x: 200, y: 200, level: 1 }),
        createEnhancedNode({ id: 4, label: 'Level 2', x: 300, y: 300, level: 2 })
      ];

      const visibleNodes = getVisibleNodes(nodes);
      expect(visibleNodes.map(n => n.id).sort()).toEqual([1,2,3]);
    });
  });

  describe('hierarchy helpers', () => {
    it('getChildNodes and getDescendantNodes return expected sets', () => {
      const root = createEnhancedNode({ id: 1, label: 'root', x: 0, y: 0, level: 0 });
      const c1 = createEnhancedNode({ id: 2, label: 'c1', x: 10, y: 10, level: 1 });
      const c2 = createEnhancedNode({ id: 3, label: 'c2', x: 20, y: 20, level: 1 });
      const g1 = createEnhancedNode({ id: 4, label: 'g1', x: 30, y: 30, level: 2 });
      const nodes = [root, c1, c2, g1];

      const { getChildNodes, getDescendantNodes } = require('../../utils/nodeUtils');
      const children = getChildNodes(nodes, 1).map(n => n.id);
      expect(children.sort()).toEqual([2,3]);
      const desc = getDescendantNodes(nodes, 1).map(n => n.id);
      expect(desc.sort()).toEqual([2,3,4]);
    });
  });

  describe('tags and visibility helpers', () => {
    it('hasTag/addTag/removeTag/getAllTags work as expected', () => {
      const n1 = createEnhancedNode({ id: 10, label: 'A', x: 0, y: 0, tags: ['t1'] });
      expect(hasTag(n1, 't1')).toBe(true);
      const n2 = addTag(n1, 't2');
      expect(n2.tags).toEqual(expect.arrayContaining(['t1','t2']));
      const n3 = removeTag(n2, 't1');
      expect(hasTag(n3, 't1')).toBe(false);
      const all = getAllTags([n3, createEnhancedNode({ id: 11, label:'B', x:1, y:1, tags:['t3'] })]);
      expect(all).toEqual(expect.arrayContaining(['t2','t3']));
    });

    it('isNodeVisible returns false for descendants of collapsed nodes', () => {
      const nodes = [
        createEnhancedNode({ id: 1, label: 'root', x: 0, y: 0, level: 0, isCollapsed: true }),
        createEnhancedNode({ id: 2, label: 'child', x: 10, y: 10, level: 1 }),
        createEnhancedNode({ id: 3, label: 'sibling', x: 20, y: 20, level: 0 })
      ];
      expect(isNodeVisible(nodes, nodes[0])).toBe(true);
      expect(isNodeVisible(nodes, nodes[1])).toBe(false);
      const visible = getVisibleNodes(nodes).map(n => n.id);
      expect(visible).toEqual(expect.arrayContaining([1,3]));
      expect(visible).not.toContain(2);
    });
  });
});
