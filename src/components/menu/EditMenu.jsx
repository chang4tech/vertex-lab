import React from 'react';
import { formatShortcut } from '../../utils/shortcutUtils';

export function EditMenu({ onUndo, onRedo, onDelete, isOpen, onClose }) {
  if (!isOpen) return null;
  const menuStyle = {
    position: 'absolute',
    top: 32,
    left: 0
  };

  const handleClick = React.useCallback((handler) => (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handler();
    onClose();
  }, [onClose]);

  const key = (k, mods=[]) => formatShortcut({ key: k, modifiers: mods });

  return (
    <div role="menu" className="menu-dropdown" style={menuStyle}>
      <div className="menu-item" onClick={handleClick(onUndo)}>
        <span>Undo</span>
        <span className="menu-shortcut">⌘Z</span>
      </div>
      <div className="menu-item" onClick={handleClick(onRedo)}>
        <span>Redo</span>
        <span className="menu-shortcut">⇧⌘Z</span>
      </div>
      <div className="menu-item" onClick={handleClick(onDelete)}>
        <span>Delete</span>
        <span className="menu-shortcut">⌫</span>
      </div>
    </div>
  );
}
