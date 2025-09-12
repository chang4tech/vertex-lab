import React from 'react';

export function ViewMenu({ isOpen, onClose, onCenter, onZoomIn, onZoomOut, onResetZoom, showMinimap, onToggleMinimap }) {
  const handleClick = React.useCallback((handler) => (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handler();
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div role="menu" className="menu">
      <div className="menu-item" onClick={handleClick(onCenter)}>
        <span>Center</span>
      </div>
      <div className="menu-item" onClick={handleClick(onZoomIn)}>
        <span>Zoom In</span>
      </div>
      <div className="menu-item" onClick={handleClick(onZoomOut)}>
        <span>Zoom Out</span>
      </div>
      <div className="menu-item" onClick={handleClick(onResetZoom)}>
        <span>Reset Zoom</span>
      </div>
      <div className="menu-separator" />
      <div className="menu-item" onClick={handleClick(onToggleMinimap)}>
        <span>Show Minimap</span>
        {showMinimap && <span className="menu-check">✓</span>}
      </div>
    </div>
  );
}
