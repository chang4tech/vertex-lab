import React from 'react';
import { apiFetch } from '../utils/apiClient.js';

const UserContext = React.createContext(null);

const LOCAL_CACHE_KEY = 'vertex_user_cache_v1';

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
  return {
    id: entry.id ?? `${entry.name || 'graph'}-${entry.createdAt || Math.random().toString(36).slice(2)}`,
    graphId: entry.id ?? entry.name,
    name: entry.name || 'Untitled graph',
    nodes,
    edges,
    createdAt: entry.createdAt ?? null,
    updatedAt: entry.updatedAt ?? null,
    metadata: entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {},
  };
};

export function UserProvider({ children }) {
  const cachedSession = React.useMemo(() => loadCachedSession(), []);
  const [user, setUser] = React.useState(cachedSession?.user ?? null);
  const [status, setStatus] = React.useState(cachedSession?.user ? 'authenticated' : 'loading'); // loading | authenticated | unauthenticated | error
  const [error, setError] = React.useState(null);
  const [library, setLibrary] = React.useState(cachedSession?.library ?? []);
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
    } else if (status === 'unauthenticated' || status === 'error' || !user) {
      clearCache();
    }
  }, [status, user, library, cacheSession, clearCache]);

  const fetchLibrary = React.useCallback(async () => {
    if (status !== 'authenticated') {
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
      setLibraryError(err);
      throw err;
    } finally {
      setLibraryStatus('idle');
    }
  }, [status, clearCache]);

  const saveLibraryGraph = React.useCallback(async ({ name, nodes, edges }) => {
    if (status !== 'authenticated') {
      throw new Error('User is not authenticated');
    }
    setLibraryStatus('loading');
    setLibraryError(null);
    try {
      const response = await apiFetch('/api/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, nodes, edges }),
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
        setLibrary(result.map(normalizeLibraryEntry).filter(Boolean));
      } else if (result) {
        const normalized = normalizeLibraryEntry(result);
        if (normalized) {
          setLibrary(prev => {
            const next = prev.filter(entry => entry.id !== normalized.id && entry.graphId !== normalized.graphId);
            return [...next, normalized];
          });
        }
      } else {
        await fetchLibrary();
      }
    } catch (err) {
      console.error('[user] Failed to save library graph', err);
      setLibraryError(err);
      throw err;
    } finally {
      setLibraryStatus('idle');
    }
  }, [status, fetchLibrary]);

  const deleteLibraryGraph = React.useCallback(async (graphId) => {
    if (status !== 'authenticated') {
      throw new Error('User is not authenticated');
    }
    setLibraryStatus('loading');
    setLibraryError(null);
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
          setLibrary(prev => prev.filter(entry => entry.id !== graphId && entry.graphId !== graphId));
          return;
        }
        if (payload && payload.message) {
          throw new Error(payload.message);
        }
        throw new Error(`Failed to delete graph (status ${response.status})`);
      }
      setLibrary(prev => prev.filter(entry => entry.id !== graphId && entry.graphId !== graphId));
    } catch (err) {
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
