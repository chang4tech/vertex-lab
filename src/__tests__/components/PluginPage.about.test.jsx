import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';
import PluginPage from '../../components/PluginPage.jsx';

const renderWithProviders = (ui) => render(
  <ThemeProvider>
    <LocaleProvider>{ui}</LocaleProvider>
  </ThemeProvider>
);

describe('PluginPage about section', () => {
  it('shows How to Use for selection tools', () => {
    window.location.hash = '#/plugin/core.selectionTools';
    renderWithProviders(<PluginPage pluginId="core.selectionTools" />);
    expect(screen.getByText(/How to Use/i)).toBeInTheDocument();
    expect(screen.getByText(/Appears when you select/)).toBeInTheDocument();
  });
});
