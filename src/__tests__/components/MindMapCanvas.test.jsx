import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MindMapCanvas from '../../components/canvas/MindMapCanvas';

describe('MindMapCanvas', () => {
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
  });

  it('renders canvas element', () => {
    const { container } = render(<MindMapCanvas {...mockProps} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '800');
    expect(canvas).toHaveAttribute('height', '600');
  });

  it('handles node click', () => {
    const { container } = render(<MindMapCanvas {...mockProps} />);
    const canvas = container.querySelector('canvas');
    
    // Simulate click on node position
    fireEvent.click(canvas, {
      clientX: 400, // Root node x position
      clientY: 300  // Root node y position
    });

    expect(mockProps.onNodeClick).toHaveBeenCalledWith(1);
  });

  it('handles node drag', () => {
    const { container } = render(<MindMapCanvas {...mockProps} />);
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

  it('handles canvas pan', () => {
    const { container } = render(<MindMapCanvas {...mockProps} />);
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
    const { container } = render(<MindMapCanvas {...mockProps} />);
    const canvas = container.querySelector('canvas');
    
    // Simulate wheel zoom in
    fireEvent.wheel(canvas, {
      deltaY: -100
    });

    // The canvas should have been redrawn with new scale
    const ctx = canvas.getContext('2d');
    expect(ctx.scale).toHaveBeenCalled();
  });

  describe('Ref methods', () => {
    it('exposes center method', () => {
      const ref = { current: null };
      render(<MindMapCanvas {...mockProps} ref={ref} />);
      
      expect(typeof ref.current.center).toBe('function');
      ref.current.center();
      
      // Should redraw canvas centered on root node
      expect(ref.current.canvasRef.current.getContext('2d').translate).toHaveBeenCalled();
    });

    it('exposes zoom methods', () => {
      const ref = { current: null };
      render(<MindMapCanvas {...mockProps} ref={ref} />);
      
      expect(typeof ref.current.zoom).toBe('function');
      expect(typeof ref.current.resetZoom).toBe('function');
      
      ref.current.zoom(1.1);
      ref.current.resetZoom();
      
      // Should redraw canvas with new scale
      expect(ref.current.canvasRef.current.getContext('2d').scale).toHaveBeenCalled();
    });

    it('exposes exportAsPNG method', () => {
      const ref = { current: null };
      render(<MindMapCanvas {...mockProps} ref={ref} />);
      
      expect(typeof ref.current.exportAsPNG).toBe('function');
      
      const mockDataURL = 'data:image/png;base64,test';
      vi.spyOn(ref.current.canvasRef.current, 'toDataURL').mockReturnValue(mockDataURL);
      
      ref.current.exportAsPNG();
      
      // Should create download link with PNG data
      expect(ref.current.canvasRef.current.toDataURL).toHaveBeenCalledWith('image/png');
    });
  });
});
