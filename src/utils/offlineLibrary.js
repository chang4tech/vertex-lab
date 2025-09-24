const OFFLINE_LIBRARY_KEY = 'vertex_offline_library_v1';

export const loadOfflineLibrary = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OFFLINE_LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[offline-library] Failed to load', error);
    return [];
  }
};

export const saveOfflineLibrary = (entries) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OFFLINE_LIBRARY_KEY, JSON.stringify(entries ?? []));
  } catch (error) {
    console.warn('[offline-library] Failed to save', error);
  }
};

export const clearOfflineLibrary = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(OFFLINE_LIBRARY_KEY);
  } catch (error) {
    console.warn('[offline-library] Failed to clear', error);
  }
};

export const OFFLINE_LIBRARY_STORAGE_KEY = OFFLINE_LIBRARY_KEY;
