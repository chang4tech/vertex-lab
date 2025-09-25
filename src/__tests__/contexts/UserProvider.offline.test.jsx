import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { UserProvider, useUser } from '../../contexts/UserProvider.jsx';

const ExposeUser = React.forwardRef((props, ref) => {
  const value = useUser();
  React.useImperativeHandle(ref, () => value, [value]);
  return null;
});

describe('UserProvider offline recovery', () => {
  const originalFetch = global.fetch;
  const originalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
  let navigatorDescriptor;
  let memoryStorage;

  const createMemoryStorage = () => {
    const store = new Map();
    const api = {
      getItem: vi.fn((key) => (store.has(key) ? store.get(key) : null)),
      setItem: vi.fn((key, value) => { store.set(key, String(value)); }),
      removeItem: vi.fn((key) => { store.delete(key); }),
      clear: vi.fn(() => { store.clear(); }),
    };
    return { api, store };
  };

  beforeEach(() => {
    navigatorDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => false });
    memoryStorage = createMemoryStorage();
    vi.stubGlobal('localStorage', memoryStorage.api);
    Object.defineProperty(window, 'localStorage', { value: memoryStorage.api, configurable: true });
  });

  afterEach(() => {
    if (navigatorDescriptor) {
      Object.defineProperty(window.navigator, 'onLine', navigatorDescriptor);
    }
    global.fetch = originalFetch;
    vi.unstubAllGlobals();
    if (originalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalStorageDescriptor);
    }
    vi.restoreAllMocks();
  });

  it('promotes local drafts once connectivity returns', async () => {
    const responses = [];
    const okJson = (body) => Promise.resolve(new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    let callIndex = 0;
    const fetchMock = vi.fn((url, options = {}) => {
      const current = callIndex;
      callIndex += 1;

      if (current === 0) {
        return Promise.reject(new TypeError('Failed to fetch'));
      }
      if (current === 1) {
        return okJson({ id: 'user-1', email: 'demo@example.com', library: [] });
      }
      if (current === 2) {
        responses.push({ url, options });
        expect(options.method).toBe('POST');
        const body = JSON.parse(options.body);
        expect(body.name).toBe('Offline graph');
        return okJson({ id: 'remote-1', name: body.name, nodes: body.nodes, edges: body.edges });
      }
      if (current >= 3) {
        responses.push({ url, options });
        return okJson([{ id: 'remote-1', name: 'Offline graph', nodes: [], edges: [] }]);
      }
      return Promise.reject(new Error(`Unexpected fetch call for ${url}`));
    });

    global.fetch = fetchMock;

    const ref = React.createRef();
    render(
      <UserProvider>
        <ExposeUser ref={ref} />
      </UserProvider>
    );

    await waitFor(() => expect(ref.current?.status).toBe('offline'));

    await act(async () => {
      await ref.current.saveLibraryGraph({ name: 'Offline graph', nodes: [], edges: [] });
    });

    await waitFor(() => expect(ref.current.hasLocalDrafts).toBe(true));
    const storedBefore = JSON.parse(memoryStorage.store.get('vertex_offline_library_v1'));
    expect(storedBefore).toHaveLength(1);
    expect(storedBefore[0].storage).toBe('local');

    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => true });

    let syncResult;
    await act(async () => {
      syncResult = await ref.current.syncOfflineLibrary();
    });

    expect(syncResult).toMatchObject({ synced: 1 });

    await waitFor(() => expect(ref.current.status).toBe('authenticated'));
    await waitFor(() => expect(ref.current.hasLocalDrafts).toBe(false));
    expect(ref.current.library).toHaveLength(1);
    expect(ref.current.library[0].storage).toBe('remote');

    const storedAfter = JSON.parse(memoryStorage.store.get('vertex_offline_library_v1'));
    expect(storedAfter).toHaveLength(1);
    expect(storedAfter[0].storage).toBe('remote');

    const postCalls = responses.filter(({ options }) => options?.method === 'POST');
    const getCalls = responses.filter(({ options }) => !options?.method);
    expect(postCalls.length).toBeGreaterThanOrEqual(1);
    expect(postCalls[0].url).toBe('http://localhost:4000/api/library');
    expect(getCalls.length).toBeGreaterThanOrEqual(1);
    expect(getCalls[0].url).toBe('http://localhost:4000/api/library');
  });
});
