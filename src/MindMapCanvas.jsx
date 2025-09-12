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

function drawNode(ctx, node, isSelected = false, isHighlighted = false) {
  // Draw outer glow for highlighted nodes
  if (isHighlighted) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_RADIUS + 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 235, 59, 0.3)'; // Yellow glow
    ctx.fill();
  }
  
  ctx.beginPath();
  ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
  
  // Node fill color
  if (isHighlighted) {
    ctx.fillStyle = '#fff9c4'; // Light yellow for highlighted
  } else {
    ctx.fillStyle = NODE_COLOR;
  }
  ctx.fill();
  
  // Node border
  if (isSelected) {
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 4;
  } else if (isHighlighted) {
    ctx.strokeStyle = '#ffc107'; // Yellow border for highlighted
    ctx.lineWidth = 3;
  } else {
    ctx.strokeStyle = NODE_BORDER;
    ctx.lineWidth = 2;
  }
  ctx.stroke();
  
  // Node text
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


import { forwardRef, useImperativeHandle } from 'react';

const MindMapCanvas = forwardRef(({ nodes, onNodeClick, selectedNodeId, onNodePositionChange, highlightedNodeIds = [], onViewBoxChange }, ref) => {
  const canvasRef = useRef(null);
  // Pan/zoom state
  const view = useRef({ offsetX: 0, offsetY: 0, scale: 1 });
  // Expose imperative methods for centering and zooming
  useImperativeHandle(ref, () => ({
    center: () => {
      // Center the root node (id:1) if exists, else center canvas
      const root = nodes.find(n => n.id === 1) || nodes[0];
      if (!root) return;
      const canvas = canvasRef.current;
      view.current.scale = 1;
      view.current.offsetX = canvas.width / 2 - root.x;
      view.current.offsetY = canvas.height / 2 - root.y;
      canvas.dispatchEvent(new Event('redraw'));
    },
    zoom: (factor) => {
      view.current.scale *= factor;
      const canvas = canvasRef.current;
      canvas.dispatchEvent(new Event('redraw'));
    },
    resetZoom: () => {
      view.current.scale = 1;
      const canvas = canvasRef.current;
      canvas.dispatchEvent(new Event('redraw'));
    },
    exportAsPNG: () => {
      const canvas = canvasRef.current;
      const link = document.createElement('a');
      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');
      const filename = `mindmap-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    focusOnNode: (nodeId) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      const canvas = canvasRef.current;
      view.current.offsetX = canvas.width / 2 - node.x * view.current.scale;
      view.current.offsetY = canvas.height / 2 - node.y * view.current.scale;
      canvas.dispatchEvent(new Event('redraw'));
    },
    setViewport: (viewport) => {
      view.current.offsetX = viewport.x;
      view.current.offsetY = viewport.y;
      view.current.scale = viewport.scale || view.current.scale;
      const canvas = canvasRef.current;
      canvas.dispatchEvent(new Event('redraw'));
    }
  }), [nodes]);
  // Drag state
  const dragState = useRef({ dragging: false, nodeId: null, offsetX: 0, offsetY: 0 });
  // Pan state
  const panState = useRef({ panning: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });

  // Draw with pan/zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(view.current.offsetX, view.current.offsetY);
    ctx.scale(view.current.scale, view.current.scale);
    // Draw edges
    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) drawEdge(ctx, parent, node);
      }
    });
    // Draw nodes with selection and highlighting
    nodes.forEach(node => {
      const isSelected = selectedNodeId && node.id === selectedNodeId;
      const isHighlighted = highlightedNodeIds.includes(node.id);
      
      if (isSelected) {
        ctx.save();
        ctx.shadowColor = '#ff9800';
        ctx.shadowBlur = 20;
        drawNode(ctx, node, isSelected, isHighlighted);
        ctx.restore();
      } else {
        drawNode(ctx, node, isSelected, isHighlighted);
      }
    });
    ctx.restore();
  }, [nodes, selectedNodeId, highlightedNodeIds]);

  // Mouse events for drag and pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let isSpaceDown = false;
    const handleKeyDown = (e) => {
      if (e.code === 'Space') isSpaceDown = true;
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') isSpaceDown = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const getTransformed = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left - view.current.offsetX) / view.current.scale;
      const y = (clientY - rect.top - view.current.offsetY) / view.current.scale;
      return { x, y };
    };

    const handleMouseDown = (e) => {
      // Pan with space+drag or right click
      if (isSpaceDown || e.button === 2) {
        panState.current = {
          panning: true,
          startX: e.clientX,
          startY: e.clientY,
          startOffsetX: view.current.offsetX,
          startOffsetY: view.current.offsetY
        };
        return;
      }
      // Node drag
      const { x, y } = getTransformed(e.clientX, e.clientY);
      for (const node of nodes) {
        const dx = node.x - x;
        const dy = node.y - y;
        if (dx * dx + dy * dy < NODE_RADIUS * NODE_RADIUS) {
          dragState.current = {
            dragging: true,
            nodeId: node.id,
            offsetX: node.x - x,
            offsetY: node.y - y
          };
          break;
        }
      }
    };
    const handleMouseMove = (e) => {
      // Pan
      if (panState.current.panning) {
        const dx = e.clientX - panState.current.startX;
        const dy = e.clientY - panState.current.startY;
        view.current.offsetX = panState.current.startOffsetX + dx;
        view.current.offsetY = panState.current.startOffsetY + dy;
        canvas.dispatchEvent(new Event('redraw'));
        return;
      }
      // Node drag
      if (!dragState.current.dragging) return;
      const { x, y } = getTransformed(e.clientX, e.clientY);
      const { nodeId, offsetX, offsetY } = dragState.current;
      if (onNodePositionChange && nodeId) {
        onNodePositionChange(nodeId, x + offsetX, y + offsetY);
      }
    };
    const handleMouseUp = () => {
      dragState.current = { dragging: false, nodeId: null, offsetX: 0, offsetY: 0 };
      panState.current = { panning: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 };
    };
    const handleWheel = (e) => {
      e.preventDefault();
      const scaleAmount = e.deltaY < 0 ? 1.1 : 0.9;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left - view.current.offsetX) / view.current.scale;
      const my = (e.clientY - rect.top - view.current.offsetY) / view.current.scale;
      view.current.scale *= scaleAmount;
      // Zoom to mouse position
      view.current.offsetX -= (mx * (scaleAmount - 1)) * view.current.scale;
      view.current.offsetY -= (my * (scaleAmount - 1)) * view.current.scale;
      canvas.dispatchEvent(new Event('redraw'));
    };
    // Redraw on pan/zoom
    const handleRedraw = () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(view.current.offsetX, view.current.offsetY);
      ctx.scale(view.current.scale, view.current.scale);
      nodes.forEach(node => {
        if (node.parentId) {
          const parent = nodes.find(n => n.id === node.parentId);
          if (parent) drawEdge(ctx, parent, node);
        }
      });
      nodes.forEach(node => {
        const isSelected = selectedNodeId && node.id === selectedNodeId;
        const isHighlighted = highlightedNodeIds.includes(node.id);
        
        if (isSelected) {
          ctx.save();
          ctx.shadowColor = '#ff9800';
          ctx.shadowBlur = 20;
          drawNode(ctx, node, isSelected, isHighlighted);
          ctx.restore();
        } else {
          drawNode(ctx, node, isSelected, isHighlighted);
        }
      });
      ctx.restore();
    };
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('redraw', handleRedraw);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('redraw', handleRedraw);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nodes, onNodePositionChange, selectedNodeId, highlightedNodeIds]);

  // Handle click (with pan/zoom)
  const handleClick = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - view.current.offsetX) / view.current.scale;
    const y = (e.clientY - rect.top - view.current.offsetY) / view.current.scale;
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
      style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 8, display: 'block', margin: '40px auto', cursor: 'grab' }}
      onClick={handleClick}
      tabIndex={0}
      onContextMenu={e => e.preventDefault()}

    />
  );
});

export default MindMapCanvas;
