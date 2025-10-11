import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

vi.mock('../../contexts/UserProvider.jsx', () => ({
  useUser: vi.fn(),
}));

vi.mock('../../utils/apiClient.js', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) })),
}));

const { useUser } = await import('../../contexts/UserProvider.jsx');
const { apiFetch } = await import('../../utils/apiClient.js');
const ProfilePage = (await import('../../pages/ProfilePage.jsx')).default;

const renderProfile = () => render(
  <IntlProvider locale="en">
    <ProfilePage />
  </IntlProvider>
);

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    window.location.hash = '#/profile';
  });

  it('shows loading state', () => {
    useUser.mockReturnValue({ status: 'loading' });
    renderProfile();
    expect(screen.getByText(/Loading your profile/)).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    useUser.mockReturnValue({ status: 'unauthenticated' });
    renderProfile();
    expect(sessionStorage.getItem('vertex_auth_return')).toBe('#/profile');
    expect(window.location.hash).toBe('#/login');
  });

  it('shows error message when profile fails', () => {
    useUser.mockReturnValue({ status: 'error', error: new Error('boom') });
    renderProfile();
    expect(screen.getByText(/Unable to load your profile/)).toBeInTheDocument();
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it('renders profile details and triggers refresh', async () => {
    const refreshLibrary = vi.fn().mockResolvedValue();
    const refreshUser = vi.fn().mockResolvedValue();
    useUser.mockReturnValue({
      status: 'authenticated',
      user: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-06-02T00:00:00.000Z',
        metadata: { dept: 'R&D' },
      },
      library: [
        {
          id: 'graph-1',
          name: 'Demo Graph',
          nodes: [{ id: 1 }],
          edges: [],
          storage: 'remote',
          updatedAt: '2024-06-01T00:00:00.000Z',
        },
      ],
      isLibraryLoading: false,
      hasLocalDrafts: true,
      refreshLibrary,
      deleteLibraryGraph: vi.fn(),
      refreshUser,
      error: null,
    });

    renderProfile();

    await waitFor(() => expect(refreshLibrary).toHaveBeenCalled());
    expect(screen.getByText(/Ada Lovelace/)).toBeInTheDocument();
    expect(screen.getByText(/Demo Graph/)).toBeInTheDocument();
    expect(screen.getByText(/dept/)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Refresh/));
    expect(refreshLibrary).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText(/Sign out/));
    await waitFor(() => expect(refreshUser).toHaveBeenCalled());
    expect(apiFetch).toHaveBeenCalledWith('/api/auth/logout', expect.any(Object));
  });
});
