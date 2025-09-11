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


const MindMapCanvas = ({ nodes, onNodeClick, selectedNodeId, onNodePositionChange }) => {
  const canvasRef = useRef(null);
  // Pan/zoom state
  const view = useRef({ offsetX: 0, offsetY: 0, scale: 1 });
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
    ctx.restore();
  }, [nodes, selectedNodeId]);

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
        if (selectedNodeId && node.id === selectedNodeId) {
          ctx.save();
          ctx.shadowColor = '#ff9800';
          ctx.shadowBlur = 20;
          drawNode(ctx, node);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(node.x, node.y, NODE_RADIUS + 4, 0, 2 * Math.PI);
          ctx.strokeStyle = '#ff9800';
          ctx.lineWidth = 4;
          ctx.stroke();
        } else {
          drawNode(ctx, node);
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
  }, [nodes, onNodePositionChange, selectedNodeId]);

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
};

export default MindMapCanvas;
