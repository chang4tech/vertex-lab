import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileMenu } from '../../components/menu/FileMenu';

describe('FileMenu', () => {
  const mockProps = {
    onNew: vi.fn(),
    onImport: vi.fn(),
    onExport: vi.fn(),
    onExportPNG: vi.fn(),
    isOpen: true,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all menu items when open', () => {
    render(<FileMenu {...mockProps} />);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
    expect(screen.getByText('Export PNG')).toBeInTheDocument();
    expect(screen.getByText('Import JSON')).toBeInTheDocument();
  });

  it('is hidden when isOpen is false', () => {
    render(<FileMenu {...mockProps} isOpen={false} />);
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });

  it('calls correct handlers when menu items are clicked', () => {
    render(<FileMenu {...mockProps} />);
    
    fireEvent.click(screen.getByText('New'));
    expect(mockProps.onNew).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Export JSON'));
    expect(mockProps.onExport).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText('Export PNG'));
    expect(mockProps.onExportPNG).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByText('Import JSON'));
    expect(mockProps.onImport).toHaveBeenCalledTimes(1);
    expect(mockProps.onClose).toHaveBeenCalledTimes(4);
  });
});
