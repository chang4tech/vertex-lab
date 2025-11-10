import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';
import NodeEditor from '../../../src/components/NodeEditor.jsx';
import * as tagUtils from '../../../src/utils/tagUtils';

vi.mock('../../../src/utils/tagUtils', () => ({
  loadTags: vi.fn(() => [
    { id: 'tag1', name: 'Tag 1', color: '#ff0000' },
    { id: 'tag2', name: 'Tag 2', color: '#00ff00' },
  ]),
}));

const mockNode = {
  id: '1',
  label: 'Test Node',
  color: '#ffffff',
  shape: 'rectangle',
  icon: '?',
  tags: [],
};

const renderEditor = (props) => {
  const defaultProps = {
    node: mockNode,
    visible: true,
    onSave: vi.fn(),
    onClose: vi.fn(),
    onDelete: vi.fn(),
  };
  return render(
    <IntlProvider locale="en">
      <ThemeProvider>
        <NodeEditor {...defaultProps} {...props} />
      </ThemeProvider>
    </IntlProvider>
  );
};

describe('NodeEditor component', () => {
  it('renders when visible', () => {
    renderEditor();
    expect(screen.getByText('Edit Node')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    renderEditor({ visible: false });
    expect(screen.queryByText('Edit Node')).not.toBeInTheDocument();
  });

  it('switches tabs', () => {
    renderEditor();
    fireEvent.click(screen.getByText('Style'));
    expect(screen.getByText('Color')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Tags'));
    expect(screen.getByText('Available Tags')).toBeInTheDocument();
  });

  it('updates label in basic tab', () => {
    const onSave = vi.fn();
    renderEditor({ onSave });
    const labelInput = screen.getByPlaceholderText('Enter node text...');
    fireEvent.change(labelInput, { target: { value: 'New Label' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('1', expect.objectContaining({ label: 'New Label' }));
  });

  it('updates color in style tab', () => {
    const onSave = vi.fn();
    renderEditor({ onSave });
    fireEvent.click(screen.getByText('Style'));
    const colorButton = screen.getAllByRole('button', { name: /#\w{6}/i })[0];
    fireEvent.click(colorButton);
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('1', expect.objectContaining({ color: expect.any(String) }));
  });

  it('toggles tags in tags tab', () => {
    const onSave = vi.fn();
    renderEditor({ onSave });
    fireEvent.click(screen.getByText('Tags'));
    const tagButton = screen.getByText('Tag 1');
    fireEvent.click(tagButton);
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('1', expect.objectContaining({ tags: ['tag1'] }));
  });

  it('updates collapsed state in advanced tab', () => {
    const onSave = vi.fn();
    renderEditor({ onSave });
    fireEvent.click(screen.getByText('Advanced'));
    const collapsedCheckbox = screen.getByLabelText('Collapse child nodes');
    fireEvent.click(collapsedCheckbox);
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith('1', expect.objectContaining({ isCollapsed: true }));
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    renderEditor({ onClose });
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked', () => {
    window.confirm = vi.fn(() => true);
    const onDelete = vi.fn();
    renderEditor({ onDelete });
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});