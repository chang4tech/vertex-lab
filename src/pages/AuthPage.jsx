import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useUser } from '../contexts/UserProvider.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function AuthPage({ mode = 'login' }) {
  const intl = useIntl();
  const { refreshUser } = useUser();
  const [formState, setFormState] = React.useState({
    name: '',
    email: '',
    password: '',
  });
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState(null);

  const isSignup = mode === 'signup';
  const titleMessageId = isSignup ? 'auth.signupTitle' : 'auth.loginTitle';
  const submitMessageId = isSignup ? 'auth.signupAction' : 'auth.loginAction';
  const alternateRoute = isSignup ? '#/login' : '#/signup';
  const alternateMessageId = isSignup ? 'auth.haveAccount' : 'auth.needAccount';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      const endpoint = isSignup ? `${API_BASE}/api/auth/signup` : `${API_BASE}/api/auth/login`;
      const payload = {
        email: formState.email,
        password: formState.password,
      };
      if (isSignup) {
        payload.name = formState.name;
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || intl.formatMessage({ id: 'auth.genericError', defaultMessage: 'Unable to complete request.' }));
      }
      await refreshUser();
      const returnHash = sessionStorage.getItem('vertex_auth_return') || '#/';
      sessionStorage.removeItem('vertex_auth_return');
      window.location.hash = returnHash;
    } catch (err) {
      console.error('[auth] submission error', err);
      setError(err.message || 'Unknown error');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%', background: 'var(--panel-background, #ffffff)', border: '1px solid var(--panel-border, #e5e7eb)', borderRadius: 12, boxShadow: '0 10px 28px rgba(15, 23, 42, 0.18)', padding: 28 }}>
        <h1 style={{ marginTop: 0, marginBottom: 12 }}>
          <FormattedMessage id={titleMessageId} defaultMessage={isSignup ? 'Create your account' : 'Welcome back'} />
        </h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSignup && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontWeight: 600 }}>
                <FormattedMessage id="auth.name" defaultMessage="Full name" />
              </span>
              <input
                name="name"
                value={formState.name}
                onChange={handleChange}
                required
                placeholder={intl.formatMessage({ id: 'auth.namePlaceholder', defaultMessage: 'Jane Doe' })}
                style={inputStyle}
              />
            </label>
          )}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>
              <FormattedMessage id="auth.email" defaultMessage="Email" />
            </span>
            <input
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              required
              placeholder={intl.formatMessage({ id: 'auth.emailPlaceholder', defaultMessage: 'you@example.com' })}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>
              <FormattedMessage id="auth.password" defaultMessage="Password" />
            </span>
            <input
              type="password"
              name="password"
              value={formState.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder={intl.formatMessage({ id: 'auth.passwordPlaceholder', defaultMessage: '••••••••' })}
              style={inputStyle}
            />
          </label>
          {error && (
            <div style={{ color: '#dc2626', fontSize: 13 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={status === 'submitting'}
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--primary-button, #2563eb)',
              color: 'var(--primary-button-text, #fff)',
              fontWeight: 600,
              cursor: status === 'submitting' ? 'wait' : 'pointer',
            }}
          >
            {status === 'submitting' ? (
              <FormattedMessage id="auth.submitting" defaultMessage="Submitting…" />
            ) : (
              <FormattedMessage id={submitMessageId} defaultMessage={isSignup ? 'Sign up' : 'Sign in'} />
            )}
          </button>
        </form>
        <div style={{ marginTop: 16, fontSize: 13 }}>
          <a href={alternateRoute} onClick={(event) => {
            event.preventDefault();
            sessionStorage.setItem('vertex_auth_return', sessionStorage.getItem('vertex_auth_return') || window.location.hash || '#/');
            window.location.hash = alternateRoute;
          }}>
            <FormattedMessage id={alternateMessageId} defaultMessage={isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'} />
          </a>
        </div>
        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={() => {
              const returnHash = sessionStorage.getItem('vertex_auth_return') || '#/';
              sessionStorage.removeItem('vertex_auth_return');
              window.location.hash = returnHash;
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <FormattedMessage id="auth.back" defaultMessage="Back" />
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--input-border, #d1d5db)',
  fontSize: 14,
  background: 'var(--input-background, #ffffff)',
  color: 'var(--primary-text, #111827)',
};

export default AuthPage;
