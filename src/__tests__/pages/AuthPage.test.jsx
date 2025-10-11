import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

vi.mock('../../contexts/UserProvider.jsx', () => ({
  useUser: vi.fn(),
}));

vi.mock('../../utils/apiClient.js', () => ({
  apiFetch: vi.fn(),
}));

const { useUser } = await import('../../contexts/UserProvider.jsx');
const { apiFetch } = await import('../../utils/apiClient.js');
const AuthPage = (await import('../../pages/AuthPage.jsx')).default;

const renderAuth = (mode) => render(
  <IntlProvider locale="en">
    <AuthPage mode={mode} />
  </IntlProvider>
);

describe('AuthPage', () => {
  const refreshUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    window.location.hash = '#/login';
    useUser.mockReturnValue({ refreshUser });
  });

  it('submits signup form successfully', async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    sessionStorage.setItem('vertex_auth_return', '#/workspace');

    renderAuth('signup');
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Ada Lovelace' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign up/ }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(apiFetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({ method: 'POST' }));
    await waitFor(() => expect(refreshUser).toHaveBeenCalled());
    expect(window.location.hash).toBe('#/workspace');
  });

  it('shows error message on failed login', async () => {
    apiFetch.mockResolvedValue({ ok: false, json: async () => ({ message: 'Invalid credentials' }) });
    renderAuth('login');
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/ }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(await screen.findByText(/Invalid credentials/)).toBeInTheDocument();
    expect(window.location.hash).toBe('#/login');
  });
});
