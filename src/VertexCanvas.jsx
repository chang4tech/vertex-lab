import React, { useRef, useEffect } from 'react';
import { useTheme } from './contexts/ThemeContext';
import { 
  getNodeDisplayText, 
  getNodeBorderColor, 
  getNodeTextColor,
  getThemeNodeColor,
  NODE_SHAPES, 
  getVisibleNodes,
  upgradeNode
} from './utils/nodeUtils';

/**
 * VertexCanvas - a simple diagramming canvas using HTML5 Canvas.
 * Props:
 *   nodes: array of node objects { id, label, x, y, parentId }
 *   onNodeClick: function(nodeId)
 */

function drawNode(ctx, node, theme, isSelected = false, isHighlighted = false) {
  const { colors } = theme;
  const enhancedNode = upgradeNode(node); // Ensure node has enhanced properties
  const nodeRadius = colors.nodeRadius;
  const shape = enhancedNode.shape || NODE_SHAPES.CIRCLE;
  const nodeColor = getThemeNodeColor(enhancedNode, theme);
  const borderColor = getNodeBorderColor(enhancedNode, theme);
  
  // Draw outer glow for highlighted nodes
  if (isHighlighted) {
    drawNodeShape(ctx, enhancedNode, nodeRadius + 8, colors.highlightNodeGlow, shape, true);
  }
  
  // Draw main node shape
  const fillColor = isHighlighted ? colors.highlightNodeBackground : nodeColor;
  drawNodeShape(ctx, enhancedNode, nodeRadius, fillColor, shape, false);
  
  // Draw node border
  let strokeColor, lineWidth;
  if (isSelected) {
    strokeColor = colors.selectedNodeBorder;
    lineWidth = 4;
  } else if (isHighlighted) {
    strokeColor = colors.highlightNodeBorder;
    lineWidth = 3;
  } else {
    strokeColor = borderColor;
    lineWidth = colors.edgeWidth;
  }
  
  drawNodeShape(ctx, enhancedNode, nodeRadius, null, shape, false, strokeColor, lineWidth);
  
  // Draw node text with enhanced properties
  ctx.fillStyle = getNodeTextColor(enhancedNode, theme);
  const fontSize = enhancedNode.fontSize || 16;
  const fontWeight = enhancedNode.fontWeight || 'normal';
  const fontStyle = enhancedNode.fontStyle || 'normal';
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const displayText = getNodeDisplayText(enhancedNode);
  
  // Handle multi-line text
  const lines = displayText.split('\n');
  const lineHeight = fontSize * 1.2;
  const startY = node.y - ((lines.length - 1) * lineHeight) / 2;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, node.x, startY + (index * lineHeight));
  });
  
  // Draw tags indicator if node has tags
  if (enhancedNode.tags && enhancedNode.tags.length > 0) {
    drawTagsIndicator(ctx, enhancedNode, nodeRadius, theme);
  }
  
  // Draw collapsed indicator if node is collapsed
  if (enhancedNode.isCollapsed) {
    drawCollapsedIndicator(ctx, enhancedNode, nodeRadius, theme);
  }
}

function drawNodeShape(ctx, node, radius, fillColor, shape, isGlow = false, strokeColor = null, lineWidth = 2) {
  ctx.save();
  
  switch (shape) {
    case NODE_SHAPES.CIRCLE:
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      break;
      
    case NODE_SHAPES.RECTANGLE: {
      const rectWidth = radius * 1.6;
      const rectHeight = radius * 1.2;
      ctx.beginPath();
      ctx.rect(node.x - rectWidth/2, node.y - rectHeight/2, rectWidth, rectHeight);
      break;
    }
      
    case NODE_SHAPES.ROUNDED_RECTANGLE: {
      const roundRectWidth = radius * 1.6;
      const roundRectHeight = radius * 1.2;
      const cornerRadius = 8;
      ctx.beginPath();
      ctx.roundRect(
        node.x - roundRectWidth/2, 
        node.y - roundRectHeight/2, 
        roundRectWidth, 
        roundRectHeight, 
        cornerRadius
      );
      break;
    }
      
    case NODE_SHAPES.DIAMOND:
      ctx.beginPath();
      ctx.moveTo(node.x, node.y - radius);
      ctx.lineTo(node.x + radius, node.y);
      ctx.lineTo(node.x, node.y + radius);
      ctx.lineTo(node.x - radius, node.y);
      ctx.closePath();
      break;
      
    case NODE_SHAPES.HEXAGON: {
      const hexRadius = radius;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = node.x + hexRadius * Math.cos(angle);
        const y = node.y + hexRadius * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      break;
    }
      
    case NODE_SHAPES.ELLIPSE:
      ctx.beginPath();
      ctx.ellipse(node.x, node.y, radius * 1.4, radius * 0.8, 0, 0, 2 * Math.PI);
      break;
      
    default:
      // Default to circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
  }
  
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  
  if (strokeColor && !isGlow) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawTagsIndicator(ctx, node, nodeRadius, theme) {
  ctx.save();
  ctx.fillStyle = theme.colors.warning;
  ctx.beginPath();
  ctx.arc(node.x + nodeRadius - 6, node.y - nodeRadius + 6, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

function drawCollapsedIndicator(ctx, node, nodeRadius, theme) {
  ctx.save();
  ctx.fillStyle = theme.colors.primaryButton;
  ctx.strokeStyle = theme.colors.nodeBackground;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(node.x + nodeRadius - 8, node.y + nodeRadius - 8, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  
  // Draw + symbol
  ctx.strokeStyle = theme.colors.primaryButtonText;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(node.x + nodeRadius - 11, node.y + nodeRadius - 8);
  ctx.lineTo(node.x + nodeRadius - 5, node.y + nodeRadius - 8);
  ctx.moveTo(node.x + nodeRadius - 8, node.y + nodeRadius - 11);
  ctx.lineTo(node.x + nodeRadius - 8, node.y + nodeRadius - 5);
  ctx.stroke();
  ctx.restore();
}

function drawEdge(ctx, from, to, theme) {
  const { colors } = theme;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = colors.edgeColor;
  ctx.lineWidth = colors.edgeWidth;
  ctx.stroke();
}


import { forwardRef, useImperativeHandle } from 'react';

const VertexCanvas = forwardRef(({ nodes, onNodeClick, onNodeDoubleClick, selectedNodeIds = [], onNodePositionChange, highlightedNodeIds = [], onSelectionChange }, ref) => {
  const canvasRef = useRef(null);
  const { currentTheme } = useTheme();
  
  // Pan/zoom state
  const view = useRef({ offsetX: 0, offsetY: 0, scale: 1 });
  // Expose imperative methods for centering and zooming
  useImperativeHandle(ref, () => ({
    canvasRef,
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
      const filename = `vertex-lab-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      try {
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        // In non-DOM test environments, just invoke click
        if (typeof link.click === 'function') link.click();
      }
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
    
    // Clear with theme background
    ctx.fillStyle = currentTheme.colors.canvasBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(view.current.offsetX, view.current.offsetY);
    ctx.scale(view.current.scale, view.current.scale);
    
    // Get visible nodes (considering collapsed state)
    const visibleNodes = getVisibleNodes(nodes);
    
    // Draw edges for visible nodes
    visibleNodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent && visibleNodes.includes(parent)) {
          drawEdge(ctx, parent, node, currentTheme);
        }
      }
    });
    
    // Draw visible nodes with selection and highlighting
    visibleNodes.forEach(node => {
      const isSelected = selectedNodeIds.includes(node.id);
      const isHighlighted = highlightedNodeIds.includes(node.id);
      
      if (isSelected) {
        ctx.save();
        ctx.shadowColor = currentTheme.colors.selectedNodeShadow;
        ctx.shadowBlur = 20;
        drawNode(ctx, node, currentTheme, isSelected, isHighlighted);
        ctx.restore();
      } else {
        drawNode(ctx, node, currentTheme, isSelected, isHighlighted);
      }
    });
    ctx.restore();
  }, [nodes, selectedNodeIds, highlightedNodeIds, currentTheme]);

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
        const nodeRadius = currentTheme.colors.nodeRadius;
        if (dx * dx + dy * dy < nodeRadius * nodeRadius) {
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
      
      // Clear with theme background
      ctx.fillStyle = currentTheme.colors.canvasBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.translate(view.current.offsetX, view.current.offsetY);
      ctx.scale(view.current.scale, view.current.scale);
      
      // Get visible nodes
      const visibleNodes = getVisibleNodes(nodes);
      
      // Draw edges for visible nodes
      visibleNodes.forEach(node => {
        if (node.parentId) {
          const parent = nodes.find(n => n.id === node.parentId);
          if (parent && visibleNodes.includes(parent)) {
            drawEdge(ctx, parent, node, currentTheme);
          }
        }
      });
      
      // Draw visible nodes
      visibleNodes.forEach(node => {
        const isSelected = selectedNodeIds.includes(node.id);
        const isHighlighted = highlightedNodeIds.includes(node.id);
        
        if (isSelected) {
          ctx.save();
          ctx.shadowColor = currentTheme.colors.selectedNodeShadow;
          ctx.shadowBlur = 20;
          drawNode(ctx, node, currentTheme, isSelected, isHighlighted);
          ctx.restore();
        } else {
          drawNode(ctx, node, currentTheme, isSelected, isHighlighted);
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
  }, [nodes, onNodePositionChange, selectedNodeIds, highlightedNodeIds, currentTheme]);

  // Handle click (with pan/zoom)
  const handleClick = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - view.current.offsetX) / view.current.scale;
    const y = (e.clientY - rect.top - view.current.offsetY) / view.current.scale;
    
    // Check visible nodes only
    const visibleNodes = getVisibleNodes(nodes);
    let clickedNodeId = null;
    
    for (const node of visibleNodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const nodeRadius = currentTheme.colors.nodeRadius;
      if (dx * dx + dy * dy < nodeRadius * nodeRadius) {
        clickedNodeId = node.id;
        break;
      }
    }
    
    // Handle multi-selection with Ctrl/Cmd key
    const isMultiSelect = e.ctrlKey || e.metaKey;
    
    if (clickedNodeId) {
      if (isMultiSelect) {
        // Toggle selection for multi-select
        const newSelection = selectedNodeIds.includes(clickedNodeId)
          ? selectedNodeIds.filter(id => id !== clickedNodeId)
          : [...selectedNodeIds, clickedNodeId];
        onSelectionChange && onSelectionChange(newSelection);
      } else {
        // Single selection
        onSelectionChange && onSelectionChange([clickedNodeId]);
      }
      
      // Also call the original onNodeClick for backward compatibility
      onNodeClick && onNodeClick(clickedNodeId);
    } else if (!isMultiSelect) {
      // Clear selection when clicking empty space (unless multi-selecting)
      onSelectionChange && onSelectionChange([]);
    }
  };

  // Handle double-click (with pan/zoom)
  const handleDoubleClick = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - view.current.offsetX) / view.current.scale;
    const y = (e.clientY - rect.top - view.current.offsetY) / view.current.scale;
    
    // Check visible nodes only
    const visibleNodes = getVisibleNodes(nodes);
    for (const node of visibleNodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const nodeRadius = currentTheme.colors.nodeRadius;
      if (dx * dx + dy * dy < nodeRadius * nodeRadius) {
        onNodeDoubleClick && onNodeDoubleClick(node.id);
        break;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ 
        background: currentTheme.colors.canvasBackground, 
        border: `1px solid ${currentTheme.colors.panelBorder}`, 
        borderRadius: 8, 
        display: 'block', 
        margin: '40px auto', 
        cursor: 'grab' 
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      onContextMenu={e => e.preventDefault()}
    />
  );
});

export default VertexCanvas;
