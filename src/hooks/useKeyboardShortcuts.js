import { useCallback, useEffect } from 'react';

// Helper to robustly match a letter key across layouts (uses e.key and e.code)
const isLetter = (e, letter) => {
  const key = (e.key || '').toLowerCase();
  const code = e.code || '';
  const upper = String(letter || '').toUpperCase();
  return key === String(letter).toLowerCase() || code === `Key${upper}`;
};

export function useKeyboardShortcuts({
  onNew,
  onImport,
  onExport,
  onExportPNG,
  onUndo,
  onRedo,
  selectedNodeId,
  selectedNodeIds,
  onDeleteNode,
  onCenter,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleMinimap,
  onToggleConnections
}) {
  const handleKeyDown = useCallback((e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Common command key for both Windows (Ctrl) and Mac (Cmd)
    const isCommandKey = e.metaKey || e.ctrlKey;
    
    // Prefer Command/Ctrl + Alt for file ops to avoid browser conflicts
    if (isCommandKey && e.altKey) {
      if (isLetter(e, 'n')) {
        e.preventDefault();
        onNew?.();
        return;
      }
      if (isLetter(e, 'o')) {
        e.preventDefault();
        onImport?.();
        return;
      }
      if (isLetter(e, 'p')) {
        e.preventDefault();
        onExportPNG?.();
        return;
      }
      return;
    }

    if (isCommandKey && e.shiftKey) {
      // Fallback support for some legacy Shift-based combos
      if (isLetter(e, 'z')) {
        e.preventDefault();
        onRedo?.();
        return;
      }
      if (isLetter(e, 'o')) {
        e.preventDefault();
        onImport?.();
        return;
      }
      if (isLetter(e, 's')) {
        e.preventDefault();
        onExportPNG?.();
        return;
      }
      if (isLetter(e, 'n')) {
        // Note: Browsers may reserve this (Private Window) and ignore handlers
        e.preventDefault();
        onNew?.();
        return;
      }
      return;
    }

    if (isCommandKey) {
      if (isLetter(e, 's')) {
        e.preventDefault();
        onExport?.();
        return;
      }
      if (isLetter(e, 'z')) {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
        return;
      }
      if (isLetter(e, 'l')) {
        e.preventDefault();
        // onAutoLayout?.();
        return;
      }
      if (isLetter(e, 'f')) {
        e.preventDefault();
        // onSearch?.();
        return;
      }
      if (isLetter(e, 'i')) {
        e.preventDefault();
        // onToggleNodeInfo?.();
        return;
      }
      return;
    }

    // Handle alt key shortcuts for view operations
    if (e.altKey) {
      const key = (e.key || '').toLowerCase();
      const code = e.code || '';
      switch (key) {
        case '=':
        case '+': {
          e.preventDefault();
          onZoomIn?.();
          break;
        }
        default: {
          // Some layouts report only code for plus/equals
          if (code === 'Equal' || code === 'NumpadAdd') {
            e.preventDefault();
            onZoomIn?.();
            break;
          }
        }
      }

      // Separate checks for other alt operations using code-safe mapping
      if (key === '-') {
        e.preventDefault();
        onZoomOut?.();
        return;
      }
      if (code === 'Minus' || code === 'NumpadSubtract') {
        e.preventDefault();
        onZoomOut?.();
        return;
      }

      if (key === '0') {
        e.preventDefault();
        onResetZoom?.();
        return;
      }
      if (code === 'Digit0' || code === 'Numpad0') {
        e.preventDefault();
        onResetZoom?.();
        return;
      }

      // Center view: use code to be robust against Alt/Option producing special chars (e.g., ç)
      if (key === 'c' || code === 'KeyC') {
        e.preventDefault();
        onCenter?.();
        return;
      }
      return;
    }

    // Handle Shift+E specifically for connections
    if (!isCommandKey && !e.altKey && e.shiftKey && isLetter(e, 'e')) {
      if (Array.isArray(selectedNodeIds) && selectedNodeIds.length >= 2) {
        e.preventDefault();
        onToggleConnections?.(selectedNodeIds, { shift: true });
      }
      return;
    }

    // Handle non-modifier key shortcuts
    if (!isCommandKey && !e.altKey && !e.shiftKey) {
      const keyName = (e.key || '');
      if (keyName === 'Delete' || keyName === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          onDeleteNode?.(selectedNodeId);
        }
        return;
      }

      if (isLetter(e, 'm')) {
        e.preventDefault();
        onToggleMinimap?.();
        return;
      }

      if (isLetter(e, 'e')) {
        if (Array.isArray(selectedNodeIds) && selectedNodeIds.length >= 2) {
          e.preventDefault();
          onToggleConnections?.(selectedNodeIds, { shift: e.shiftKey === true });
        }
        return;
      }
    }
  }, [
    onNew,
    onImport,
    onExport,
    onExportPNG,
    onUndo,
    onRedo,
    selectedNodeId,
    selectedNodeIds,
    onDeleteNode,
    onCenter,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onToggleMinimap,
    onToggleConnections
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
