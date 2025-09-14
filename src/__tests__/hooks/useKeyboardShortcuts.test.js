import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
// Import is handled above

describe('useKeyboardShortcuts', () => {
  const mockHandlers = {
    onNew: vi.fn(),
    onImport: vi.fn(),
    onExport: vi.fn(),
    onExportPNG: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    selectedNodeId: 1,
    onDeleteNode: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles New shortcut (Cmd/Ctrl + Alt + N) and ignores plain Cmd/Ctrl+N', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    // Plain Cmd/Ctrl+N should be ignored (browser shortcut)
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', metaKey: true, bubbles: true }));
    });
    expect(mockHandlers.onNew).not.toHaveBeenCalled();

    // Cmd/Ctrl+Alt+N should trigger
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', metaKey: true, altKey: true, bubbles: true }));
    });
    expect(mockHandlers.onNew).toHaveBeenCalledTimes(1);
  });

  it('handles Import shortcut (Cmd/Ctrl + Alt + O)', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', metaKey: true, altKey: true, bubbles: true }));
    });
    expect(mockHandlers.onImport).toHaveBeenCalledTimes(1);
  });

  it('handles Export shortcut (Cmd/Ctrl + S)', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    });

    expect(mockHandlers.onExport).toHaveBeenCalledTimes(1);
  });

  it('handles Export PNG shortcut (Cmd/Ctrl + Alt + P)', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'p',
        metaKey: true,
        altKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    });

    expect(mockHandlers.onExportPNG).toHaveBeenCalledTimes(1);
  });

  it('handles Undo shortcut (Cmd/Ctrl + Z)', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    });

    expect(mockHandlers.onUndo).toHaveBeenCalledTimes(1);
  });

  it('handles Redo shortcut (Cmd/Ctrl + Shift + Z)', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    });

    expect(mockHandlers.onRedo).toHaveBeenCalledTimes(1);
  });

  it('handles Alt-based zoom and center', () => {
    const handlers = {
      ...mockHandlers,
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onResetZoom: vi.fn(),
      onCenter: vi.fn(),
      onToggleMinimap: vi.fn(),
    };
    renderHook(() => useKeyboardShortcuts(handlers));

    // Alt + '='
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '=', altKey: true, bubbles: true }));
    });
    expect(handlers.onZoomIn).toHaveBeenCalled();

    // Alt + '-'
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '-', altKey: true, bubbles: true }));
    });
    expect(handlers.onZoomOut).toHaveBeenCalled();

    // Alt + '0'
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '0', altKey: true, bubbles: true }));
    });
    expect(handlers.onResetZoom).toHaveBeenCalled();

    // Alt + 'c'
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', altKey: true, bubbles: true }));
    });
    expect(handlers.onCenter).toHaveBeenCalled();
  });

  it('does not trigger shortcuts when typing in inputs and toggles minimap with M', () => {
    const handlers = {
      ...mockHandlers,
      onToggleMinimap: vi.fn(),
      onNew: vi.fn(),
    };
    renderHook(() => useKeyboardShortcuts(handlers));

    // Create an input element as event target
    const input = document.createElement('input');
    document.body.appendChild(input);

    // Cmd/Ctrl+N on input should be ignored
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', metaKey: true, bubbles: true }));
    expect(handlers.onNew).not.toHaveBeenCalled();

    // Plain 'm' should toggle minimap
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    expect(handlers.onToggleMinimap).toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('handles Delete when node is selected', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true
      });
      document.dispatchEvent(event);
    });

    expect(mockHandlers.onDeleteNode).toHaveBeenCalledWith(1);
  });

  it('does not handle Delete when no node is selected', () => {
    renderHook(() => useKeyboardShortcuts({
      ...mockHandlers,
      selectedNodeId: null
    }));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true
      });
      document.dispatchEvent(event);
    });

    expect(mockHandlers.onDeleteNode).not.toHaveBeenCalled();
  });

  it('handles E to toggle connections when multiple selected', () => {
    const handlers = {
      ...mockHandlers,
      selectedNodeIds: [1, 2, 3],
      onToggleConnections: vi.fn(),
    };
    renderHook(() => useKeyboardShortcuts(handlers));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'e',
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    expect(handlers.onToggleConnections).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('does not trigger E toggle when fewer than two selected', () => {
    const handlers = {
      ...mockHandlers,
      selectedNodeIds: [1],
      onToggleConnections: vi.fn(),
    };
    renderHook(() => useKeyboardShortcuts(handlers));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'e',
        bubbles: true,
      });
      document.dispatchEvent(event);
    });

    expect(handlers.onToggleConnections).not.toHaveBeenCalled();
  });
});
