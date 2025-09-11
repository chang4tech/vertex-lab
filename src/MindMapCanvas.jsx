import React, { useRef, useEffect } from 'react';

/**
 * MindMapCanvas - a simple mind map canvas using HTML5 Canvas.
 * Props:
 *   nodes: array of node objects { id, label, x, y, parentId }
 *   onNodeClick: function(nodeId)
 */
const NODE_RADIUS = 32;
const NODE_COLOR = '#fff';
const NODE_BORDER = '#007bff';
const NODE_TEXT = '#333';
const EDGE_COLOR = '#aaa';

function drawNode(ctx, node) {
  ctx.beginPath();
  ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
  ctx.fillStyle = NODE_COLOR;
  ctx.fill();
  ctx.strokeStyle = NODE_BORDER;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = NODE_TEXT;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(node.label, node.x, node.y);
}

function drawEdge(ctx, from, to) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = EDGE_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();
}

const MindMapCanvas = ({ nodes, onNodeClick, selectedNodeId }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw edges
    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) drawEdge(ctx, parent, node);
      }
    });
    // Draw nodes, highlight selected
    nodes.forEach(node => {
      if (selectedNodeId && node.id === selectedNodeId) {
        ctx.save();
        ctx.shadowColor = '#ff9800';
        ctx.shadowBlur = 20;
        drawNode(ctx, node);
        ctx.restore();
        // Draw border highlight
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        drawNode(ctx, node);
      }
    });
  }, [nodes, selectedNodeId]);

  // Handle click
  const handleClick = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (const node of nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy < NODE_RADIUS * NODE_RADIUS) {
        onNodeClick && onNodeClick(node.id);
        break;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 8, display: 'block', margin: '40px auto' }}
      onClick={handleClick}
    />
  );
};

export default MindMapCanvas;
