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
    renderWithProviders(
      <PluginsManager
        onClose={() => {}}
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
});

