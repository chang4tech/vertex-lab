import React from 'react';
import { formatShortcut } from '../../utils/shortcutUtils';

export function ViewMenu({ isOpen, onClose, onCenter, onZoomIn, onZoomOut, onResetZoom, showMinimap, onToggleMinimap }) {
  const handleClick = React.useCallback((handler) => (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handler();
    onClose();
  }, [onClose]);

  const key = (k, mods=[]) => formatShortcut({ key: k, modifiers: mods });

  if (!isOpen) return null;

  return (
    <div role="menu" className="menu">
      <div className="menu-item" onClick={handleClick(onCenter)}>
        <span>Center</span>
        <span className="menu-shortcut">{key('c', ['alt'])}</span>
      </div>
      <div className="menu-item" onClick={handleClick(onZoomIn)}>
        <span>Zoom In</span>
        <span className="menu-shortcut">{key('+', ['alt'])}</span>
      </div>
      <div className="menu-item" onClick={handleClick(onZoomOut)}>
        <span>Zoom Out</span>
        <span className="menu-shortcut">{key('-', ['alt'])}</span>
      </div>
      <div className="menu-item" onClick={handleClick(onResetZoom)}>
        <span>Reset Zoom</span>
        <span className="menu-shortcut">{key('0', ['alt'])}</span>
      </div>
      <div className="menu-separator" />
      <div className="menu-item" onClick={handleClick(onToggleMinimap)}>
        <span>Show Minimap</span>
        <span className="menu-shortcut">{key('m', [])}</span>
        {showMinimap && <span className="menu-check">✓</span>}
      </div>
    </div>
  );
}
