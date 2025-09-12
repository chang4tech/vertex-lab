import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewMenu } from '../../components/menu/ViewMenu.jsx';

describe('ViewMenu', () => {
  const mockProps = {
    onCenter: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onResetZoom: vi.fn(),
    isOpen: true,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all menu items when open', () => {
    render(<ViewMenu {...mockProps} />);
    
    expect(screen.getByText('Center')).toBeInTheDocument();
    expect(screen.getByText('Zoom In')).toBeInTheDocument();
    expect(screen.getByText('Zoom Out')).toBeInTheDocument();
    expect(screen.getByText('Reset Zoom')).toBeInTheDocument();
  });

  it('is hidden when isOpen is false', () => {
    render(<ViewMenu {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Center')).not.toBeInTheDocument();
    expect(screen.queryByText('Zoom In')).not.toBeInTheDocument();
    expect(screen.queryByText('Zoom Out')).not.toBeInTheDocument();
    expect(screen.queryByText('Reset Zoom')).not.toBeInTheDocument();
  });

  it('calls handlers and closes menu when items are clicked', () => {
    render(<ViewMenu {...mockProps} />);

    // Test Center
    fireEvent.click(screen.getByText('Center'));
    expect(mockProps.onCenter).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);

    // Test Zoom In
    fireEvent.click(screen.getByText('Zoom In'));
    expect(mockProps.onZoomIn).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(2);

    // Test Zoom Out
    fireEvent.click(screen.getByText('Zoom Out'));
    expect(mockProps.onZoomOut).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(3);

    // Test Reset Zoom
    fireEvent.click(screen.getByText('Reset Zoom'));
    expect(mockProps.onResetZoom).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(4);
  });

  it('prevents default event behavior', () => {
    render(<ViewMenu {...mockProps} />);
    
    const centerButton = screen.getByText('Center');
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true
    });
    
    // Add spy functions to the event
    event.preventDefault = vi.fn();
    event.stopPropagation = vi.fn();
    
    // Dispatch the event directly
    centerButton.dispatchEvent(event);
    
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(mockProps.onCenter).toHaveBeenCalled();
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});
