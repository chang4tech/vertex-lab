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
 *   edges: optional array of edges [{ id?, source, target, directed? }]
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
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px system-ui, -apple-system, Segoe UI, Noto Color Emoji, Apple Color Emoji, sans-serif`;
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

const VertexCanvas = forwardRef(({ nodes, edges: propsEdges = [], onNodeClick, onNodeDoubleClick, selectedNodeIds = [], onNodePositionChange, highlightedNodeIds = [], onSelectionChange, onViewBoxChange, onContextMenuRequest, width = 800, height = 600 }, ref) => {
  const canvasRef = useRef(null);
  const { currentTheme } = useTheme();
  
  // Pan/zoom state
  const view = useRef({ offsetX: 0, offsetY: 0, scale: 1 });
  // Touch/pointer gesture state
  const pointers = useRef(new Map());
  const pinchState = useRef({ active: false, startDist: 0, startScale: 1 });
  const longPressRef = useRef({ timer: null, startX: 0, startY: 0, fired: false });

  // Compute half extents for a node based on its shape and theme radius
  const getHalfExtents = (node) => {
    const enhanced = upgradeNode(node);
    const r = currentTheme.colors.nodeRadius;
    const shape = enhanced.shape || NODE_SHAPES.CIRCLE;
    switch (shape) {
      case NODE_SHAPES.RECTANGLE:
      case NODE_SHAPES.ROUNDED_RECTANGLE:
        return { hw: (r * 1.6) / 2, hh: (r * 1.2) / 2 };
      case NODE_SHAPES.ELLIPSE:
        return { hw: r * 1.4, hh: r * 0.8 };
      default:
        return { hw: r, hh: r };
    }
  };
  // Expose imperative methods for centering and zooming
  useImperativeHandle(ref, () => ({
    canvasRef,
    center: () => {
      // Center the graph content within the canvas at current zoom
      const canvas = canvasRef.current;
      const visibleNodes = getVisibleNodes(nodes);
      if (!visibleNodes || visibleNodes.length === 0) return;
      // Include node extents for better centering
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of visibleNodes) {
        const { hw, hh } = getHalfExtents(n);
        minX = Math.min(minX, n.x - hw);
        maxX = Math.max(maxX, n.x + hw);
        minY = Math.min(minY, n.y - hh);
        maxY = Math.max(maxY, n.y + hh);
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      // Keep current scale; position offsets so that (cx, cy) maps to canvas center
      const s = view.current.scale;
      view.current.offsetX = canvas.width / 2 - cx * s;
      view.current.offsetY = canvas.height / 2 - cy * s;
      canvas.dispatchEvent(new Event('redraw'));
    },
    zoom: (factor) => {
      view.current.scale *= factor;
      const canvas = canvasRef.current;
      canvas.dispatchEvent(new Event('redraw'));
    },
    fitToView: () => {
      const canvas = canvasRef.current;
      const visibleNodes = getVisibleNodes(nodes);
      if (!visibleNodes || visibleNodes.length === 0) return;
      // Bounds including node shape extents
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of visibleNodes) {
        const { hw, hh } = getHalfExtents(n);
        minX = Math.min(minX, n.x - hw);
        maxX = Math.max(maxX, n.x + hw);
        minY = Math.min(minY, n.y - hh);
        maxY = Math.max(maxY, n.y + hh);
      }
      const contentW = Math.max(1, maxX - minX);
      const contentH = Math.max(1, maxY - minY);
      // Dynamic padding scales with canvas size; use 8% of min dimension, clamped
      const basePad = currentTheme.colors.nodeRadius;
      const fracPad = Math.round(0.08 * Math.min(canvas.width, canvas.height));
      const dynamicPad = Math.min(128, Math.max(24, basePad, fracPad));
      const scaleX = (canvas.width - 2 * dynamicPad) / contentW;
      const scaleY = (canvas.height - 2 * dynamicPad) / contentH;
      // Do not zoom in beyond 1:1 for large screens/content; keep a minimum scale
      const s = Math.max(0.05, Math.min(1, Math.min(scaleX, scaleY)));
      view.current.scale = s;
      // center after scaling
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      view.current.offsetX = canvas.width / 2 - cx * s;
      view.current.offsetY = canvas.height / 2 - cy * s;
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
      const canvas = canvasRef.current;
      // If width/height provided, compute scale to fit
      if (viewport.scale) {
        view.current.scale = viewport.scale;
      } else if (viewport.width) {
        view.current.scale = canvas.width / viewport.width;
      }
      // Convert world to screen offsets
      view.current.offsetX = -viewport.x * view.current.scale;
      view.current.offsetY = -viewport.y * view.current.scale;
      canvas.dispatchEvent(new Event('redraw'));
    }
  }), [nodes]);
  // Drag state
  const dragState = useRef({ dragging: false, nodeId: null, offsetX: 0, offsetY: 0 });
  // Pan state
  const panState = useRef({ panning: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });
  // Rectangle selection (marquee) state in world coords
  const selectState = useRef({ selecting: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  // Suppress the next click if it was a drag selection
  const suppressClickRef = useRef(false);

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
    
  // Draw edges
  if (Array.isArray(propsEdges) && propsEdges.length > 0) {
    // Use provided edges (undirected by default)
    propsEdges.forEach(edge => {
      const a = nodes.find(n => n.id === edge.source);
      const b = nodes.find(n => n.id === edge.target);
      if (!a || !b) return;
      if (!visibleNodes.includes(a) || !visibleNodes.includes(b)) return;
      drawEdge(ctx, a, b, currentTheme);
      // Future: if (edge.directed) draw arrowhead
    });
  } else {
    // Fallback to parentId (legacy tree)
    visibleNodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent && visibleNodes.includes(parent)) {
          drawEdge(ctx, parent, node, currentTheme);
        }
      }
    });
  }
    
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
    // Draw selection marquee if active (draw in world space)
    if (selectState.current.selecting) {
      const sx = Math.min(selectState.current.startX, selectState.current.currentX);
      const sy = Math.min(selectState.current.startY, selectState.current.currentY);
      const sw = Math.abs(selectState.current.currentX - selectState.current.startX);
      const sh = Math.abs(selectState.current.currentY - selectState.current.startY);
      ctx.save();
      ctx.translate(view.current.offsetX, view.current.offsetY);
      ctx.scale(view.current.scale, view.current.scale);
      ctx.strokeStyle = currentTheme.colors.primaryButton;
      ctx.lineWidth = 1 / view.current.scale; // keep 1px on screen
      // Semi-transparent fill
      ctx.fillStyle = currentTheme.colors.primaryButton;
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(sx, sy, sw, sh);
      ctx.globalAlpha = prevAlpha !== undefined ? prevAlpha : 1;
      // Border
      ctx.strokeRect(sx, sy, sw, sh);
      ctx.restore();
    }

    ctx.restore();

    if (typeof onViewBoxChange === 'function') {
      const vb = {
        x: -view.current.offsetX / view.current.scale,
        y: -view.current.offsetY / view.current.scale,
        width: canvas.width / view.current.scale,
        height: canvas.height / view.current.scale,
      };
      onViewBoxChange(vb);
    }
  }, [nodes, propsEdges, selectedNodeIds, highlightedNodeIds, currentTheme, width, height]);

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
      // Pan with space+drag or middle mouse button
      if (isSpaceDown || e.button === 1) {
        panState.current = {
          panning: true,
          startX: e.clientX,
          startY: e.clientY,
          startOffsetX: view.current.offsetX,
          startOffsetY: view.current.offsetY
        };
        return;
      }
      // Shift + drag to start marquee selection
      if (e.shiftKey && e.button === 0) {
        const { x, y } = getTransformed(e.clientX, e.clientY);
        selectState.current = { selecting: true, startX: x, startY: y, currentX: x, currentY: y };
        canvas.dispatchEvent(new Event('redraw'));
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
      // Marquee selection update
      if (selectState.current.selecting) {
        const { x, y } = getTransformed(e.clientX, e.clientY);
        selectState.current.currentX = x;
        selectState.current.currentY = y;
        canvas.dispatchEvent(new Event('redraw'));
        return;
      }
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
    const handleMouseUp = (e) => {
      // Finish marquee selection
      if (selectState.current.selecting) {
        const { startX, startY, currentX, currentY } = selectState.current;
        const minX = Math.min(startX, currentX);
        const minY = Math.min(startY, currentY);
        const maxX = Math.max(startX, currentX);
        const maxY = Math.max(startY, currentY);
        // Only trigger if dragged more than a tiny threshold
        if (Math.abs(maxX - minX) > 2 && Math.abs(maxY - minY) > 2) {
          const visibleNodes = getVisibleNodes(nodes);
          const inRect = visibleNodes
            .filter(n => n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY)
            .map(n => n.id);
          if (onSelectionChange) onSelectionChange(inRect);
          suppressClickRef.current = true;
        }
        selectState.current = { selecting: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
        canvas.dispatchEvent(new Event('redraw'));
      }
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
      
    // Draw edges
    if (Array.isArray(propsEdges) && propsEdges.length > 0) {
      propsEdges.forEach(edge => {
        const a = nodes.find(n => n.id === edge.source);
        const b = nodes.find(n => n.id === edge.target);
        if (!a || !b) return;
        if (!visibleNodes.includes(a) || !visibleNodes.includes(b)) return;
        drawEdge(ctx, a, b, currentTheme);
      });
    } else {
      visibleNodes.forEach(node => {
        if (node.parentId) {
          const parent = nodes.find(n => n.id === node.parentId);
          if (parent && visibleNodes.includes(parent)) {
            drawEdge(ctx, parent, node, currentTheme);
          }
        }
      });
    }
      
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
      // Draw selection marquee if active (world space)
      if (selectState.current.selecting) {
        const sx = Math.min(selectState.current.startX, selectState.current.currentX);
        const sy = Math.min(selectState.current.startY, selectState.current.currentY);
        const sw = Math.abs(selectState.current.currentX - selectState.current.startX);
        const sh = Math.abs(selectState.current.currentY - selectState.current.startY);
        ctx.save();
        ctx.translate(view.current.offsetX, view.current.offsetY);
        ctx.scale(view.current.scale, view.current.scale);
        ctx.strokeStyle = currentTheme.colors.primaryButton;
        ctx.lineWidth = 1 / view.current.scale;
        ctx.fillStyle = currentTheme.colors.primaryButton;
        const prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = 0.08;
        ctx.fillRect(sx, sy, sw, sh);
        ctx.globalAlpha = prevAlpha !== undefined ? prevAlpha : 1;
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.restore();
      }

      ctx.restore();

      if (typeof onViewBoxChange === 'function') {
        const vb = {
          x: -view.current.offsetX / view.current.scale,
          y: -view.current.offsetY / view.current.scale,
          width: canvas.width / view.current.scale,
          height: canvas.height / view.current.scale,
        };
        onViewBoxChange(vb);
      }
    };
    canvas.addEventListener('mousedown', handleMouseDown);
    // prevent default browser menu; VertexCanvas exposes onContextMenu via props
    const handleContextMenu = (e) => {
      e.preventDefault();
      const { x, y } = getTransformed(e.clientX, e.clientY);
      // Check visible nodes only
      const visibleNodes = getVisibleNodes(nodes);
      let clickedNodeId = null;
      const nodeRadius = currentTheme.colors.nodeRadius;
      for (const node of visibleNodes) {
        const dx = node.x - x;
        const dy = node.y - y;
        if (dx * dx + dy * dy < nodeRadius * nodeRadius) {
          clickedNodeId = node.id;
          break;
        }
      }
      if (typeof onNodeClick === 'function' && false) {}
      if (typeof onNodeDoubleClick === 'function' && false) {}
      if (typeof onSelectionChange === 'function' && false) {}
      if (typeof ref === 'function' && false) {}
      if (typeof onViewBoxChange === 'function' && false) {}
      if (typeof window !== 'undefined') {}
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof (onContextMenuRequest) === 'function') {
        onContextMenuRequest({
          screenX: e.clientX,
          screenY: e.clientY,
          worldX: x,
          worldY: y,
          nodeId: clickedNodeId
        });
      }
    };
    canvas.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('redraw', handleRedraw);
    // Pointer/touch support
    const onPointerDown = (e) => {
      if (!canvas.contains(e.target)) return;
      if (e.pointerType !== 'mouse') {
        canvas.setPointerCapture?.(e.pointerId);
      }
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });

      // Long-press to open context menu on touch
      if (e.pointerType === 'touch') {
        longPressRef.current = { timer: null, startX: e.clientX, startY: e.clientY, fired: false };
        longPressRef.current.timer = setTimeout(() => {
          if (longPressRef.current.fired) return;
          longPressRef.current.fired = true;
          const rect = canvas.getBoundingClientRect();
          const worldX = (e.clientX - rect.left - view.current.offsetX) / view.current.scale;
          const worldY = (e.clientY - rect.top - view.current.offsetY) / view.current.scale;
          // Hit test visible nodes
          const visibleNodes = getVisibleNodes(nodes);
          const nodeRadius = currentTheme.colors.nodeRadius;
          let clickedNodeId = null;
          for (const node of visibleNodes) {
            const dx = node.x - worldX;
            const dy = node.y - worldY;
            if (dx * dx + dy * dy < nodeRadius * nodeRadius) { clickedNodeId = node.id; break; }
          }
          if (typeof onContextMenuRequest === 'function') {
            onContextMenuRequest({ screenX: e.clientX, screenY: e.clientY, worldX, worldY, nodeId: clickedNodeId });
          }
        }, 500);
      }

      if (pointers.current.size === 2) {
        // Begin pinch gesture
        const pts = Array.from(pointers.current.values());
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        pinchState.current = { active: true, startDist: Math.hypot(dx, dy), startScale: view.current.scale };
      } else if (pointers.current.size === 1 && e.pointerType === 'touch') {
        // Reuse mouse down logic for single-finger drag/pan on touch
        handleMouseDown(e);
      }
    };
    const onPointerMove = (e) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
      // Cancel long press on movement
      if (longPressRef.current.timer) {
        const dx = Math.abs(e.clientX - longPressRef.current.startX);
        const dy = Math.abs(e.clientY - longPressRef.current.startY);
        if (dx + dy > 12) { clearTimeout(longPressRef.current.timer); longPressRef.current.timer = null; }
      }
      if (pinchState.current.active && pointers.current.size >= 2) {
        const pts = Array.from(pointers.current.values());
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const factor = dist / Math.max(1, pinchState.current.startDist);
        const newScale = Math.max(0.05, pinchState.current.startScale * factor);
        // Scale around midpoint
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const rect = canvas.getBoundingClientRect();
        const worldMidX = (midX - rect.left - view.current.offsetX) / view.current.scale;
        const worldMidY = (midY - rect.top - view.current.offsetY) / view.current.scale;
        view.current.scale = newScale;
        view.current.offsetX = midX - rect.left - worldMidX * newScale;
        view.current.offsetY = midY - rect.top - worldMidY * newScale;
        canvas.dispatchEvent(new Event('redraw'));
      } else if (e.pointerType === 'touch' && pointers.current.size === 1) {
        handleMouseMove(e);
      }
    };
    const onPointerUpOrCancel = (e) => {
      if (longPressRef.current.timer) { clearTimeout(longPressRef.current.timer); longPressRef.current.timer = null; }
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinchState.current.active = false;
      if (e.pointerType === 'touch') {
        handleMouseUp(e);
      }
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUpOrCancel);
    window.addEventListener('pointercancel', onPointerUpOrCancel);
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('redraw', handleRedraw);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUpOrCancel);
      window.removeEventListener('pointercancel', onPointerUpOrCancel);
    };
  }, [nodes, propsEdges, onNodePositionChange, selectedNodeIds, highlightedNodeIds, currentTheme]);

  // Handle click (with pan/zoom)
  const handleClick = e => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
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
        // Do not trigger single-select click callback in multi-select mode
      } else {
        // Single selection
        onSelectionChange && onSelectionChange([clickedNodeId]);
      }
      
      // Also call the original onNodeClick for backward compatibility
      if (!isMultiSelect) {
        onNodeClick && onNodeClick(clickedNodeId);
      }
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
      width={width}
      height={height}
      style={{ 
        background: currentTheme.colors.canvasBackground, 
        border: `1px solid ${currentTheme.colors.panelBorder}`, 
        borderRadius: 8, 
        display: 'block', 
        margin: 0,
        cursor: 'grab',
        touchAction: 'none'
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      onContextMenu={e => e.preventDefault()}
    />
  );
});

export default VertexCanvas;
