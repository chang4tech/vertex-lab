import React, { useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import { NODE_SHAPES, upgradeNode, getThemeNodeColor, getNodeBorderColor, getVisibleNodes } from '../../utils/nodeUtils';

export function Minimap({ nodes, edges = [], viewBox, scale = 0.15, visible, onViewportChange }) {
  const canvasRef = useRef(null);
  const lastDraw = useRef({ bounds: null, finalScale: 1, padding: 20 });
  const { currentTheme } = useTheme();

  // Compute half extents based on shape and theme radius
  const getHalfExtents = useCallback((node) => {
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
  }, [currentTheme]);

  // Calculate diagram bounds
  const getBounds = useCallback(() => {
    const defaultBounds = { minX: 0, maxX: 800, minY: 0, maxY: 600 };
    const sourceNodes = Array.isArray(nodes) ? nodes.filter(Boolean) : [];
    if (sourceNodes.length === 0) return defaultBounds;

    const visibleNodes = getVisibleNodes(sourceNodes, edges);
    const pool = visibleNodes.length > 0 ? visibleNodes : sourceNodes;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    pool.forEach(node => {
      if (!node) return;
      const enhanced = upgradeNode(node);
      const x = Number(enhanced?.x);
      const y = Number(enhanced?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
      const { hw, hh } = getHalfExtents(enhanced);
      if (!Number.isFinite(hw) || !Number.isFinite(hh)) {
        return;
      }
      const left = x - hw;
      const right = x + hw;
      const top = y - hh;
      const bottom = y + hh;
      if (!Number.isFinite(left) || !Number.isFinite(right) || !Number.isFinite(top) || !Number.isFinite(bottom)) {
        return;
      }
      if (left < minX) minX = left;
      if (right > maxX) maxX = right;
      if (top < minY) minY = top;
      if (bottom > maxY) maxY = bottom;
    });

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
      return defaultBounds;
    }

    return { minX, maxX, minY, maxY };
  }, [nodes, edges, getHalfExtents]);

  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Calculate map bounds
    const bounds = getBounds();
    const padding = 20;  // Add padding around the diagram
    const mapWidth = bounds.maxX - bounds.minX + padding * 2;
    const mapHeight = bounds.maxY - bounds.minY + padding * 2;
    const baseScale = Math.min(200 / mapWidth, 150 / mapHeight);  // Target minimap size
    const finalScale = Math.min(scale, baseScale);
    lastDraw.current = { bounds, finalScale, padding };

    // Update canvas size
    canvas.width = mapWidth * finalScale;
    canvas.height = mapHeight * finalScale;

    // Clear canvas and set up initial styles
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f0f0';
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;

    // Apply transform to center the diagram
    ctx.translate(padding * finalScale, padding * finalScale);
    ctx.translate(-bounds.minX * finalScale, -bounds.minY * finalScale);

    // Draw nodes using their actual shapes/colors
    const visibleNodes = getVisibleNodes(nodes, edges);
    visibleNodes.forEach(node => {
      const enhanced = upgradeNode(node);
      const nodeX = Number(enhanced?.x);
      const nodeY = Number(enhanced?.y);
      const baseRadius = Number(currentTheme?.colors?.nodeRadius);
      if (!Number.isFinite(nodeX) || !Number.isFinite(nodeY) || !Number.isFinite(baseRadius) || baseRadius <= 0) {
        return;
      }
      const x = nodeX * finalScale;
      const y = nodeY * finalScale;
      const r = baseRadius * finalScale;
      const shape = enhanced.shape || NODE_SHAPES.CIRCLE;
      const fillColor = getThemeNodeColor(enhanced, currentTheme);
      const strokeColor = getNodeBorderColor(enhanced, currentTheme);

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1; // thin strokes on minimap

      switch (shape) {
        case NODE_SHAPES.CIRCLE:
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          break;
        case NODE_SHAPES.RECTANGLE: {
          const w = r * 1.6;
          const h = r * 1.2;
          ctx.fillRect(x - w/2, y - h/2, w, h);
          ctx.strokeRect(x - w/2, y - h/2, w, h);
          break;
        }
        case NODE_SHAPES.ROUNDED_RECTANGLE: {
          const w = r * 1.6;
          const h = r * 1.2;
          const cr = 4 * finalScale;
          ctx.beginPath();
          // Polyfill for older ctx: draw rounded rect path
          const left = x - w/2, top = y - h/2, right = x + w/2, bottom = y + h/2;
          ctx.moveTo(left + cr, top);
          ctx.lineTo(right - cr, top);
          ctx.quadraticCurveTo(right, top, right, top + cr);
          ctx.lineTo(right, bottom - cr);
          ctx.quadraticCurveTo(right, bottom, right - cr, bottom);
          ctx.lineTo(left + cr, bottom);
          ctx.quadraticCurveTo(left, bottom, left, bottom - cr);
          ctx.lineTo(left, top + cr);
          ctx.quadraticCurveTo(left, top, left + cr, top);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }
        case NODE_SHAPES.DIAMOND:
          ctx.beginPath();
          ctx.moveTo(x, y - r);
          ctx.lineTo(x + r, y);
          ctx.lineTo(x, y + r);
          ctx.lineTo(x - r, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        case NODE_SHAPES.HEXAGON: {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = x + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }
        case NODE_SHAPES.ELLIPSE:
          ctx.beginPath();
          ctx.ellipse(x, y, r * 1.4, r * 0.8, 0, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          break;
        default:
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
      }
    });

    // Draw viewport rectangle
    if (viewBox) {
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        viewBox.x * finalScale,
        viewBox.y * finalScale,
        viewBox.width * finalScale,
        viewBox.height * finalScale
      );
    }
  }, [nodes, edges, viewBox, scale, visible, getBounds, currentTheme]);

  if (!visible) return null;

  const handleClick = (e) => {
    if (!onViewportChange) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { bounds, finalScale, padding } = lastDraw.current;
    if (!bounds) return;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    // Inverse of translate(padding)+translate(-bounds.min)
    const worldX = (cx - padding * finalScale) / finalScale + bounds.minX;
    const worldY = (cy - padding * finalScale) / finalScale + bounds.minY;
    // Keep current viewport size if available
    const width = viewBox?.width || 800;
    const height = viewBox?.height || 600;
    onViewportChange({
      x: worldX - width / 2,
      y: worldY - height / 2,
      width,
      height,
    });
  };

  return (
    <div className={`minimap ${visible ? 'show' : ''}`}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          maxWidth: '250px',
          maxHeight: '200px'
        }}
      />
    </div>
  );
}

Minimap.propTypes = {
  nodes: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    label: PropTypes.string
  })),
  edges: PropTypes.arrayOf(PropTypes.shape({
    source: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    target: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
  })),
  viewBox: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired
  }),
  onViewportChange: PropTypes.func,
  scale: PropTypes.number,
  visible: PropTypes.bool
};

Minimap.defaultProps = {
  nodes: [],
  edges: [],
  scale: 0.15,
  visible: false
};
