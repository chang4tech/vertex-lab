import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import  it('prevents text selection during drag', () => {
    const { container } = render(<Node {...mockProps} isSelected={true} />);
    const nodeElement = container.querySelector('.node');

    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        userSelect: 'none',
        getPropertyValue: (prop) => {
          if (prop === 'user-select') return 'none';
          return '';
        }
      })
    });

    fireEvent.mouseDown(nodeElement);
    expect(window.getComputedStyle(document.body).userSelect).toBe('none');

    fireEvent.mouseUp(document);
    expect(window.getComputedStyle(document.body).getPropertyValue('user-select')).toBe('none');
  });from '../../components/Node.jsx';

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

    // Test mousedown (which triggers select)
    fireEvent.mouseDown(nodeElement);
    expect(mockProps.onSelect).toHaveBeenCalledWith('1');
    expect(mockProps.onStartDrag).toHaveBeenCalledWith('1');

    // Test double click
    fireEvent.dblClick(nodeElement);
    expect(mockProps.onDoubleClick).toHaveBeenCalledWith('1');

    // Test context menu
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    fireEvent.contextMenu(nodeElement, { preventDefault, stopPropagation });
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(mockProps.onContextMenu).toHaveBeenCalled();
  });

  it('handles drag events', () => {
    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        userSelect: 'none',
        getPropertyValue: (prop) => {
          if (prop === 'user-select') return 'none';
          return '';
        }
      })
    });

    const { container } = render(<Node {...mockProps} isSelected={true} />);
    const nodeElement = container.querySelector('.node');

    // Start drag
    fireEvent.mouseDown(nodeElement);
    expect(mockProps.onStartDrag).toHaveBeenCalledWith('1');

    // Trigger mousemove with movementX/Y
    fireEvent.mouseMove(document, { movementX: 50, movementY: 50 });
    expect(mockProps.onDrag).toHaveBeenCalledWith('1', 50, 50);

    // End drag
    fireEvent.mouseUp(document);
    expect(mockProps.onEndDrag).toHaveBeenCalledWith('1');

    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        userSelect: 'auto',
        getPropertyValue: (prop) => {
          if (prop === 'user-select') return 'auto';
          return '';
        }
      })
    });
  });

  it('handles touch events', () => {
    const { container } = render(<Node {...mockProps} isSelected={true} />);
    const nodeElement = container.querySelector('.node');

    // Start touch
    fireEvent.touchStart(nodeElement, {
      touches: [{ clientX: 100, clientY: 100 }]
    });
    expect(mockProps.onStartDrag).toHaveBeenCalledWith('1');

    // Touch move (using movementX/Y)
    fireEvent.touchMove(document, {
      touches: [{ clientX: 150, clientY: 150 }],
      movementX: 50,
      movementY: 50
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
