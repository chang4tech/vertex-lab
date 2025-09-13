import { describe, it, expect } from 'vitest';
import { 
  createEnhancedNode, 
  upgradeNode, 
  getVisibleNodes, 
  NODE_SHAPES 
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
        createEnhancedNode({ id: 1, label: 'Root', x: 0, y: 0, parentId: null }),
        createEnhancedNode({ id: 2, label: 'Child 1', x: 100, y: 100, parentId: 1 }),
        createEnhancedNode({ id: 3, label: 'Child 2', x: 200, y: 200, parentId: 1 }),
        createEnhancedNode({ id: 4, label: 'Grandchild', x: 300, y: 300, parentId: 2 })
      ];

      const visibleNodes = getVisibleNodes(nodes);
      expect(visibleNodes).toHaveLength(4);
    });

    it('should hide children of collapsed nodes', () => {
      const nodes = [
        createEnhancedNode({ id: 1, label: 'Root', x: 0, y: 0, parentId: null }),
        createEnhancedNode({ id: 2, label: 'Child 1', x: 100, y: 100, parentId: 1, isCollapsed: true }),
        createEnhancedNode({ id: 3, label: 'Child 2', x: 200, y: 200, parentId: 1 }),
        createEnhancedNode({ id: 4, label: 'Grandchild', x: 300, y: 300, parentId: 2 })
      ];

      const visibleNodes = getVisibleNodes(nodes);
      expect(visibleNodes).toHaveLength(3);
      expect(visibleNodes.find(n => n.id === 4)).toBeUndefined();
    });
  });
});