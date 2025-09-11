import React, { forwardRef } from 'react';
import useCanvasOperations from '../../hooks/useCanvasOperations';
import Node from './Node';
import Edge from './Edge';

const NODE_RADIUS = 32;
const NODE_COLOR = '#fff';
const NODE_BORDER = '#007bff';
const NODE_TEXT = '#333';
const EDGE_COLOR = '#aaa';

const MindMapCanvas = forwardRef(({ 
  nodes, 
  onNodeClick, 
  selectedNodeId, 
  onNodePositionChange 
}, ref) => {
  const {
    canvasRef,
    handleClick,
    exportAsPNG,
    center,
    zoom,
    resetZoom
  } = useCanvasOperations({
    nodes,
    onNodeClick,
    selectedNodeId,
    onNodePositionChange,
    NODE_RADIUS
  });

  // Expose methods through ref
  React.useImperativeHandle(ref, () => ({
    exportAsPNG,
    center,
    zoom,
    resetZoom
  }));

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ 
        background: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: 8, 
        display: 'block', 
        margin: '40px auto', 
        cursor: 'grab' 
      }}
      onClick={handleClick}
      tabIndex={0}
      onContextMenu={e => e.preventDefault()}
    />
  );
});

export default MindMapCanvas;
