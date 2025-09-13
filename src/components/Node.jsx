import React from 'react';

export function Node({ 
  node, 
  isSelected, 
  onSelect, 
  onDoubleClick, 
  onContextMenu,
  onStartDrag,
  onDrag,
  onEndDrag
}) {
  const lastTouchRef = React.useRef({ x: 0, y: 0 });
  const handleMouseDown = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(node.id);
    onStartDrag(node.id);
    document.body.style.userSelect = 'none';
    const clearSelection = () => {
      document.body.style.userSelect = '';
      document.removeEventListener('mouseup', clearSelection);
      document.removeEventListener('touchend', clearSelection);
    };
    document.addEventListener('mouseup', clearSelection);
    document.addEventListener('touchend', clearSelection);
  }, [onSelect, onStartDrag, node.id]);

  const handleMouseMove = React.useCallback((e) => {
    if (!isSelected) return;

    let movementX = 0;
    let movementY = 0;

    if ('movementX' in e && 'movementY' in e) {
      movementX = e.movementX;
      movementY = e.movementY;
    } else if (e.touches && e.touches[0]) {
      movementX = e.touches[0].clientX - lastTouchRef.current.x;
      movementY = e.touches[0].clientY - lastTouchRef.current.y;
      
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }

    onDrag(node.id, movementX, movementY);
  }, [isSelected, onDrag, node.id]);

  const handleMouseUp = React.useCallback(() => {
    if (isSelected) {
      onEndDrag(node.id);
      document.body.style.userSelect = '';
    }
  }, [isSelected, onEndDrag, node.id]);

  const handleTouchStart = React.useCallback((e) => {
    e.preventDefault();
    lastTouchRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    onSelect(node.id);
    onStartDrag(node.id);
    document.body.style.userSelect = 'none';
  }, [onSelect, onStartDrag, node.id]);

  const handleContextMenu = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node.id);
  }, [onContextMenu, node.id]);

  const handleDoubleClick = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onDoubleClick(node.id);
  }, [onDoubleClick, node.id]);

  React.useEffect(() => {
    if (isSelected) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isSelected, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`node ${isSelected ? 'selected' : ''}`}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: node.width,
        height: node.height,
        backgroundColor: node.color
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {node.text}
    </div>
  );
}
