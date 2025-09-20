import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '../../contexts/ThemeContext';
import NodeInfoPanel from '../../components/NodeInfoPanel';
import { createEnhancedNode } from '../../utils/nodeUtils';

// Mock theme context
const mockTheme = {
  id: 'light',
  colors: {
    panelBackground: '#ffffff',
    panelBorder: '#eeeeee',
    panelShadow: 'rgba(0, 0, 0, 0.12)',
    menuBackground: '#ffffff',
    primaryText: '#333333',
    secondaryText: '#666666',
    inputBackground: '#ffffff',
    inputBorder: '#dddddd',
    primaryButton: '#1976d2',
    primaryButtonText: '#ffffff',
    error: '#f44336'
  }
};

const TestWrapper = ({ children }) => (
  <IntlProvider locale="en" messages={{}}>
    <ThemeProvider value={{ currentTheme: mockTheme }}>
      {children}
    </ThemeProvider>
  </IntlProvider>
);

describe('NodeInfoPanel', () => {
  const mockNode1 = createEnhancedNode({
    id: 1,
    label: 'Test Node 1',
    x: 100,
    y: 200,
    level: 0,
    tags: ['important', 'urgent'],
    notes: 'Test notes'
  });

  const mockNode2 = createEnhancedNode({
    id: 2,
    label: 'Test Node 2',
    x: 300,
    y: 400,
    level: 1,
    isCollapsed: true
  });

  const defaultProps = {
    visible: true,
    onClose: vi.fn(),
    onEditNode: vi.fn(),
    onDeleteNodes: vi.fn(),
    onToggleCollapse: vi.fn()
  };

  it('should render empty state when no nodes selected', () => {
    render(
      <TestWrapper>
        <NodeInfoPanel {...defaultProps} selectedNodes={[]} />
      </TestWrapper>
    );

    expect(screen.getByText(/No Selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a node to view its details/i)).toBeInTheDocument();
  });

  it('should render single node details', () => {
    render(
      <TestWrapper>
        <NodeInfoPanel {...defaultProps} selectedNodes={[mockNode1]} />
      </TestWrapper>
    );

    expect(screen.getByText(/Node Details/i)).toBeInTheDocument();
    expect(screen.getByText('Test Node 1')).toBeInTheDocument();
    expect(screen.getByText(/Position/i)).toBeInTheDocument();
    expect(screen.getByText('(100, 200)')).toBeInTheDocument();
    expect(screen.getByText(/Level/i)).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();
  });

  it('should render multi-selection summary', () => {
    render(
      <TestWrapper>
        <NodeInfoPanel {...defaultProps} selectedNodes={[mockNode1, mockNode2]} />
      </TestWrapper>
    );

    expect(screen.getByText(/2 Nodes Selected/i)).toBeInTheDocument();
    expect(screen.getByText(/Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Total nodes: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Collapsed: 1/i)).toBeInTheDocument();
  });

  it('should call onEditNode when edit button is clicked', () => {
    const onEditNode = vi.fn();
    render(
      <TestWrapper>
        <NodeInfoPanel 
          {...defaultProps} 
          selectedNodes={[mockNode1]} 
          onEditNode={onEditNode}
        />
      </TestWrapper>
    );

    const editButton = screen.getByText(/Edit Node/i);
    fireEvent.click(editButton);
    
    expect(onEditNode).toHaveBeenCalledWith(1);
  });

  it('should call onDeleteNodes when delete button is clicked', () => {
    const onDeleteNodes = vi.fn();
    render(
      <TestWrapper>
        <NodeInfoPanel 
          {...defaultProps} 
          selectedNodes={[mockNode1]} 
          onDeleteNodes={onDeleteNodes}
        />
      </TestWrapper>
    );

    const deleteButton = screen.getByText(/Delete Node/i);
    fireEvent.click(deleteButton);
    
    expect(onDeleteNodes).toHaveBeenCalledWith([1]);
  });

  it('should call onToggleCollapse when collapse button is clicked', () => {
    const onToggleCollapse = vi.fn();
    render(
      <TestWrapper>
        <NodeInfoPanel 
          {...defaultProps} 
          selectedNodes={[mockNode2]} 
          onToggleCollapse={onToggleCollapse}
        />
      </TestWrapper>
    );

    const collapseButton = screen.getByText(/Expand Node/i);
    fireEvent.click(collapseButton);
    
    expect(onToggleCollapse).toHaveBeenCalledWith(2);
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <TestWrapper>
        <NodeInfoPanel 
          {...defaultProps} 
          selectedNodes={[mockNode1]} 
          onClose={onClose}
        />
      </TestWrapper>
    );

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should not render when visible is false', () => {
    const { container } = render(
      <TestWrapper>
        <NodeInfoPanel {...defaultProps} visible={false} selectedNodes={[mockNode1]} />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display tags for selected nodes', () => {
    render(
      <TestWrapper>
        <NodeInfoPanel {...defaultProps} selectedNodes={[mockNode1]} />
      </TestWrapper>
    );

    expect(screen.getByText('important')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('should show multi-selection delete button with count', () => {
    render(
      <TestWrapper>
        <NodeInfoPanel {...defaultProps} selectedNodes={[mockNode1, mockNode2]} />
      </TestWrapper>
    );

    expect(screen.getByText(/Delete Selected \(2\)/i)).toBeInTheDocument();
  });
});
