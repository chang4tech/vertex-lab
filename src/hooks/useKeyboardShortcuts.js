import { useCallback, useEffect } from 'react';

export function useKeyboardShortcuts({
  onNew,
  onImport,
  onExport,
  onExportPNG,
  onUndo,
  onRedo,
  selectedNodeId,
  onDeleteNode,
  onCenter,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleMinimap
}) {
  const handleKeyDown = useCallback((e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Common command key for both Windows (Ctrl) and Mac (Cmd)
    const isCommandKey = e.metaKey || e.ctrlKey;
    
    if (isCommandKey && e.shiftKey) {
      // Command + Shift shortcuts for file operations to avoid browser conflicts
      switch (e.key.toLowerCase()) {
        case 'n': {
          e.preventDefault();
          onNew?.();
          break;
        }

        case 's': {
          e.preventDefault();
          onExportPNG?.();
          break;
        }

        case 'o': {
          e.preventDefault();
          onImport?.();
          break;
        }

        case 'z': {
          e.preventDefault();
          onRedo?.();
          break;
        }
      }
      return;
    }

    if (isCommandKey) {
      switch (e.key.toLowerCase()) {
        case 'n': {
          e.preventDefault();
          onNew?.();
          break;
        }
        case 's': {
          e.preventDefault();
          onExport?.();
          break;
        }
        case 'o': {
          e.preventDefault();
          onImport?.();
          break;
        }
        case 'z': {
          e.preventDefault();
          if (e.shiftKey) {
            onRedo?.();
          } else {
            onUndo?.();
          }
          break;
        }
      }
      return;
    }

    // Handle alt key shortcuts for view operations
    if (e.altKey) {
      switch (e.key.toLowerCase()) {
        case '=':
        case '+': {
          e.preventDefault();
          onZoomIn?.();
          break;
        }

        case '-': {
          e.preventDefault();
          onZoomOut?.();
          break;
        }

        case '0': {
          e.preventDefault();
          onResetZoom?.();
          break;
        }

        case 'c': {
          e.preventDefault();
          onCenter?.();
          break;
        }
      }
      return;
    }

    // Handle non-modifier key shortcuts
    if (!isCommandKey && !e.altKey && !e.shiftKey) {
      switch (e.key) {
        case 'Delete':
        case 'Backspace': {
          if (selectedNodeId) {
            e.preventDefault();
            onDeleteNode?.(selectedNodeId);
          }
          break;
        }

        case 'm': {
          e.preventDefault();
          onToggleMinimap?.();
          break;
        }
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
    onDeleteNode,
    onCenter,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onToggleMinimap
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
