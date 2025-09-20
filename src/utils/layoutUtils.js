const NODE_RADIUS = 32;
const MIN_DISTANCE = NODE_RADIUS * 2.8; // Minimum distance between node centers
const LABEL_PADDING = 15; // Extra padding for text labels
const MAX_ITERATIONS = 200; // Maximum iterations for layout algorithm

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
  // More accurate estimation: 9px per character for 16px font + base padding
  return Math.max(text.length * 9, 60); // Minimum width for short labels
}

export function applyForceDirectedLayout(nodes, canvasDimensions, maxIterations = MAX_ITERATIONS) {
  const nodeMap = new Map(nodes.map(node => [node.id, { ...node }]));
  const adjustedNodes = Array.from(nodeMap.values());
  
  // Track convergence
  let lastCollisionCount = Infinity;
  let stagnantIterations = 0;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const forces = new Map();
    
    // Initialize forces
    adjustedNodes.forEach(node => {
      forces.set(node.id, { x: 0, y: 0 });
    });
    
    // Calculate current collisions for adaptive force strength
    const currentCollisions = detectCollisions(adjustedNodes);
    const collisionCount = currentCollisions.length;
    
    // Adaptive force multiplier - stronger forces when many collisions
    const forceMultiplier = Math.min(2.0, 1.0 + collisionCount * 0.1);
    
    // Strong repulsion forces between overlapping nodes
    currentCollisions.forEach(collision => {
      const nodeA = adjustedNodes.find(n => n.id === collision.nodeA);
      const nodeB = adjustedNodes.find(n => n.id === collision.nodeB);
      
      if (!nodeA || !nodeB) return;
      
      const dx = nodeA.x - nodeB.x;
      const dy = nodeA.y - nodeB.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 1) {
        // If nodes are on top of each other, push them apart randomly
        const angle = Math.random() * 2 * Math.PI;
        distance = 1;
        const pushDistance = collision.requiredDistance * 0.6;
        
        const forceA = forces.get(nodeA.id);
        const forceB = forces.get(nodeB.id);
        
        forceA.x += Math.cos(angle) * pushDistance;
        forceA.y += Math.sin(angle) * pushDistance;
        forceB.x -= Math.cos(angle) * pushDistance;
        forceB.y -= Math.sin(angle) * pushDistance;
      } else {
        // Strong repulsion proportional to overlap
        const overlapRatio = collision.overlap / collision.requiredDistance;
        const repulsionStrength = Math.min(50, overlapRatio * 30) * forceMultiplier;
        
        const forceX = (dx / distance) * repulsionStrength;
        const forceY = (dy / distance) * repulsionStrength;
        
        const forceA = forces.get(nodeA.id);
        const forceB = forces.get(nodeB.id);
        
        forceA.x += forceX;
        forceA.y += forceY;
        forceB.x -= forceX;
        forceB.y -= forceY;
      }
    });
    
    // Weaker general repulsion between all nodes
    for (let i = 0; i < adjustedNodes.length; i++) {
      for (let j = i + 1; j < adjustedNodes.length; j++) {
        const nodeA = adjustedNodes[i];
        const nodeB = adjustedNodes[j];
        
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < 150) { // General spacing
          const repulsionForce = (150 - distance) * 0.01;
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
    
    // Gentle attraction towards level-aligned horizontal bands
    const levelSpacing = 180;
    adjustedNodes.forEach(node => {
      const targetY = (node.level ?? 0) * levelSpacing;
      const nodeForce = forces.get(node.id);
      nodeForce.y += (targetY - node.y) * 0.02;
    });
    
    // Apply forces with adaptive damping
    const baseDamping = 0.8;
    const adaptiveDamping = Math.max(0.3, baseDamping - (collisionCount * 0.05));
    
    adjustedNodes.forEach(node => {
      const force = forces.get(node.id);
      
      // Limit maximum force to prevent instability
      const maxForce = 20;
      const forceLength = Math.sqrt(force.x * force.x + force.y * force.y);
      if (forceLength > maxForce) {
        force.x = (force.x / forceLength) * maxForce;
        force.y = (force.y / forceLength) * maxForce;
      }
      
      node.x += force.x * adaptiveDamping;
      node.y += force.y * adaptiveDamping;
    });
    
    // Check for convergence
    if (collisionCount === 0) {
      console.log(`Layout converged after ${iter + 1} iterations with no collisions`);
      break;
    }
    
    if (collisionCount >= lastCollisionCount) {
      stagnantIterations++;
    } else {
      stagnantIterations = 0;
    }
    
    // If we're not making progress, try a different approach
    if (stagnantIterations > 20 && collisionCount > 0) {
      console.log(`Layout stagnant, applying random perturbation at iteration ${iter}`);
      // Add small random perturbations to break deadlocks
      adjustedNodes.forEach(node => {
        node.x += (Math.random() - 0.5) * 10;
        node.y += (Math.random() - 0.5) * 10;
      });
      stagnantIterations = 0;
    }
    
    lastCollisionCount = collisionCount;
  }
  
  return adjustedNodes;
}


export function organizeLayout(nodes, canvasDimensions) {
  // First detect if there are any collisions
  const initialCollisions = detectCollisions(nodes);
  
  if (initialCollisions.length === 0) {
    return nodes; // No adjustments needed
  }
  
  console.log(`Detected ${initialCollisions.length} collisions, applying force-directed layout...`);
  
  // Apply force-directed layout to resolve collisions
  let adjustedNodes = applyForceDirectedLayout(nodes, canvasDimensions);
  
  // Check if we still have collisions and apply additional passes if needed
  let finalCollisions = detectCollisions(adjustedNodes);
  let passes = 1;
  const maxPasses = 3;
  
  while (finalCollisions.length > 0 && passes < maxPasses) {
    console.log(`Pass ${passes}: ${finalCollisions.length} collisions remaining, applying additional layout pass...`);
    
    // Apply direct collision resolution for remaining overlaps
    adjustedNodes = resolveRemainingCollisions(adjustedNodes, finalCollisions);
    
    // Apply another round of force-directed layout with fewer iterations
    adjustedNodes = applyForceDirectedLayout(adjustedNodes, 50);
    
    finalCollisions = detectCollisions(adjustedNodes);
    passes++;
  }
  
  console.log(`Layout adjustment complete after ${passes} pass(es). Remaining collisions: ${finalCollisions.length}`);
  
  return adjustedNodes;
}

function resolveRemainingCollisions(nodes, collisions) {
  const adjustedNodes = nodes.map(node => ({ ...node }));
  const nodeMap = new Map(adjustedNodes.map(node => [node.id, node]));
  
  collisions.forEach(collision => {
    const nodeA = nodeMap.get(collision.nodeA);
    const nodeB = nodeMap.get(collision.nodeB);
    
    if (!nodeA || !nodeB) return;
    
    const dx = nodeA.x - nodeB.x;
    const dy = nodeA.y - nodeB.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 1) {
      // Nodes are on top of each other, separate them
      const angle = Math.random() * 2 * Math.PI;
      const separationDistance = collision.requiredDistance * 0.6;
      
      nodeA.x += Math.cos(angle) * separationDistance;
      nodeA.y += Math.sin(angle) * separationDistance;
      nodeB.x -= Math.cos(angle) * separationDistance;
      nodeB.y -= Math.sin(angle) * separationDistance;
    } else {
      // Push nodes apart to meet required distance
      const pushDistance = (collision.requiredDistance - distance) * 0.6;
      const pushX = (dx / distance) * pushDistance;
      const pushY = (dy / distance) * pushDistance;
      
      // Determine which node should move more based on hierarchy
    const nodeAIsRoot = (nodeA.level ?? 0) === 0;
    const nodeBIsRoot = (nodeB.level ?? 0) === 0;
      
      if (nodeAIsRoot && !nodeBIsRoot) {
        // Move child more than root
        nodeB.x -= pushX * 0.8;
        nodeB.y -= pushY * 0.8;
        nodeA.x += pushX * 0.2;
        nodeA.y += pushY * 0.2;
      } else if (nodeBIsRoot && !nodeAIsRoot) {
        // Move child more than root
        nodeA.x += pushX * 0.8;
        nodeA.y += pushY * 0.8;
        nodeB.x -= pushX * 0.2;
        nodeB.y -= pushY * 0.2;
      } else {
        // Move both equally
        nodeA.x += pushX * 0.5;
        nodeA.y += pushY * 0.5;
        nodeB.x -= pushX * 0.5;
        nodeB.y -= pushY * 0.5;
      }
    }
  });
  
  return adjustedNodes;
}
