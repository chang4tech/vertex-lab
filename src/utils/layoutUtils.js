const NODE_RADIUS = 32;
const MIN_DISTANCE = NODE_RADIUS * 3; // Minimum distance between node centers
const LABEL_PADDING = 10; // Extra padding for text labels

export function detectCollisions(nodes) {
  const collisions = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];
      
      const dx = nodeA.x - nodeB.x;
      const dy = nodeA.y - nodeB.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate required distance based on text width
      const textWidthA = estimateTextWidth(nodeA.label);
      const textWidthB = estimateTextWidth(nodeB.label);
      const requiredDistance = Math.max(
        MIN_DISTANCE,
        (textWidthA + textWidthB) / 2 + LABEL_PADDING * 2
      );
      
      if (distance < requiredDistance) {
        collisions.push({
          nodeA: nodeA.id,
          nodeB: nodeB.id,
          distance,
          requiredDistance,
          overlap: requiredDistance - distance
        });
      }
    }
  }
  
  return collisions;
}

function estimateTextWidth(text) {
  // Rough estimation: 8px per character for 16px font
  return text.length * 8;
}

export function applyForceDirectedLayout(nodes, iterations = 100) {
  const nodeMap = new Map(nodes.map(node => [node.id, { ...node }]));
  const adjustedNodes = Array.from(nodeMap.values());
  
  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map();
    
    // Initialize forces
    adjustedNodes.forEach(node => {
      forces.set(node.id, { x: 0, y: 0 });
    });
    
    // Repulsion forces between all nodes
    for (let i = 0; i < adjustedNodes.length; i++) {
      for (let j = i + 1; j < adjustedNodes.length; j++) {
        const nodeA = adjustedNodes[i];
        const nodeB = adjustedNodes[j];
        
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 1) distance = 1; // Avoid division by zero
        
        const textWidthA = estimateTextWidth(nodeA.label);
        const textWidthB = estimateTextWidth(nodeB.label);
        const requiredDistance = Math.max(
          MIN_DISTANCE,
          (textWidthA + textWidthB) / 2 + LABEL_PADDING * 2
        );
        
        if (distance < requiredDistance) {
          const repulsionForce = (requiredDistance - distance) / distance * 0.3;
          const forceX = (dx / distance) * repulsionForce;
          const forceY = (dy / distance) * repulsionForce;
          
          const forceA = forces.get(nodeA.id);
          const forceB = forces.get(nodeB.id);
          
          forceA.x += forceX;
          forceA.y += forceY;
          forceB.x -= forceX;
          forceB.y -= forceY;
        }
      }
    }
    
    // Attraction forces for parent-child relationships
    adjustedNodes.forEach(node => {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          const dx = parent.x - node.x;
          const dy = parent.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const idealDistance = 120; // Ideal parent-child distance
          const attractionForce = (distance - idealDistance) * 0.02;
          
          if (distance > 1) {
            const forceX = (dx / distance) * attractionForce;
            const forceY = (dy / distance) * attractionForce;
            
            const nodeForce = forces.get(node.id);
            const parentForce = forces.get(parent.id);
            
            nodeForce.x += forceX;
            nodeForce.y += forceY;
            parentForce.x -= forceX * 0.5; // Parent moves less
            parentForce.y -= forceY * 0.5;
          }
        }
      }
    });
    
    // Apply forces with damping
    const damping = 0.9;
    adjustedNodes.forEach(node => {
      const force = forces.get(node.id);
      node.x += force.x * damping;
      node.y += force.y * damping;
    });
    
    // Keep root node relatively stable
    const rootNode = adjustedNodes.find(n => n.parentId === null);
    if (rootNode && iter < iterations - 10) {
      // Gently pull root back to center
      const centerX = 400;
      const centerY = 300;
      const pullStrength = 0.01;
      
      rootNode.x += (centerX - rootNode.x) * pullStrength;
      rootNode.y += (centerY - rootNode.y) * pullStrength;
    }
  }
  
  return adjustedNodes;
}


export function organizeLayout(nodes) {
  // First detect if there are any collisions
  const collisions = detectCollisions(nodes);
  
  if (collisions.length === 0) {
    return nodes; // No adjustments needed
  }
  
  console.log(`Detected ${collisions.length} collisions, applying force-directed layout...`);
  
  // Apply force-directed layout to resolve collisions
  const adjustedNodes = applyForceDirectedLayout(nodes);
  
  // Verify the result
  const finalCollisions = detectCollisions(adjustedNodes);
  console.log(`Layout adjustment complete. Remaining collisions: ${finalCollisions.length}`);
  
  return adjustedNodes;
}