import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('calls onOpenControlHub when Control Hub button is clicked', async () => {
    const custom = [{
      id: 'x.custom',
      name: 'X',
      slots: {
        sidePanels: [],
        configPage: { render: () => null },
      },
    }];
    const onClose = vi.fn();
    const onOpenControlHub = vi.fn((pluginId) => {
      window.location.hash = `#/plugin/${pluginId}`;
    });
    renderWithProviders(
      <PluginsManager
        onClose={onClose}
        pluginPrefs={{ 'x.custom': true }}
        onTogglePlugin={() => {}}
        availablePlugins={[]}
        customPlugins={custom}
        onImportCustomPlugin={() => {}}
        onRemoveCustomPlugin={() => {}}
        onOpenControlHub={onOpenControlHub}
      />
    );
    window.location.hash = '#/g/test';
    const detailsBtn = screen.getByRole('button', { name: /Details|Show Details/i });
    fireEvent.click(detailsBtn);
    const controlHubBtn = screen.getByRole('button', { name: /Control Hub/i });
    fireEvent.click(controlHubBtn);
    await waitFor(() => {
      expect(onOpenControlHub).toHaveBeenCalledWith('x.custom');
    });
    expect(window.location.hash).toBe('#/plugin/x.custom');
    expect(onClose).not.toHaveBeenCalled();
  });
});
