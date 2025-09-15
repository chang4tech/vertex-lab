import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadPluginPrefs, savePluginPrefs, PLUGIN_PREFS_KEY } from '../../utils/pluginUtils.js';

describe('pluginUtils', () => {
  beforeEach(() => {
    // Reset localStorage mock
    localStorage.getItem.mockReset();
    localStorage.setItem.mockReset();
    localStorage.removeItem.mockReset();
    localStorage.clear.mockReset();
  });

  it('enables all provided default plugins when no prefs stored', () => {
    localStorage.getItem.mockReturnValueOnce(null);
    const defaults = [{ id: 'core.a' }, { id: 'core.b' }];
    const prefs = loadPluginPrefs(defaults);
    expect(prefs).toEqual({ 'core.a': true, 'core.b': true });
  });

  it('merges stored prefs and enables any new plugin ids by default', () => {
    const stored = JSON.stringify({ 'core.a': false });
    localStorage.getItem.mockImplementation((key) => (key === PLUGIN_PREFS_KEY ? stored : null));
    const defaults = [{ id: 'core.a' }, { id: 'core.b' }];
    const prefs = loadPluginPrefs(defaults);
    expect(prefs['core.a']).toBe(false); // keep stored value
    expect(prefs['core.b']).toBe(true);  // new default enabled
  });

  it('savePluginPrefs writes to localStorage', () => {
    const prefs = { 'core.a': true };
    savePluginPrefs(prefs);
    expect(localStorage.setItem).toHaveBeenCalledWith(PLUGIN_PREFS_KEY, JSON.stringify(prefs));
  });
});

