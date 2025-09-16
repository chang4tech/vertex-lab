import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PluginPage from '../../components/PluginPage.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';

const renderWithProviders = (ui) => render(
  <ThemeProvider>
    <LocaleProvider>{ui}</LocaleProvider>
  </ThemeProvider>
);

describe('PluginPage about section (Node Info)', () => {
  it('shows How to Use for Node Info plugin', () => {
    window.location.hash = '#/plugin/core.nodeInfo';
    renderWithProviders(<PluginPage pluginId="core.nodeInfo" />);
    expect(screen.getAllByText(/How to Use/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Node Info Panel/i })).toBeInTheDocument();
  });
});
