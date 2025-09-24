import React from 'react';
import { apiFetch } from '../utils/apiClient.js';
import { loadOfflineLibrary, saveOfflineLibrary } from '../utils/offlineLibrary.js';

const UserContext = React.createContext(null);

const LOCAL_CACHE_KEY = 'vertex_user_cache_v1';

const isNetworkError = (error) => {
  if (!error) return false;
  if (error.name === 'TypeError') return true;
  const message = typeof error.message === 'string' ? error.message : '';
  return message.includes('Failed to fetch') || message.includes('NetworkError');
};

const generateLocalId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `local-${Math.random().toString(36).slice(2, 10)}`;
};

const loadCachedSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      user: parsed.user && typeof parsed.user === 'object' ? parsed.user : null,
      library: Array.isArray(parsed.library) ? parsed.library : [],
    };
  } catch (error) {
    console.warn('[user] Failed to read cached session', error);
    return null;
  }
};

const normalizeLibraryEntry = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  const nodes = Array.isArray(entry.nodes) ? entry.nodes : [];
  const edges = Array.isArray(entry.edges) ? entry.edges : [];
  const storage = entry.storage || entry.source || 'remote';
  return {
    id: entry.id ?? `${entry.name || 'graph'}-${entry.createdAt || Math.random().toString(36).slice(2)}`,
    graphId: entry.id ?? entry.name,
    name: entry.name || 'Untitled graph',
    nodes,
    edges,
    createdAt: entry.createdAt ?? null,
    updatedAt: entry.updatedAt ?? null,
    metadata: entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {},
    storage,
  };
};

export function UserProvider({ children }) {
  const cachedSession = React.useMemo(() => loadCachedSession(), []);
  const offlineDefaults = React.useMemo(() => loadOfflineLibrary(), []);
  const [user, setUser] = React.useState(cachedSession?.user ?? null);
  const [status, setStatus] = React.useState(cachedSession?.user ? 'authenticated' : 'loading'); // loading | authenticated | unauthenticated | offline | error
  const [error, setError] = React.useState(null);
  const [library, setLibrary] = React.useState(() => {
    if (cachedSession?.library?.length) return cachedSession.library;
    return offlineDefaults;
  });
  const [libraryStatus, setLibraryStatus] = React.useState('idle');
  const [libraryError, setLibraryError] = React.useState(null);

  const cacheSession = React.useCallback((nextUser, nextLibrary) => {
    if (typeof window === 'undefined') return;
    if (!nextUser) {
      window.localStorage.removeItem(LOCAL_CACHE_KEY);
      return;
    }
    try {
      window.localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({
        user: nextUser,
        library: nextLibrary ?? [],
        cachedAt: Date.now(),
      }));
    } catch (storageError) {
      console.warn('[user] Failed to cache session', storageError);
    }
  }, []);

  const clearCache = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(LOCAL_CACHE_KEY);
  }, []);

  const fetchUser = React.useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const response = await apiFetch('/api/user');
      if (response.status === 401 || response.status === 404) {
        clearCache();
        setUser(null);
        setStatus('unauthenticated');
        setLibrary([]);
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to load user (status ${response.status})`);
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        clearCache();
        setUser(null);
        setStatus('unauthenticated');
        setLibrary([]);
        return;
      }
      const data = await response.json().catch(() => null);
      if (!data) {
        clearCache();
        setUser(null);
        setStatus('unauthenticated');
        setLibrary([]);
        return;
      }
      const { library: libraryData = [], ...userDetails } = data;
      setUser(userDetails);
      setStatus('authenticated');
      const normalized = Array.isArray(libraryData)
        ? libraryData.map(normalizeLibraryEntry).filter(Boolean)
        : [];
      setLibrary(normalized);
    } catch (err) {
      console.error('[user] Failed to fetch user', err);
      if (err?.name === 'SyntaxError') {
        clearCache();
        setUser(null);
        setStatus('unauthenticated');
        setLibrary([]);
        return;
      }
      if (isNetworkError(err)) {
        const cached = loadCachedSession();
        if (cached?.user) {
          setUser(cached.user);
        }
        const offlineLibrary = cached?.library?.length ? cached.library : loadOfflineLibrary();
        setLibrary(offlineLibrary);
        setStatus('offline');
        setError(null);
        return;
      }
      const cached = loadCachedSession();
      if (cached?.user) {
        setUser(cached.user);
        setLibrary(cached.library ?? []);
        setStatus('authenticated');
        return;
      }
      setUser(null);
      setStatus('error');
      setError(err);
      setLibrary([]);
    }
  }, [clearCache]);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  React.useEffect(() => {
    if (status === 'authenticated' && user) {
      cacheSession(user, library);
    } else if (status === 'unauthenticated' || status === 'error') {
      clearCache();
    }
  }, [status, user, library, cacheSession, clearCache]);

  React.useEffect(() => {
    saveOfflineLibrary(library);
  }, [library]);

  const fetchLibrary = React.useCallback(async () => {
    if (status !== 'authenticated') {
      if (status === 'offline') {
        const offlineEntries = loadOfflineLibrary();
        setLibrary(offlineEntries);
        return offlineEntries;
      }
      setLibrary([]);
      return [];
    }
    setLibraryStatus('loading');
    setLibraryError(null);
    try {
      const response = await apiFetch('/api/library');
      if (response.status === 401) {
        setStatus('unauthenticated');
        setUser(null);
        setLibrary([]);
        clearCache();
        return [];
      }
      if (!response.ok) {
        if (response.status === 404) {
          setLibrary([]);
          return [];
        }
        throw new Error(`Failed to load library (status ${response.status})`);
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setLibrary([]);
        return [];
      }
      const data = await response.json().catch(() => []);
      const normalized = Array.isArray(data) ? data.map(normalizeLibraryEntry).filter(Boolean) : [];
      setLibrary(normalized);
      return normalized;
    } catch (err) {
      console.error('[user] Failed to fetch library', err);
      if (isNetworkError(err)) {
        const offlineEntries = loadOfflineLibrary();
        setLibrary(offlineEntries);
        setStatus('offline');
        setLibraryError(null);
        return offlineEntries;
      }
      setLibraryError(err);
      throw err;
    } finally {
      setLibraryStatus('idle');
    }
  }, [status, clearCache]);

  const saveLibraryGraph = React.useCallback(async ({ name, nodes, edges }) => {
    const normalizedName = name || 'Untitled graph';
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeEdges = Array.isArray(edges) ? edges : [];

    const persistLocal = () => {
      const now = new Date().toISOString();
      const localId = generateLocalId();
      const entry = normalizeLibraryEntry({
        id: localId,
        graphId: localId,
        name: normalizedName,
        nodes: safeNodes,
        edges: safeEdges,
        metadata: {},
        createdAt: now,
        updatedAt: now,
        storage: 'local',
      });
      if (!entry) return null;
      setLibrary(prev => {
        const next = [...prev.filter(item => item.id !== entry.id && item.graphId !== entry.graphId), entry];
        saveOfflineLibrary(next);
        return next;
      });
      return entry;
    };

    setLibraryStatus('loading');
    setLibraryError(null);

    if (status !== 'authenticated') {
      const entry = persistLocal();
      setLibraryStatus('idle');
      return { source: 'local', entry };
    }

    try {
      const response = await apiFetch('/api/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: normalizedName, nodes: safeNodes, edges: safeEdges }),
      });
      if (response.status === 401) {
        setStatus('unauthenticated');
        setUser(null);
        setLibrary([]);
        throw new Error('User session expired');
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (payload && payload.message) {
          throw new Error(payload.message);
        }
        if (response.status === 404) {
          throw new Error('API endpoint not available. Configure the server.');
        }
        throw new Error(`Failed to save graph (status ${response.status})`);
      }
      const result = await response.json().catch(() => null);
      if (Array.isArray(result)) {
        const normalized = result.map(normalizeLibraryEntry).filter(Boolean);
        setLibrary(normalized);
      } else if (result) {
        const normalized = normalizeLibraryEntry(result);
        if (normalized) {
          setLibrary(prev => {
            const next = prev.filter(entry => entry.id !== normalized.id && entry.graphId !== normalized.graphId);
            const updated = [...next, normalized];
            saveOfflineLibrary(updated);
            return updated;
          });
        }
      } else {
        await fetchLibrary();
      }
      return { source: 'remote' };
    } catch (err) {
      if (isNetworkError(err)) {
        const entry = persistLocal();
        setStatus('offline');
        return { source: 'local', entry };
      }
      console.error('[user] Failed to save library graph', err);
      setLibraryError(err);
      throw err;
    } finally {
      setLibraryStatus('idle');
    }
  }, [status, fetchLibrary]);

  const deleteLibraryGraph = React.useCallback(async (graphId) => {
    const removeLocal = () => {
      let removed = false;
      setLibrary(prev => {
        const next = prev.filter(entry => entry.id !== graphId && entry.graphId !== graphId);
        removed = next.length !== prev.length;
        if (removed) {
          saveOfflineLibrary(next);
        }
        return next;
      });
      return removed;
    };

    setLibraryStatus('loading');
    setLibraryError(null);

    if (status !== 'authenticated') {
      const removed = removeLocal();
      setLibraryStatus('idle');
      if (!removed) {
        throw new Error('Graph not found');
      }
      return { source: 'local' };
    }

    try {
      const response = await apiFetch(`/api/library/${encodeURIComponent(graphId)}`, {
        method: 'DELETE',
      });
      if (response.status === 401) {
        setStatus('unauthenticated');
        setUser(null);
        setLibrary([]);
        throw new Error('User session expired');
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (response.status === 404 && payload?.message === 'Graph not found') {
          removeLocal();
          return { source: 'remote' };
        }
        if (payload && payload.message) {
          throw new Error(payload.message);
        }
        throw new Error(`Failed to delete graph (status ${response.status})`);
      }
      setLibrary(prev => {
        const next = prev.filter(entry => entry.id !== graphId && entry.graphId !== graphId);
        saveOfflineLibrary(next);
        return next;
      });
      return { source: 'remote' };
    } catch (err) {
      if (isNetworkError(err)) {
        removeLocal();
        setStatus('offline');
        return { source: 'local' };
      }
      console.error('[user] Failed to delete library graph', err);
      setLibraryError(err);
      throw err;
    } finally {
      setLibraryStatus('idle');
    }
  }, [status]);

  const value = React.useMemo(() => ({
    user,
    status,
    isOffline: status === 'offline',
    canSyncRemote: status === 'authenticated',
    error,
    refreshUser: fetchUser,
    library,
    isLibraryLoading: libraryStatus === 'loading',
    libraryError,
    refreshLibrary: fetchLibrary,
    saveLibraryGraph,
    deleteLibraryGraph,
  }), [user, status, error, fetchUser, library, libraryStatus, libraryError, fetchLibrary, saveLibraryGraph, deleteLibraryGraph]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = React.useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return ctx;
}

export default UserContext;
