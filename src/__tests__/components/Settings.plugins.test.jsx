import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Settings from '../../components/Settings.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';

const renderWithProviders = (ui) => render(
  <ThemeProvider>
    <LocaleProvider>{ui}</LocaleProvider>
  </ThemeProvider>
);

describe('Settings Plugins tab', () => {
  it('does not show plugin toggles under All Shortcuts', () => {
    renderWithProviders(<Settings onClose={() => {}} pluginPrefs={{}} onTogglePlugin={() => {}} />);
    // All Shortcuts is default tab
    expect(screen.getByText(/Keyboard Shortcuts/i)).toBeInTheDocument();
    const toggles = screen.queryAllByRole('checkbox');
    // No plugin checkboxes should be visible on this tab
    expect(toggles.length).toBe(0);
  });

  it('shows plugin toggles under Plugins tab', () => {
    renderWithProviders(<Settings onClose={() => {}} pluginPrefs={{}} onTogglePlugin={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Plugins/i }));
    // At least one plugin toggle should be present
    const toggles = screen.getAllByRole('checkbox');
    expect(toggles.length).toBeGreaterThan(0);
  });
});

