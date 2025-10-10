import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PluginHost from '../../plugins/PluginHost.jsx';
import { corePlugins } from '../../plugins/index.js';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';

describe('PluginHost', () => {
  it('renders nothing when no plugins provided', () => {
    const { container } = render(<PluginHost plugins={[]} appApi={{}} />);
    expect(container).toBeTruthy();
    // No content expected
    expect(container.firstChild).toBeNull();
  });

  it('renders side panel from a simple plugin', () => {
    const simplePlugin = {
      id: 'test.simple',
      name: 'Simple Panel',
      slots: {
        sidePanels: [
          {
            id: 'panel',
            render: () => <div data-testid="simple-panel">Hello from plugin</div>,
          },
        ],
      },
    };
    render(<PluginHost plugins={[simplePlugin]} appApi={{}} />);
    expect(screen.getByTestId('simple-panel')).toHaveTextContent('Hello from plugin');
    const summaryLabel = screen.getByText(/Simple Panel/i);
    const summary = summaryLabel.closest('summary');
    const details = summary?.closest('details');
    expect(summary).toBeTruthy();
    expect(details).toBeTruthy();
    fireEvent.click(summary);
    expect(details?.open).toBe(false);
    fireEvent.click(summary);
    expect(details?.open).toBe(true);
  });

  it('respects panel visible() predicate', () => {
    const plugin = {
      id: 'test.visible',
      slots: {
        sidePanels: [
          {
            id: 'panel',
            visible: (api) => !!api.show,
            render: () => <div data-testid="maybe-panel">Conditional</div>,
          },
        ],
      },
    };
    const { rerender } = render(<PluginHost plugins={[plugin]} appApi={{ show: false }} />);
    expect(screen.queryByTestId('maybe-panel')).toBeNull();
    rerender(<PluginHost plugins={[plugin]} appApi={{ show: true }} />);
    expect(screen.getByTestId('maybe-panel')).toBeInTheDocument();
  });
});

describe('Core Plugins', () => {
  const renderWithProviders = (ui) => {
    return render(
      <ThemeProvider>
        <LocaleProvider>
          {ui}
        </LocaleProvider>
      </ThemeProvider>
    );
  };

  it('nodeInfoPlugin does not render when hidden', () => {
    const { container } = renderWithProviders(
      <PluginHost plugins={corePlugins} appApi={{ showNodeInfoPanel: false, selectedNodes: [] }} />
    );
    // No side panel markup should be present
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    // NodeInfoPanel uses a fixed panel without specific role; ensure no header defaults appear
    expect(screen.queryByText(/No Selection/i)).toBeNull();
  });

  it('nodeInfoPlugin renders NodeInfoPanel when visible', () => {
    renderWithProviders(
      <PluginHost plugins={corePlugins} appApi={{ showNodeInfoPanel: true, selectedNodes: [] }} />
    );
    // Default header text when nothing is selected
    expect(screen.getByText(/No Selection/i)).toBeInTheDocument();
  });

  it('exposes mobile drawer fallback on mobile', () => {
    renderWithProviders(
      <PluginHost plugins={corePlugins} appApi={{ showNodeInfoPanel: true, selectedNodes: [], isMobile: true }} />
    );
    const toggle = screen.getByRole('button', { name: /Node Info/i });
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveClass('plugin-mobile-drawer--open');
    fireEvent.click(screen.getByRole('button', { name: /Close panel drawer/i }));
    expect(drawer).not.toHaveClass('plugin-mobile-drawer--open');
  });
});
