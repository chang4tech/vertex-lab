import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as loader from '../../utils/customPluginLoader.js';

const STORAGE_KEY = 'vertex_custom_plugins';
let originalBlob;

const pluginCode = `export default {
  id: 'custom.example',
  name: 'Example Plugin',
  slots: {
    sidePanels: [
      {
        id: 'panel',
        render: () => null,
      },
    ],
  },
};`;

const otherPluginCode = `export default {
  id: 'another.plugin',
  slots: { sidePanels: [{ id: 'two', render: () => null }] },
};`;

const mockBlobClass = class {
  constructor(parts) {
    this.code = parts.join('');
  }
};

describe('customPluginLoader', () => {
  beforeEach(() => {
    localStorage.getItem.mockReset();
    localStorage.setItem.mockReset();
    localStorage.removeItem?.mockReset?.();
    localStorage.getItem.mockImplementation(() => null);

    originalBlob = global.Blob;
    // eslint-disable-next-line no-global-assign
    Blob = mockBlobClass;

    URL.createObjectURL.mockImplementation((blob) => {
      const base64 = Buffer.from(blob.code, 'utf8').toString('base64');
      return `data:text/javascript;base64,${base64}`;
    });
    URL.revokeObjectURL.mockImplementation(() => {});
  });

  afterEach(() => {
    // eslint-disable-next-line no-global-assign
    Blob = originalBlob;
  });

  it('validates plugin shape', () => {
    const minimalPlugin = { id: 'ok', slots: { sidePanels: [{ id: 'p', render: () => null }] } };
    expect(loader.validatePlugin(minimalPlugin)).toBe(true);
    expect(loader.validatePlugin(null)).toBe(false);
    expect(loader.validatePlugin({ id: '', slots: {} })).toBe(false);
    expect(loader.validatePlugin({ id: 'x', slots: { sidePanels: [{}] } })).toBe(false);
  });

  it('imports plugin code via dynamic import', async () => {
    const plugin = await loader.importPluginFromCode(pluginCode);
    expect(plugin.id).toBe('custom.example');
  });

  it('adds custom plugin code when not duplicated', async () => {
    localStorage.getItem.mockImplementation(() => JSON.stringify([]));

    const plugin = await loader.addCustomPluginCode(pluginCode);
    expect(plugin.id).toBe('custom.example');
    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify([{ id: 'custom.example', name: 'Example Plugin', code: pluginCode }]),
    );
  });

  it('skips duplicate plugin ids when adding', async () => {
    localStorage.getItem.mockImplementation(() => JSON.stringify([
      { id: 'custom.example', name: 'Example Plugin', code: pluginCode },
    ]));

    await loader.addCustomPluginCode(pluginCode);
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('loads plugins from storage and skips failures', async () => {
    localStorage.getItem.mockImplementation(() => JSON.stringify([
      { id: 'custom.example', code: pluginCode },
      { id: 'broken', code: 'export default 123;' },
      { id: 'another.plugin', code: otherPluginCode },
    ]));

    const plugins = await loader.loadCustomPluginsFromStorage();
    expect(plugins.map((p) => p.id)).toEqual(['custom.example', 'another.plugin']);
  });
});
