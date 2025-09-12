import { useRef, useEffect, useCallback } from 'react';

export default function useCanvasOperations({
  nodes,
  onNodeClick,
  selectedNodeId,
  onNodePositionChange,
  onViewBoxChange,
  NODE_RADIUS
}) {
  const canvasRef = useRef(null);
  const view = useRef({ offsetX: 0, offsetY: 0, scale: 1 });
  const dragState = useRef({ dragging: false, nodeId: null, offsetX: 0, offsetY: 0 });
  const panState = useRef({ panning: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });

  // Update viewBox whenever the view changes
  const updateViewBox = useCallback(() => {
    if (!canvasRef.current || !onViewBoxChange) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const viewBox = {
      x: -view.current.offsetX / view.current.scale,
      y: -view.current.offsetY / view.current.scale,
      width: rect.width / view.current.scale,
      height: rect.height / view.current.scale
    };
    onViewBoxChange(viewBox);
  }, [onViewBoxChange]);

  const drawNode = useCallback((ctx, node, isSelected, isDragging) => {
    ctx.save();
    ctx.restore();
    
    // Add shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    
    // Draw node background
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Reset shadow for border
    ctx.shadowColor = 'transparent';
    
    // Draw border
    ctx.strokeStyle = isSelected ? '#ff9800' : isDragging ? '#4CAF50' : '#007bff';
    ctx.lineWidth = isSelected || isDragging ? 4 : 2;
    ctx.stroke();
    
    if (isSelected) {
      ctx.shadowColor = '#ff9800';
      ctx.shadowBlur = 20;
    } else if (isDragging) {
      ctx.shadowColor = '#4CAF50';
      ctx.shadowBlur = 15;
    }
    
    ctx.fillStyle = '#333';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x, node.y);
  }, []);

  const drawEdge = useCallback((ctx, from, to) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear and setup transform
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
    
    // Draw nodes
    nodes.forEach(node => {
      drawNode(ctx, node, node.id === selectedNodeId);
    });
    
    ctx.restore();
  }, [nodes, selectedNodeId, drawNode, drawEdge]);

  // Export to PNG
  const exportAsPNG = useCallback(() => {
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
  }, []);

  // Center view
  const center = useCallback(() => {
    const canvas = canvasRef.current;
    const root = nodes.find(n => n.id === 1) || nodes[0];
    if (!root) return;
    
    view.current.scale = 1;
    view.current.offsetX = canvas.width / 2 - root.x;
    view.current.offsetY = canvas.height / 2 - root.y;
    draw();
    updateViewBox();
  }, [nodes, draw, updateViewBox]);

  // Zoom
  const zoom = useCallback((factor) => {
    view.current.scale *= factor;
    draw();
    updateViewBox();
  }, [draw, updateViewBox]);

  // Reset zoom
  const resetZoom = useCallback(() => {
    view.current.scale = 1;
    draw();
    updateViewBox();
  }, [draw, updateViewBox]);

  // Click handler
  const handleClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - view.current.offsetX) / view.current.scale;
    const y = (e.clientY - rect.top - view.current.offsetY) / view.current.scale;
    
    for (const node of nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy < NODE_RADIUS * NODE_RADIUS) {
        onNodeClick(node.id);
        break;
      }
    }
  }, [nodes, onNodeClick, NODE_RADIUS]);

  // Setup event listeners
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

    const handleMouseDown = (e) => {
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

      const { x, y } = getTransformedCoords(e.clientX, e.clientY);
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
      if (panState.current.panning) {
        const dx = e.clientX - panState.current.startX;
        const dy = e.clientY - panState.current.startY;
        view.current.offsetX = panState.current.startOffsetX + dx;
        view.current.offsetY = panState.current.startOffsetY + dy;
        draw();
        updateViewBox();
        return;
      }

      if (!dragState.current.dragging) return;
      
      const { x, y } = getTransformedCoords(e.clientX, e.clientY);
      const { nodeId, offsetX, offsetY } = dragState.current;
      onNodePositionChange(nodeId, x + offsetX, y + offsetY);
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
      view.current.offsetX -= (mx * (scaleAmount - 1)) * view.current.scale;
      view.current.offsetY -= (my * (scaleAmount - 1)) * view.current.scale;
      draw();
      updateViewBox();
      draw();
    };

    const getTransformedCoords = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left - view.current.offsetX) / view.current.scale;
      const y = (clientY - rect.top - view.current.offsetY) / view.current.scale;
      return { x, y };
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nodes, onNodePositionChange, draw, NODE_RADIUS, updateViewBox]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  return {
    canvasRef,
    handleClick,
    exportAsPNG,
    center,
    zoom,
    resetZoom
  };
}
