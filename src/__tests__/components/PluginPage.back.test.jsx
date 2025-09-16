import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';
import PluginPage from '../../components/PluginPage.jsx';

const renderWithProviders = (ui) => render(
  <ThemeProvider>
    <LocaleProvider>{ui}</LocaleProvider>
  </ThemeProvider>
);

describe('PluginPage Back behavior', () => {
  it('navigates back to previous hash when stored', () => {
    const originalHash = window.location.hash;
    const previous = '#/g/test-graph-1234';
    try { sessionStorage.setItem('vertex_plugin_return', previous); } catch {}
    window.location.hash = '#/plugin/core.graphStats';
    renderWithProviders(<PluginPage pluginId="core.graphStats" />);
    fireEvent.click(screen.getByText(/Back/i));
    expect(window.location.hash).toBe(previous);
    window.location.hash = originalHash;
  });
});
