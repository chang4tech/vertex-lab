import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadOfflineLibrary, saveOfflineLibrary, clearOfflineLibrary, OFFLINE_LIBRARY_STORAGE_KEY } from '../../utils/offlineLibrary.js';

const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

const createStubStorage = () => {
  const store = new Map();
  return {
    getItem: vi.fn((key) => (store.has(key) ? store.get(key) : null)),
    setItem: vi.fn((key, value) => { store.set(key, String(value)); }),
    removeItem: vi.fn((key) => { store.delete(key); }),
    clear: vi.fn(() => { store.clear(); }),
  };
};

describe('offlineLibrary helpers', () => {
  let warnSpy;
  let storage;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    storage = createStubStorage();
    vi.stubGlobal('localStorage', storage);
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllGlobals();
    if (originalDescriptor) {
      Object.defineProperty(window, 'localStorage', originalDescriptor);
    }
  });

  it('saves and loads entries round trip', () => {
    const sample = [{ id: 'a', name: 'Example', nodes: [], edges: [] }];
    saveOfflineLibrary(sample);
    expect(storage.setItem).toHaveBeenCalledWith(OFFLINE_LIBRARY_STORAGE_KEY, JSON.stringify(sample));

    storage.getItem.mockReturnValueOnce(JSON.stringify(sample));
    const loaded = loadOfflineLibrary();
    expect(loaded).toEqual(sample);
  });

  it('returns empty array when storage is missing or invalid', () => {
    storage.getItem.mockReturnValueOnce(null);
    expect(loadOfflineLibrary()).toEqual([]);

    storage.getItem.mockReturnValueOnce('not valid json');
    const result = loadOfflineLibrary();
    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith('[offline-library] Failed to load', expect.any(Error));
  });

  it('logs a warning when saving fails', () => {
    storage.setItem.mockImplementation(() => { throw new Error('quota exceeded'); });

    saveOfflineLibrary([{ id: 'b' }]);
    expect(warnSpy).toHaveBeenCalledWith('[offline-library] Failed to save', expect.any(Error));
  });

  it('clears stored entries safely', () => {
    storage.setItem.mockImplementation(() => {});
    saveOfflineLibrary([{ id: 'c' }]);
    expect(storage.setItem).toHaveBeenCalled();

    clearOfflineLibrary();
    expect(storage.removeItem).toHaveBeenCalledWith(OFFLINE_LIBRARY_STORAGE_KEY);
  });
});
