import React from 'react';

export function ContextMenu({ x, y, isOpen, onClose, children }) {
  const menuRef = React.useRef(null);
  const handleOutsideClick = React.useCallback((e) => {
    // Skip if the menu is not open
    if (!isOpen) return;
    
    // Skip if the click was inside the menu
    if (menuRef.current && menuRef.current.contains(e.target)) {
      return;
    }

    // Call onClose for clicks outside
    onClose();
  }, [isOpen, onClose]);
  
  React.useEffect(() => {
    // Only add listeners when menu is open
    if (!isOpen) return;

    // Add the event listeners
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    // Clean up the event listeners
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen, handleOutsideClick]);

  React.useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const right = x + menuRect.width > viewportWidth;
    const bottom = y + menuRect.height > viewportHeight;

    if (right || bottom) {
      menuRef.current.style.right = right ? '10px' : '';
      menuRef.current.style.bottom = bottom ? '10px' : '';
      menuRef.current.style.left = right ? '' : `${x}px`;
      menuRef.current.style.top = bottom ? '' : `${y}px`;
    } else {
      menuRef.current.style.right = '';
      menuRef.current.style.bottom = '';
      menuRef.current.style.left = `${x}px`;
      menuRef.current.style.top = `${y}px`;
    }
  }, [x, y, isOpen]);

  if (!isOpen) return null;

  const menuStyle = {
    position: 'absolute',
    left: x,
    top: y,
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: 1000
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      data-testid="context-menu"
      style={menuStyle}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
}
