import React from 'react';

export function EditMenu({ onUndo, onRedo, onDelete, isOpen, onClose }) {
  const menuStyle = {
    position: 'absolute',
    top: 32,
    left: 0,
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: 4,
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    minWidth: 140,
    zIndex: 1000,
    padding: '4px 0',
    display: isOpen ? 'block' : 'none'
  };

  const itemStyle = {
    padding: '8px 20px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between'
  };

  const handleClick = React.useCallback((handler) => (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handler();
    onClose();
  }, [onClose]);

  return (
    <div className="menu-dropdown" style={menuStyle}>
      <div style={itemStyle} onClick={handleClick(onUndo)}>
        <span>Undo</span>
        <span style={{ opacity: 0.5, marginLeft: 20 }}>⌘Z</span>
      </div>
      <div style={itemStyle} onClick={handleClick(onRedo)}>
        <span>Redo</span>
        <span style={{ opacity: 0.5, marginLeft: 20 }}>⇧⌘Z</span>
      </div>
      <div style={itemStyle} onClick={handleClick(onDelete)}>
        <span>Delete</span>
        <span style={{ opacity: 0.5, marginLeft: 20 }}>⌫</span>
      </div>
    </div>
  );
}
