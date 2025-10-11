import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';

vi.mock('../../VertexCanvas.jsx', () => ({
  default: () => <div data-testid="vertex-canvas" />,
}));

vi.mock('../../components/panels/Minimap', () => ({
  Minimap: () => <div data-testid="minimap" />,
}));

vi.mock('../../components/menu/ContextMenu', () => ({
  ContextMenu: () => null,
}));

vi.mock('../../components/Settings', () => ({
  default: () => null,
}));

vi.mock('../../components/TagManager', () => ({
  default: () => null,
}));

vi.mock('../../components/Search', () => ({
  default: () => null,
}));

vi.mock('../../components/ThemeSelector', () => ({
  default: () => null,
}));

vi.mock('../../components/NodeEditor', () => ({
  default: () => null,
}));

vi.mock('../../components/HelpModal', () => ({
  default: () => null,
}));

vi.mock('../../components/mobile/MobileCanvasControls.jsx', () => ({
  MobileCanvasControls: () => null,
}));

vi.mock('../../plugins/PluginHost', () => ({
  PluginHost: () => null,
}));

vi.mock('../../hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: () => {},
}));

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('../../contexts/UserProvider.jsx', () => ({
  useUser: () => ({
    user: null,
    status: 'unauthenticated',
    library: [],
    isLibraryLoading: false,
    saveLibraryGraph: vi.fn(),
    deleteLibraryGraph: vi.fn(),
    refreshLibrary: vi.fn(),
  }),
}));

vi.mock('../../utils/customPluginLoader', () => ({
  loadCustomPluginsFromStorage: vi.fn().mockResolvedValue([]),
  addCustomPluginCode: vi.fn(),
  removeStoredCustomPluginCodeById: vi.fn(),
}));

import App from '../../App.jsx';

const renderApp = () => render(
  <ThemeProvider>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </ThemeProvider>
);

describe('App Control Hub navigation', () => {
  let fetchMock;
  let warnSpy;
  let logSpy;

  beforeEach(() => {
    window.location.hash = '#/g/test-graph';
    sessionStorage.clear?.();
    fetchMock = vi.fn(async (url) => {
      if (typeof url === 'string' && url.includes('/sample/index.json')) {
        return {
          ok: true,
          json: async () => [],
        };
      }
      return {
        ok: true,
        json: async () => ({}),
      };
    });
    global.fetch = fetchMock;
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy?.mockRestore();
    logSpy?.mockRestore();
    if (global.fetch === fetchMock) {
      delete global.fetch;
    }
  });

  it('stores return hash and navigates after Plugins Manager closes', async () => {
    const previousHash = window.location.hash;
    renderApp();

    const settingsTrigger = await screen.findByText(/Settings/i);
    fireEvent.click(settingsTrigger);

    const pluginsItem = await screen.findByText(/Plugins/i);
    fireEvent.click(pluginsItem);

    const manager = await screen.findByRole('dialog', { name: /Plugins/i });

    const gamificationName = await within(manager).findByText('Gamification Boost');
    const detailsButton = within(gamificationName.closest('div')).getByRole('button', { name: /Details/i });
    fireEvent.click(detailsButton);

    const controlHubButton = await within(manager).findByRole('button', { name: /Control Hub/i });
    fireEvent.click(controlHubButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Plugins/i })).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(window.location.hash).toBe('#/plugin/example.gamification');
    });

    expect(sessionStorage.getItem('vertex_plugin_return')).toBe(previousHash);
  });
});
