import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditMenu } from '../../components/menu/EditMenu';

describe('EditMenu', () => {
  const mockProps = {
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onDelete: vi.fn(),
    isOpen: true,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all menu items when open', () => {
    render(<EditMenu {...mockProps} />);
    
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('is hidden when isOpen is false', () => {
    render(<EditMenu {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Undo')).not.toBeInTheDocument();
    expect(screen.queryByText('Redo')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls handlers and closes menu when items are clicked', () => {
    render(<EditMenu {...mockProps} />);

    // Test Undo
    fireEvent.click(screen.getByText('Undo'));
    expect(mockProps.onUndo).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);

    // Test Redo
    fireEvent.click(screen.getByText('Redo'));
    expect(mockProps.onRedo).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(2);

    // Test Delete
    fireEvent.click(screen.getByText('Delete'));
    expect(mockProps.onDelete).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(3);
  });

  it('shows correct keyboard shortcuts', () => {
    render(<EditMenu {...mockProps} />);
    
    expect(screen.getByText('⌘Z')).toBeInTheDocument();
    expect(screen.getByText('⇧⌘Z')).toBeInTheDocument();
    expect(screen.getByText('⌫')).toBeInTheDocument();
  });

  it('prevents default event behavior', () => {
    render(<EditMenu {...mockProps} />);
    
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    
    fireEvent.click(screen.getByText('Undo'), {
      preventDefault,
      stopPropagation
    });
    
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });
});
