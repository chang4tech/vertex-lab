import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import { LocaleProvider } from '../../i18n/LocaleProvider.jsx';
import PluginPage from '../../components/PluginPage.jsx';

const STORAGE_KEY = 'vertex_custom_plugins';
const PREFS_KEY = 'vertex_plugins_enabled';

const pluginCode = `export default {
  id: 'custom.example',
  name: 'Example Custom Plugin',
  slots: {
    configPage: {
      render: () => 'Custom plugin config',
    },
  },
};`;

let OriginalBlob;

const renderWithProviders = (ui) => render(
  <ThemeProvider>
    <LocaleProvider>{ui}</LocaleProvider>
  </ThemeProvider>
);

describe('PluginPage custom plugin Control Hub', () => {
  beforeEach(() => {
    window.__vertexAllPlugins = undefined;
    OriginalBlob = global.Blob;
    global.Blob = class {
      constructor(parts) {
        this.code = parts.join('');
      }
    };
    URL.createObjectURL.mockImplementation((blob) => {
      const base64 = Buffer.from(blob.code, 'utf8').toString('base64');
      return `data:text/javascript;base64,${base64}`;
    });
    URL.revokeObjectURL.mockImplementation(() => {});
    localStorage.getItem.mockReset();
    localStorage.setItem.mockReset();
    localStorage.getItem.mockImplementation((key) => {
      if (key === STORAGE_KEY) {
        return JSON.stringify([{ id: 'custom.example', code: pluginCode }]);
      }
      if (key === PREFS_KEY) {
        return JSON.stringify({ 'custom.example': true });
      }
      return null;
    });
  });

  afterEach(() => {
    global.Blob = OriginalBlob;
  });

  it('loads and renders a stored custom plugin Control Hub', async () => {
    renderWithProviders(<PluginPage pluginId="custom.example" />);
    expect(await screen.findByText('Custom plugin config')).toBeInTheDocument();
  });
});
