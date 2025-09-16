import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PluginsManager from '../../components/PluginsManager.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';

const renderWithProviders = (ui) => render(
  <ThemeProvider>
    <LocaleProvider>{ui}</LocaleProvider>
  </ThemeProvider>
);

describe('PluginsManager incomplete badge', () => {
  it('shows Incomplete for a plugin with no contributions', () => {
    const dummy = [{ id: 'x.empty', name: 'Empty Plugin', slots: {} }];
    renderWithProviders(
      <PluginsManager
        onClose={() => {}}
        pluginPrefs={{ 'x.empty': true }}
        onTogglePlugin={() => {}}
        availablePlugins={dummy}
        customPlugins={[]}
        onImportCustomPlugin={() => {}}
        onRemoveCustomPlugin={() => {}}
      />
    );
    expect(screen.getByText(/Empty Plugin/)).toBeInTheDocument();
    expect(screen.getByText(/Incomplete|未完成/)).toBeInTheDocument();
  });
});

