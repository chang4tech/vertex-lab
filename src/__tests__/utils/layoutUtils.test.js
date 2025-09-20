import { detectCollisions, applyForceDirectedLayout, organizeLayout } from '../../utils/layoutUtils';

describe('layoutUtils', () => {
  describe('detectCollisions', () => {
    it('detects overlapping nodes', () => {
      const nodes = [
        { id: 1, label: 'Node 1', x: 100, y: 100 },
        { id: 2, label: 'Node 2', x: 110, y: 110 }, // Too close to node 1
        { id: 3, label: 'Node 3', x: 300, y: 300 }  // Far from others
      ];

      const collisions = detectCollisions(nodes);
      
      expect(collisions).toHaveLength(1);
      expect(collisions[0]).toMatchObject({
        nodeA: 1,
        nodeB: 2
      });
      expect(collisions[0].overlap).toBeGreaterThan(0);
    });

    it('returns empty array when no collisions', () => {
      const nodes = [
        { id: 1, label: 'Node 1', x: 100, y: 100 },
        { id: 2, label: 'Node 2', x: 300, y: 300 },
        { id: 3, label: 'Node 3', x: 500, y: 500 }
      ];

      const collisions = detectCollisions(nodes);
      
      expect(collisions).toHaveLength(0);
    });

    it('considers text width for collision detection', () => {
      const nodes = [
        { id: 1, label: 'Very long node label that takes up space', x: 100, y: 100 },
        { id: 2, label: 'Another long label', x: 200, y: 100 }
      ];

      const collisions = detectCollisions(nodes);
      
      expect(collisions).toHaveLength(1);
    });
  });

  describe('applyForceDirectedLayout', () => {
    const canvasDimensions = { width: 800, height: 600 };

    it('adjusts node positions to resolve collisions', () => {
      const nodes = [
        { id: 1, label: 'Root', x: 400, y: 300, level: 0 },
        { id: 2, label: 'Peer 1', x: 405, y: 305, level: 0 }, // Too close to root
        { id: 3, label: 'Peer 2', x: 410, y: 310, level: 0 }  // Too close to both
      ];

      const originalNodes = JSON.parse(JSON.stringify(nodes));
      const adjustedNodes = applyForceDirectedLayout(nodes, canvasDimensions, 50);
      
      expect(adjustedNodes).toHaveLength(3);
      
      // Nodes should have moved from their original positions
      const child1Original = originalNodes.find(n => n.id === 2);
      const child2Original = originalNodes.find(n => n.id === 3);
      const child1Adjusted = adjustedNodes.find(n => n.id === 2);
      const child2Adjusted = adjustedNodes.find(n => n.id === 3);
      
      const child1Moved = Math.abs(child1Original.x - child1Adjusted.x) > 1 || 
                          Math.abs(child1Original.y - child1Adjusted.y) > 1;
      const child2Moved = Math.abs(child2Original.x - child2Adjusted.x) > 1 || 
                          Math.abs(child2Original.y - child2Adjusted.y) > 1;
      
      expect(child1Moved || child2Moved).toBe(true); // At least one should have moved
    });

    it('keeps nodes roughly separated by level bands', () => {
      const nodes = [
        { id: 1, label: 'Root', x: 400, y: 300, level: 0 },
        { id: 2, label: 'Level 1', x: 405, y: 305, level: 1 }
      ];

      const adjustedNodes = applyForceDirectedLayout(nodes, canvasDimensions, 5);
      
      expect(adjustedNodes).toHaveLength(2);
      
      const root = adjustedNodes.find(n => n.id === 1);
      const child = adjustedNodes.find(n => n.id === 2);
      
      expect(child.y).toBeGreaterThan(root.y);
    });
  });

  describe('organizeLayout', () => {
    const canvasDimensions = { width: 800, height: 600 };

    it('returns original nodes when no collisions detected', () => {
      const nodes = [
        { id: 1, label: 'Node 1', x: 100, y: 100 },
        { id: 2, label: 'Node 2', x: 300, y: 300 }
      ];

      const organizedNodes = organizeLayout(nodes, canvasDimensions);
      
      expect(organizedNodes).toEqual(nodes);
    });

    it('applies force-directed layout when collisions detected', () => {
      const nodes = [
        { id: 1, label: 'Root', x: 400, y: 300, level: 0 },
        { id: 2, label: 'Sibling', x: 405, y: 305, level: 0 } // Too close
      ];

      const organizedNodes = organizeLayout(nodes, canvasDimensions);
      
      expect(organizedNodes).toHaveLength(2);
      
      // Positions should have changed
      const originalChild = nodes.find(n => n.id === 2);
      const adjustedChild = organizedNodes.find(n => n.id === 2);
      
      const moved = originalChild.x !== adjustedChild.x || originalChild.y !== adjustedChild.y;
      expect(moved).toBe(true);
    });
  });
});
