import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';
import { workspacePlugin } from '../../plugins/core/workspacePlugin.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';

function renderWithProviders(ui) {
  return render(
    <LocaleProvider>
      <ThemeProvider>{ui}</ThemeProvider>
    </LocaleProvider>
  );
}

describe('Workspace Plugin', () => {
  it('saves and activates a workspace (plugin prefs apply)', () => {
    const setPluginEnabled = vi.fn();
    const appApi = {
      nodes: [],
      edges: [],
      pluginPrefs: { 'examples.graphLinter': false, 'core.search': true },
      setPluginEnabled,
      overlayLayout: { overrides: { items: {}, slots: {} } },
      setOverlayLayout: vi.fn(),
      resetOverlayLayout: vi.fn(),
    };
    renderWithProviders(<PluginHost plugins={[workspacePlugin]} appApi={appApi} />);

    // Save a workspace
    const saveBtn = screen.getByTestId('ws-save');
    fireEvent.click(saveBtn);

    // Activate first in list
    const list = JSON.parse(localStorage.getItem('vertex_workspaces_index') || '[]');
    expect(list.length).toBeGreaterThan(0);
    const activateBtn = screen.getByTestId(`ws-activate-${list[0].id}`);
    fireEvent.click(activateBtn);

    // Should call setPluginEnabled for prefs
    expect(setPluginEnabled).toHaveBeenCalled();
  });
});

