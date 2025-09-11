import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Node } from '../../components/Node.jsx';

describe('Node', () => {
  const mockProps = {
    node: {
      id: '1',
      text: 'Test Node',
      x: 100,
      y: 100,
      width: 120,
      height: 40,
      color: '#ffffff'
    },
    isSelected: false,
    onSelect: vi.fn(),
    onDoubleClick: vi.fn(),
    onContextMenu: vi.fn(),
    onStartDrag: vi.fn(),
    onDrag: vi.fn(),
    onEndDrag: vi.fn()
  };

  it('renders node with correct text and position', () => {
    const { getByText, container } = render(<Node {...mockProps} />);
    
    const nodeElement = container.querySelector('.node');
    expect(nodeElement).toHaveStyle({
      transform: 'translate(100px, 100px)',
      width: '120px',
      height: '40px',
      backgroundColor: '#ffffff'
    });
    expect(getByText('Test Node')).toBeInTheDocument();
  });

  it('applies selected style when isSelected is true', () => {
    const { container } = render(<Node {...mockProps} isSelected={true} />);
    
    const nodeElement = container.querySelector('.node');
    expect(nodeElement).toHaveClass('selected');
  });

  it('handles mouse events correctly', () => {
    const { container } = render(<Node {...mockProps} />);
    const nodeElement = container.querySelector('.node');

    // Test click
    fireEvent.click(nodeElement);
    expect(mockProps.onSelect).toHaveBeenCalledWith('1');

    // Test double click
    fireEvent.dblClick(nodeElement);
    expect(mockProps.onDoubleClick).toHaveBeenCalledWith('1');

    // Test context menu
    const contextMenuEvent = { preventDefault: vi.fn() };
    fireEvent.contextMenu(nodeElement, contextMenuEvent);
    expect(contextMenuEvent.preventDefault).toHaveBeenCalled();
    expect(mockProps.onContextMenu).toHaveBeenCalled();
  });

  it('handles drag events', () => {
    const { container } = render(<Node {...mockProps} />);
    const nodeElement = container.querySelector('.node');

    // Start drag
    fireEvent.mouseDown(nodeElement, { clientX: 100, clientY: 100 });
    expect(mockProps.onStartDrag).toHaveBeenCalledWith('1');

    // Drag
    fireEvent.mouseMove(document, { clientX: 150, clientY: 150 });
    expect(mockProps.onDrag).toHaveBeenCalledWith('1', 50, 50);

    // End drag
    fireEvent.mouseUp(document);
    expect(mockProps.onEndDrag).toHaveBeenCalledWith('1');
  });

  it('handles touch events', () => {
    const { container } = render(<Node {...mockProps} />);
    const nodeElement = container.querySelector('.node');

    // Start touch
    fireEvent.touchStart(nodeElement, {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    expect(mockProps.onStartDrag).toHaveBeenCalledWith('1');

    // Touch move
    fireEvent.touchMove(document, {
      touches: [{ clientX: 150, clientY: 150 }]
    });
    expect(mockProps.onDrag).toHaveBeenCalledWith('1', 50, 50);

    // End touch
    fireEvent.touchEnd(document);
    expect(mockProps.onEndDrag).toHaveBeenCalledWith('1');
  });

  it('prevents text selection during drag', () => {
    const { container } = render(<Node {...mockProps} />);
    const nodeElement = container.querySelector('.node');

    fireEvent.mouseDown(nodeElement);
    expect(document.body).toHaveStyle({ userSelect: 'none' });

    fireEvent.mouseUp(document);
    expect(document.body).toHaveStyle({ userSelect: 'auto' });
  });
});
