import React from 'react';

const UserContext = React.createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

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
  const [user, setUser] = React.useState(null);
  const [status, setStatus] = React.useState('loading'); // loading | authenticated | unauthenticated | error
  const [error, setError] = React.useState(null);
  const [library, setLibrary] = React.useState([]);
  const [libraryStatus, setLibraryStatus] = React.useState('idle');
  const [libraryError, setLibraryError] = React.useState(null);

  const fetchUser = React.useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/user`, { credentials: 'include' });
      if (response.status === 401) {
        setUser(null);
        setStatus('unauthenticated');
        setLibrary([]);
        return;
      }
      if (!response.ok) {
        if (response.status === 404) {
          setUser(null);
          setStatus('unauthenticated');
          setLibrary([]);
          return;
        }
        throw new Error(`Failed to load user (status ${response.status})`);
      }
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setUser(null);
        setStatus('unauthenticated');
        setLibrary([]);
        return;
      }
      const data = await response.json().catch(() => null);
      if (!data) {
        setUser(null);
        setStatus('unauthenticated');
        setLibrary([]);
        return;
      }
      setUser(data);
      setStatus('authenticated');
      if (Array.isArray(data.library)) {
        const normalized = data.library.map(normalizeLibraryEntry).filter(Boolean);
        setLibrary(normalized);
      } else {
        setLibrary([]);
      }
    } catch (err) {
      console.error('[user] Failed to fetch user', err);
      if (err?.name === 'SyntaxError') {
        setUser(null);
        setStatus('unauthenticated');
        setLibrary([]);
        return;
      }
      setUser(null);
      setStatus('error');
      setError(err);
      setLibrary([]);
    }
  }, []);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const fetchLibrary = React.useCallback(async () => {
    if (status !== 'authenticated') {
      setLibrary([]);
      return [];
    }
    setLibraryStatus('loading');
    setLibraryError(null);
    try {
      const response = await fetch(`${API_BASE}/api/library`, { credentials: 'include' });
      if (response.status === 401) {
        setStatus('unauthenticated');
        setUser(null);
        setLibrary([]);
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
  }, [status]);

  const saveLibraryGraph = React.useCallback(async ({ name, nodes, edges }) => {
    if (status !== 'authenticated') {
      throw new Error('User is not authenticated');
    }
    setLibraryStatus('loading');
    setLibraryError(null);
    try {
      const response = await fetch(`${API_BASE}/api/library`, {
        method: 'POST',
        credentials: 'include',
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
        setLibrary(prev => {
          const next = prev.filter(entry => entry.id !== result.id);
          const normalized = normalizeLibraryEntry(result);
          return normalized ? [...next, normalized] : next;
        });
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
      const response = await fetch(`${API_BASE}/api/library/${encodeURIComponent(graphId)}`, {
        method: 'DELETE',
        credentials: 'include',
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
        throw new Error(`Failed to delete graph (status ${response.status})`);
      }
      setLibrary(prev => prev.filter(entry => entry.id !== graphId));
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
