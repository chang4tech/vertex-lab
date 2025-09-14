import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VertexCanvas from '../../VertexCanvas';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock canvas API
const mockContext = {
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  fillRect: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  roundRect: vi.fn(),
  ellipse: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn()
};

describe('VertexCanvas', () => {
  const mockNodes = [
    { id: 1, label: 'Root', x: 400, y: 300, parentId: null },
    { id: 2, label: 'Child 1', x: 250, y: 200, parentId: 1 },
    { id: 3, label: 'Child 2', x: 550, y: 200, parentId: 1 },
  ];

  const mockProps = {
    nodes: mockNodes,
    onNodeClick: vi.fn(),
    selectedNodeId: null,
    onNodePositionChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = function() {
      return mockContext;
    };

    // Mock canvas dimensions
    HTMLCanvasElement.prototype.getBoundingClientRect = function() {
      return {
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600
      };
    };
  });

  const renderWithTheme = (ui) => render(<ThemeProvider>{ui}</ThemeProvider>);

  it('renders canvas element', () => {
    const { container } = renderWithTheme(<VertexCanvas {...mockProps} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  it('handles node click', () => {
    const { container } = renderWithTheme(<VertexCanvas {...mockProps} />);
    const canvas = container.querySelector('canvas');
    
    // Simulate click on node position
    fireEvent.click(canvas, {
      clientX: 400, // Root node x position
      clientY: 300  // Root node y position
    });

    expect(mockProps.onNodeClick).toHaveBeenCalledWith(1);
  });

  it('does not call onNodeClick when meta/ctrl multi-selecting', () => {
    const onSelectionChange = vi.fn();
    const onNodeClick = vi.fn();
    const { container } = renderWithTheme(
      <VertexCanvas
        nodes={mockNodes}
        onNodeClick={onNodeClick}
        selectedNodeIds={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    const canvas = container.querySelector('canvas');

    fireEvent.click(canvas, { clientX: 250, clientY: 200, metaKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith([2]);
    expect(onNodeClick).not.toHaveBeenCalled();
  });

  it('handles node drag', () => {
    const { container } = renderWithTheme(<VertexCanvas {...mockProps} />);
    const canvas = container.querySelector('canvas');
    
    // Simulate drag start on node
    fireEvent.mouseDown(canvas, {
      clientX: 400,
      clientY: 300
    });

    // Simulate drag movement
    fireEvent.mouseMove(document, {
      clientX: 450,
      clientY: 350
    });

    // Simulate drag end
    fireEvent.mouseUp(document);

    expect(mockProps.onNodePositionChange).toHaveBeenCalled();
  });

  it('handles node double-click', () => {
    const onNodeDoubleClick = vi.fn();
    const { container } = renderWithTheme(
      <VertexCanvas {...mockProps} onNodeDoubleClick={onNodeDoubleClick} />
    );
    const canvas = container.querySelector('canvas');
    
    // Double-click on node
    canvas.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: 400, clientY: 300 }));
    expect(onNodeDoubleClick).toHaveBeenCalledWith(1);
  });

  it('clears selection when clicking empty space', () => {
    const onSelectionChange = vi.fn();
    const { container } = renderWithTheme(
      <VertexCanvas {...mockProps} selectedNodeIds={[1]} onSelectionChange={onSelectionChange} />
    );
    const canvas = container.querySelector('canvas');

    // Click away from any node
    canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 }));
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('handles canvas pan', () => {
    const { container } = renderWithTheme(<VertexCanvas {...mockProps} />);
    const canvas = container.querySelector('canvas');
    
    // Simulate space key down
    fireEvent.keyDown(window, { code: 'Space' });
    
    // Simulate pan start
    fireEvent.mouseDown(canvas, {
      button: 0,
      clientX: 100,
      clientY: 100
    });

    // Simulate pan movement
    fireEvent.mouseMove(document, {
      clientX: 150,
      clientY: 150
    });

    // Simulate pan end
    fireEvent.mouseUp(document);
    
    // Space key up
    fireEvent.keyUp(window, { code: 'Space' });

    // The canvas should have been redrawn
    const ctx = canvas.getContext('2d');
    expect(ctx.translate).toHaveBeenCalled();
  });

  it('handles zoom with mouse wheel', () => {
    const { container } = renderWithTheme(<VertexCanvas {...mockProps} />);
    const canvas = container.querySelector('canvas');
    
    // Simulate wheel zoom in
    fireEvent.wheel(canvas, {
      deltaY: -100
    });

    // The canvas should have been redrawn with new scale
    const ctx = canvas.getContext('2d');
    expect(ctx.scale).toHaveBeenCalled();
  });

  it('prevents default on wheel event and zooms out', () => {
    const { container } = renderWithTheme(<VertexCanvas {...mockProps} />);
    const canvas = container.querySelector('canvas');
    const evt = new WheelEvent('wheel', { deltaY: 200, bubbles: true, cancelable: true });
    const preventedBefore = evt.defaultPrevented;
    canvas.dispatchEvent(evt);
    expect(preventedBefore).toBe(false);
    expect(evt.defaultPrevented).toBe(true);
    // Zoom out path also calls scale in redraw
    const ctx = canvas.getContext('2d');
    expect(ctx.scale).toHaveBeenCalled();
  });

  it('pans with Space + drag and updates viewBox', () => {
    const onViewBoxChange = vi.fn();
    const { container } = renderWithTheme(
      <VertexCanvas
        {...mockProps}
        onViewBoxChange={onViewBoxChange}
      />
    );
    const canvas = container.querySelector('canvas');
    // Initial draw triggers a viewBox
    expect(onViewBoxChange).toHaveBeenCalled();
    const initial = onViewBoxChange.mock.calls[onViewBoxChange.mock.calls.length - 1][0];

    // Hold space and drag
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    canvas.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 100 }));
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 150, clientY: 130 }));
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));

    // After pan, viewBox should have shifted (x and/or y change)
    const after = onViewBoxChange.mock.calls[onViewBoxChange.mock.calls.length - 1][0];
    expect(after.x).not.toBe(initial.x);
    expect(after.y).not.toBe(initial.y);
  });

  it('cleans up window listeners on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const remSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderWithTheme(<VertexCanvas {...mockProps} />);
    expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    unmount();
    expect(remSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(remSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    addSpy.mockRestore();
    remSpy.mockRestore();
  });

  it('fires onContextMenuRequest with node id on right-click', () => {
    const onContextMenuRequest = vi.fn();
    const { container } = renderWithTheme(
      <VertexCanvas
        {...mockProps}
        onContextMenuRequest={onContextMenuRequest}
      />
    );
    const canvas = container.querySelector('canvas');

    // Right-click at root node position
    const evt = new MouseEvent('contextmenu', {
      bubbles: true,
      clientX: 400,
      clientY: 300
    });
    canvas.dispatchEvent(evt);

    expect(onContextMenuRequest).toHaveBeenCalled();
    const payload = onContextMenuRequest.mock.calls[0][0];
    expect(payload.nodeId).toBe(1);
    expect(payload.screenX).toBe(400);
    expect(payload.screenY).toBe(300);
  });

  describe('Ref methods', () => {
    it('exposes center method', () => {
      const ref = { current: null };
      renderWithTheme(<VertexCanvas {...mockProps} ref={ref} />);
      
      expect(typeof ref.current.center).toBe('function');
      ref.current.center();
      
      // Should redraw canvas centered on root node
      expect(ref.current.canvasRef.current.getContext('2d').translate).toHaveBeenCalled();
    });

    it('exposes zoom methods', () => {
      const ref = { current: null };
      renderWithTheme(<VertexCanvas {...mockProps} ref={ref} />);
      
      expect(typeof ref.current.zoom).toBe('function');
      expect(typeof ref.current.resetZoom).toBe('function');
      
      ref.current.zoom(1.1);
      ref.current.resetZoom();
      
      // Should redraw canvas with new scale
      expect(ref.current.canvasRef.current.getContext('2d').scale).toHaveBeenCalled();
    });

    it('exposes exportAsPNG method', () => {
      const ref = { current: null };
      renderWithTheme(<VertexCanvas {...mockProps} ref={ref} />);
      
      expect(typeof ref.current.exportAsPNG).toBe('function');
      
      const mockDataURL = 'data:image/png;base64,test';
      vi.spyOn(ref.current.canvasRef.current, 'toDataURL').mockReturnValue(mockDataURL);
      
      ref.current.exportAsPNG();
      
      // Should create download link with PNG data
      expect(ref.current.canvasRef.current.toDataURL).toHaveBeenCalledWith('image/png');
    });
  });

  it('supports ctrl/cmd click to toggle individual selection', () => {
    const onSelectionChange = vi.fn();
    const { container, rerender } = renderWithTheme(
      <VertexCanvas
        nodes={mockNodes}
        onNodeClick={vi.fn()}
        selectedNodeIds={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    const canvas = container.querySelector('canvas');

    // First ctrl/cmd click selects node 2
    fireEvent.click(canvas, { clientX: 250, clientY: 200, metaKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith([2]);

    // Rerender with selected [2], ctrl/cmd click node 3 to add
    rerender(
      <ThemeProvider>
        <VertexCanvas
          nodes={mockNodes}
          onNodeClick={vi.fn()}
          selectedNodeIds={[2]}
          onSelectionChange={onSelectionChange}
        />
      </ThemeProvider>
    );
    fireEvent.click(canvas, { clientX: 550, clientY: 200, metaKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith([2, 3]);

    // Rerender with selected [2,3], ctrl/cmd click node 2 to remove
    rerender(
      <ThemeProvider>
        <VertexCanvas
          nodes={mockNodes}
          onNodeClick={vi.fn()}
          selectedNodeIds={[2, 3]}
          onSelectionChange={onSelectionChange}
        />
      </ThemeProvider>
    );
    fireEvent.click(canvas, { clientX: 250, clientY: 200, metaKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith([3]);
  });

  it('supports shift + drag marquee selection', () => {
    const onSelectionChange = vi.fn();
    const { container } = renderWithTheme(
      <VertexCanvas
        nodes={mockNodes}
        onNodeClick={vi.fn()}
        selectedNodeIds={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    const canvas = container.querySelector('canvas');

    // Drag a rectangle from (200,150) to (450,350) to include nodes 1 and 2
    fireEvent.mouseDown(canvas, { clientX: 200, clientY: 150, shiftKey: true, button: 0 });
    fireEvent.mouseMove(document, { clientX: 450, clientY: 350 });
    fireEvent.mouseUp(document);

    expect(onSelectionChange).toHaveBeenCalled();
    const lastCall = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1][0];
    // Should include node IDs 1 and 2, but not 3
    expect(lastCall).toEqual(expect.arrayContaining([1, 2]));
    expect(lastCall).not.toEqual(expect.arrayContaining([3]));
  });

  it('suppresses click after marquee mouseup', () => {
    const onSelectionChange = vi.fn();
    const { container } = renderWithTheme(
      <VertexCanvas
        nodes={mockNodes}
        onNodeClick={vi.fn()}
        selectedNodeIds={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    const canvas = container.querySelector('canvas');

    // Drag a rectangle to select something
    fireEvent.mouseDown(canvas, { clientX: 200, clientY: 150, shiftKey: true, button: 0 });
    fireEvent.mouseMove(document, { clientX: 450, clientY: 350 });
    fireEvent.mouseUp(document);
    const lastSel = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1][0];
    expect(lastSel.length).toBeGreaterThan(0);

    // Immediately click empty space; suppression should avoid clearing selection
    fireEvent.click(canvas, { clientX: 10, clientY: 10 });
    const afterSel = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1][0];
    expect(afterSel).toEqual(lastSel);
  });

  it('emits onViewBoxChange on redraw', () => {
    const onViewBoxChange = vi.fn();
    const { container } = renderWithTheme(
      <VertexCanvas
        nodes={mockNodes}
        onNodeClick={vi.fn()}
        onViewBoxChange={onViewBoxChange}
      />
    );
    const canvas = container.querySelector('canvas');
    canvas.dispatchEvent(new Event('redraw'));
    expect(onViewBoxChange).toHaveBeenCalled();
    const vb = onViewBoxChange.mock.calls[onViewBoxChange.mock.calls.length - 1][0];
    expect(vb).toHaveProperty('x');
    expect(vb).toHaveProperty('y');
    expect(vb).toHaveProperty('width');
    expect(vb).toHaveProperty('height');
  });

  it('draws additional passes when nodes are highlighted', () => {
    const { container, rerender } = renderWithTheme(
      <VertexCanvas
        {...mockProps}
        highlightedNodeIds={[]}
      />
    );
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const beforeFillCalls = ctx.fill.mock.calls.length;

    // Rerender with one highlighted node
    rerender(
      <ThemeProvider>
        <VertexCanvas
          {...mockProps}
          highlightedNodeIds={[1]}
        />
      </ThemeProvider>
    );
    const afterFillCalls = ctx.fill.mock.calls.length;
    expect(afterFillCalls).toBeGreaterThan(beforeFillCalls);
  });
});
