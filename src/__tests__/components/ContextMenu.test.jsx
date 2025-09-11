import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ContextMenu } from '../../components/menu/ContextMenu.jsx';

describe('ContextMenu', () => {
  const mockProps = {
    x: 100,
    y: 100,
    isOpen: true,
    onClose: vi.fn(),
    children: <div data-testid="menu-content">Menu Content</div>
  };

  it('renders at the specified position when open', () => {
    const { getByTestId } = render(<ContextMenu {...mockProps} />);
    
    const menu = getByTestId('context-menu');
    expect(menu).toHaveStyle({
      left: '100px',
      top: '100px'
    });
    expect(getByTestId('menu-content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { queryByTestId } = render(<ContextMenu {...mockProps} isOpen={false} />);
    
    expect(queryByTestId('context-menu')).not.toBeInTheDocument();
    expect(queryByTestId('menu-content')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking outside', () => {
    const { container } = render(<ContextMenu {...mockProps} />);
    
    // Click outside the menu
    fireEvent.mouseDown(container);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside', () => {
    const { getByTestId } = render(<ContextMenu {...mockProps} />);
    
    // Click inside the menu
    fireEvent.mouseDown(getByTestId('menu-content'));
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('handles touch events', () => {
    const { container } = render(<ContextMenu {...mockProps} />);
    
    // Touch outside the menu
    fireEvent.touchStart(container);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('adjusts position when near window boundaries', () => {
    // Mock window dimensions
    const originalInnerHeight = window.innerHeight;
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerHeight', { value: 200 });
    Object.defineProperty(window, 'innerWidth', { value: 200 });

    // Test near bottom right corner
    const { rerender, getByTestId } = render(
      <ContextMenu {...mockProps} x={190} y={190} />
    );

    let menu = getByTestId('context-menu');
    expect(menu).toHaveStyle({
      right: '10px',
      bottom: '10px'
    });

    // Test near top left
    rerender(<ContextMenu {...mockProps} x={10} y={10} />);
    menu = getByTestId('context-menu');
    expect(menu).toHaveStyle({
      left: '10px',
      top: '10px'
    });

    // Restore window dimensions
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight });
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth });
  });
});
