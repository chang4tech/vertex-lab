import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, cleanup, rerender } from '@testing-library/react';
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
});

