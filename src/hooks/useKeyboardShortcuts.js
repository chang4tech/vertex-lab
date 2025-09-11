import { useCallback, useEffect } from 'react';

export function useKeyboardShortcuts({
  onNew,
  onImport,
  onExport,
  onExportPNG,
  onUndo,
  onRedo,
  selectedNodeId,
  onDeleteNode
}) {
  const handleKeyDown = useCallback((e) => {
    // Common command key for both Windows (Ctrl) and Mac (Cmd)
    const isCommandKey = e.metaKey || e.ctrlKey;
    
    if (isCommandKey) {
      switch (e.key.toLowerCase()) {
        case 'n': {
          e.preventDefault();
          onNew();
          break;
        }

        case 's': {
          e.preventDefault();
          if (e.shiftKey) {
            onExportPNG();
          } else {
            onExport();
          }
          break;
        }

        case 'o': {
          e.preventDefault();
          onImport();
          break;
        }

        case 'z': {
          e.preventDefault();
          if (e.shiftKey) {
            onRedo();
          } else {
            onUndo();
          }
          break;
        }
      }
    }

    // Handle delete/backspace for selected node
    if (selectedNodeId && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      onDeleteNode(selectedNodeId);
    }
  }, [
    onNew,
    onImport,
    onExport,
    onExportPNG,
    onUndo,
    onRedo,
    selectedNodeId,
    onDeleteNode
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
