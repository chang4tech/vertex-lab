import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';

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

  it('handles New shortcut (Cmd/Ctrl + N)', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'n',
        metaKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    });

    expect(mockHandlers.onNew).toHaveBeenCalledTimes(1);
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

  it('handles Export PNG shortcut (Cmd/Ctrl + Shift + S)', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        shiftKey: true,
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
});
