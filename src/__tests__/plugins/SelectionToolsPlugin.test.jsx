import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';
import { selectionToolsPlugin } from '../../plugins/core/selectionToolsPlugin.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';

const renderWithProviders = (ui) => render(
  <ThemeProvider>
    <LocaleProvider>
      {ui}
    </LocaleProvider>
  </ThemeProvider>
);

describe('selectionToolsPlugin', () => {
  it('shows when selection > 0 and triggers actions', () => {
    const onEditNode = vi.fn();
    const onDeleteNodes = vi.fn();
    const onToggleCollapse = vi.fn();
    renderWithProviders(
      <PluginHost
        plugins={[selectionToolsPlugin]}
        appApi={{ selectedNodeIds: ['a'], onEditNode, onDeleteNodes, onToggleCollapse }}
      />
    );
    expect(screen.getAllByText(/Selection Tools/i)[0]).toBeInTheDocument();
    fireEvent.click(screen.getByText('Edit First'));
    expect(onEditNode).toHaveBeenCalledWith('a');
    fireEvent.click(screen.getByText('Toggle Collapse'));
    expect(onToggleCollapse).toHaveBeenCalledWith('a');
    fireEvent.click(screen.getByText('Delete Selected'));
    expect(onDeleteNodes).toHaveBeenCalledWith(['a']);
  });

  it('hidden when selection is empty', () => {
    const { container } = renderWithProviders(
      <PluginHost plugins={[selectionToolsPlugin]} appApi={{ selectedNodeIds: [] }} />
    );
    expect(container).toBeTruthy();
    expect(screen.queryByText(/Selection Tools/i)).toBeNull();
  });
});
