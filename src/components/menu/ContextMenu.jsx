import React from 'react';

export function ContextMenu({ x, y, isOpen, onClose, children, pointerType = 'mouse' }) {
  const menuRef = React.useRef(null);
  const skipNextMouseDownRef = React.useRef(false);

  React.useEffect(() => {
    if (!isOpen) {
      skipNextMouseDownRef.current = false;
      return;
    }
    skipNextMouseDownRef.current = pointerType !== 'mouse';
  }, [isOpen, pointerType]);

  const handleOutsideClick = React.useCallback((e) => {
    // Skip if the menu is not open
    if (!isOpen) return;

    if (pointerType !== 'mouse' && e.type === 'mousedown' && skipNextMouseDownRef.current) {
      skipNextMouseDownRef.current = false;
      return;
    }

    // Skip if the click was inside the menu
    if (menuRef.current && menuRef.current.contains(e.target)) {
      return;
    }

    // Call onClose for clicks outside
    onClose();
  }, [isOpen, onClose, pointerType]);

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
      // Respect safe-area when clamping to edges on mobile
      menuRef.current.style.right = right ? 'calc(10px + env(safe-area-inset-right))' : '';
      menuRef.current.style.bottom = bottom ? 'calc(10px + env(safe-area-inset-bottom))' : '';
      menuRef.current.style.left = right ? '' : `${x}px`;
      menuRef.current.style.top = bottom ? '' : `${y}px`;
    } else {
      menuRef.current.style.right = '';
      menuRef.current.style.bottom = '';
      menuRef.current.style.left = `${x}px`;
      menuRef.current.style.top = `${y}px`;
    }
  }, [x, y, isOpen]);

  // While open, disable text selection/callout globally to prevent iOS toolbars
  React.useEffect(() => {
    if (!isOpen) return;
    const cls = 'no-touch-callout';
    try { document.body.classList.add(cls); } catch {}
    return () => { try { document.body.classList.remove(cls); } catch {} };
  }, [isOpen]);

  if (!isOpen) return null;

  const menuStyle = {
    position: 'absolute',
    left: x,
    top: y,
    zIndex: 1000
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      data-testid="context-menu"
      ref={menuRef}
      className="menu"
      style={menuStyle}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {children}
    </div>
  );
}
