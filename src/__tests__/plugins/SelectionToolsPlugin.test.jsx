import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';
import { selectionToolsPlugin } from '../../plugins/core/selectionToolsPlugin.jsx';

describe('selectionToolsPlugin', () => {
  it('shows when selection > 0 and triggers actions', () => {
    const onEditNode = vi.fn();
    const onDeleteNodes = vi.fn();
    const onToggleCollapse = vi.fn();
    render(
      <PluginHost
        plugins={[selectionToolsPlugin]}
        appApi={{ selectedNodeIds: ['a'], onEditNode, onDeleteNodes, onToggleCollapse }}
      />
    );
    expect(screen.getByText(/Selection Tools/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Edit First'));
    expect(onEditNode).toHaveBeenCalledWith('a');
    fireEvent.click(screen.getByText('Toggle Collapse'));
    expect(onToggleCollapse).toHaveBeenCalledWith('a');
    fireEvent.click(screen.getByText('Delete Selected'));
    expect(onDeleteNodes).toHaveBeenCalledWith(['a']);
  });

  it('hidden when selection is empty', () => {
    const { container } = render(
      <PluginHost plugins={[selectionToolsPlugin]} appApi={{ selectedNodeIds: [] }} />
    );
    expect(container).toBeTruthy();
    expect(screen.queryByText(/Selection Tools/i)).toBeNull();
  });
});

