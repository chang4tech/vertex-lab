import React, { useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

export function Minimap({ nodes, viewBox, scale = 0.15, visible, onViewportChange }) {
  const canvasRef = useRef(null);
  const lastDraw = useRef({ bounds: null, finalScale: 1, padding: 20 });

  // Calculate diagram bounds
  const getBounds = useCallback(() => {
    if (!nodes?.length) return { minX: 0, maxX: 800, minY: 0, maxY: 600 };
    return nodes.reduce((bounds, node) => ({
      minX: Math.min(bounds.minX, node.x - 50),  // 50 is half node width
      maxX: Math.max(bounds.maxX, node.x + 50),
      minY: Math.min(bounds.minY, node.y - 20),  // 20 is half node height
      maxY: Math.max(bounds.maxY, node.y + 20)
    }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  }, [nodes]);

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

    // Draw nodes with adjusted scale
    nodes.forEach(node => {
      const x = node.x * finalScale;
      const y = node.y * finalScale;
      const nodeWidth = 100 * finalScale;  // Default node width
      const nodeHeight = 40 * finalScale;  // Default node height

      // Draw node rectangle
      ctx.fillRect(x - nodeWidth/2, y - nodeHeight/2, nodeWidth, nodeHeight);
      ctx.strokeRect(x - nodeWidth/2, y - nodeHeight/2, nodeWidth, nodeHeight);

      // Add a dot in the center for better visibility
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#333';
      ctx.fill();
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
  }, [nodes, viewBox, scale, visible, getBounds]);

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
    <div className="minimap">
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
  scale: 0.15,
  visible: false
};
