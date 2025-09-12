import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
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

    // Test mousedown (which triggers select)
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true
    });
    nodeElement.dispatchEvent(mouseDownEvent);
    expect(mockProps.onSelect).toHaveBeenCalledWith('1');
    expect(mockProps.onStartDrag).toHaveBeenCalledWith('1');

    // Test double click
    const dblClickEvent = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true
    });
    nodeElement.dispatchEvent(dblClickEvent);
    expect(mockProps.onDoubleClick).toHaveBeenCalledWith('1');

    // Test context menu
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true
    });
    contextMenuEvent.preventDefault = vi.fn();
    contextMenuEvent.stopPropagation = vi.fn();
    nodeElement.dispatchEvent(contextMenuEvent);
    expect(contextMenuEvent.preventDefault).toHaveBeenCalled();
    expect(contextMenuEvent.stopPropagation).toHaveBeenCalled();
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
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true
    });
    nodeElement.dispatchEvent(mouseDownEvent);
    expect(mockProps.onStartDrag).toHaveBeenCalledWith('1');

    // Trigger mousemove with movementX/Y
    const mouseMoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperties(mouseMoveEvent, {
      movementX: { value: 50 },
      movementY: { value: 50 }
    });
    document.dispatchEvent(mouseMoveEvent);
    expect(mockProps.onDrag).toHaveBeenCalledWith('1', 50, 50);

    // End drag
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(mouseUpEvent);
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
    const touchStartEvent = new Event('touchstart', {
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(touchStartEvent, 'touches', {
      value: [{
        clientX: 100,
        clientY: 100,
        target: nodeElement
      }]
    });
    nodeElement.dispatchEvent(touchStartEvent);
    expect(mockProps.onStartDrag).toHaveBeenCalled();

    // Touch move
    const touchMoveEvent = new Event('touchmove', {
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(touchMoveEvent, 'touches', {
      value: [{
        clientX: 150,
        clientY: 150,
        target: document
      }]
    });
    document.dispatchEvent(touchMoveEvent);
    expect(mockProps.onDrag).toHaveBeenCalled();

    // End touch
    const touchEndEvent = new Event('touchend', {
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(touchEndEvent, 'touches', {
      value: []
    });
    document.dispatchEvent(touchEndEvent);
    expect(mockProps.onEndDrag).toHaveBeenCalled();
  });

  it('prevents text selection during drag', async () => {
    const { container } = render(<Node {...mockProps} />);
    const nodeElement = container.querySelector('.node');

    // Start drag
    const mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true
    });
    nodeElement.dispatchEvent(mouseDownEvent);
    
    // Wait for style to be applied
    await vi.waitFor(() => {
      expect(document.body.style.userSelect).toBe('none');
    });

    // End drag
    const mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(mouseUpEvent);
    
    // Wait for style to be removed
    await vi.waitFor(() => {
      expect(document.body.style.userSelect).toBe('');
    });
  });
});
