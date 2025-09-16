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

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('calls onClose when clicking outside', async () => {
    render(<ContextMenu {...mockProps} />);
    
    // Click outside the menu
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);

    // Wait for the event to be processed
    await vi.waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onClose when clicking inside', () => {
    const { getByTestId } = render(<ContextMenu {...mockProps} />);
    
    // Click inside the menu
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true
    });
    getByTestId('menu-content').dispatchEvent(event);

    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('handles touch events', async () => {
    render(<ContextMenu {...mockProps} />);
    
    // Touch outside the menu
    const event = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);
    
    // Wait for the event to be processed
    await vi.waitFor(() => {
      expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('adjusts position when near window boundaries', async () => {
    // Mock window dimensions
    const originalInnerHeight = window.innerHeight;
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerHeight', { value: 200 });
    Object.defineProperty(window, 'innerWidth', { value: 200 });

    // Mock getBoundingClientRect
    const mockGetBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 100
    }));
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;

    // Test near bottom right corner
    const { rerender, getByTestId } = render(
      <ContextMenu {...mockProps} x={190} y={190} />
    );

    let menu = getByTestId('context-menu');
    // Wait for useEffect to run
    await vi.waitFor(() => {
      // When clamped, left/top are cleared so positioning uses right/bottom
      expect(menu.style.left).toBe('');
      expect(menu.style.top).toBe('');
    });

    // Test near top left
    rerender(<ContextMenu {...mockProps} x={10} y={10} />);
    menu = getByTestId('context-menu');
    expect(menu.style.left).toBe('10px');
    expect(menu.style.top).toBe('10px');

    // Restore window dimensions
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight });
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth });
  });
});
