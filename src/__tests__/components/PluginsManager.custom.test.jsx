import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PluginsManager from '../../components/PluginsManager.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';

const renderWithProviders = (ui) => render(
  <ThemeProvider>
    <LocaleProvider>{ui}</LocaleProvider>
  </ThemeProvider>
);

describe('PluginsManager custom plugins section', () => {
  it('renders custom plugins with toggle and remove button', () => {
    const custom = [{ id: 'x.custom', name: 'X', slots: { sidePanels: [] } }];
    const onToggle = vi.fn();
    const onRemove = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <PluginsManager
        onClose={onClose}
        pluginPrefs={{ 'x.custom': true }}
        onTogglePlugin={onToggle}
        availablePlugins={[]}
        customPlugins={custom}
        onImportCustomPlugin={() => {}}
        onRemoveCustomPlugin={onRemove}
      />
    );
    expect(screen.getByText('X')).toBeInTheDocument();
    // Toggle exists
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalled();
    // Remove button
    const removeBtn = screen.getByText(/Remove|移除/);
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalled();
  });

  it('closes the manager before navigating to Control Hub', () => {
    const custom = [{
      id: 'x.custom',
      name: 'X',
      slots: {
        sidePanels: [],
        configPage: { render: () => null },
      },
    }];
    const onClose = vi.fn();
    renderWithProviders(
      <PluginsManager
        onClose={onClose}
        pluginPrefs={{ 'x.custom': true }}
        onTogglePlugin={() => {}}
        availablePlugins={[]}
        customPlugins={custom}
        onImportCustomPlugin={() => {}}
        onRemoveCustomPlugin={() => {}}
      />
    );
    window.location.hash = '#/g/test';
    const detailsBtn = screen.getByRole('button', { name: /Details|Show Details/i });
    fireEvent.click(detailsBtn);
    const controlHubBtn = screen.getByRole('button', { name: /Control Hub/i });
    fireEvent.click(controlHubBtn);
    expect(onClose).toHaveBeenCalled();
    expect(window.location.hash).toBe('#/plugin/x.custom');
  });
});
