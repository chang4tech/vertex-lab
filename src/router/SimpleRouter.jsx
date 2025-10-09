import React from 'react';
import App from '../App.jsx';
import PluginPage from '../components/PluginPage.jsx';
import AuthPage from '../pages/AuthPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import DocumentationPage from '../pages/DocumentationPage.jsx';
import HelpCommunityPage from '../pages/HelpCommunityPage.jsx';
import HelpFeedbackPage from '../pages/HelpFeedbackPage.jsx';
import { FormattedMessage } from 'react-intl';

function parseHash() {
  const h = window.location.hash || '#/';
  const [, path = '/'] = h.match(/^#(.*)$/) || [];
  const segments = path.split('/').filter(Boolean);
  if (segments[0] === 'g' && segments[1]) {
    return { route: 'graph', graphId: segments[1] };
  }
  if (segments[0] === 'plugin' && segments[1]) {
    const pluginId = decodeURIComponent(segments[1]);
    // Legacy support: ignore extra segments like /config or /console
    return { route: 'plugin', pluginId };
  }
  if (segments[0] === 'login') {
    return { route: 'auth', mode: 'login' };
  }
  if (segments[0] === 'signup') {
    return { route: 'auth', mode: 'signup' };
  }
  if (segments[0] === 'profile') {
    return { route: 'profile' };
  }
  if (segments[0] === 'docs') {
    return { route: 'docs', page: segments[1] || 'main' };
  }
  return { route: 'landing' };
}

export function SimpleRouter() {
  const [state, setState] = React.useState(() => parseHash());

  React.useEffect(() => {
    const onHash = () => setState(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (state.route === 'graph') {
    return <App graphId={state.graphId} />;
  }
  if (state.route === 'plugin') {
    return <PluginPage pluginId={state.pluginId} />;
  }
  if (state.route === 'auth') {
    return <AuthPage mode={state.mode} />;
  }
  if (state.route === 'profile') {
    return <ProfilePage />;
  }
  if (state.route === 'docs') {
    if (state.page === 'community') {
      return <HelpCommunityPage />;
    }
    if (state.page === 'feedback') {
      return <HelpFeedbackPage />;
    }
    return <DocumentationPage />;
  }
  return <Landing />;
}

function Landing() {
  const onCreate = () => {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    window.location.hash = `#/g/${id}`;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 560, width: '100%', background: 'var(--panel-background, #fff)', border: '1px solid var(--panel-border, #eee)', borderRadius: 12, boxShadow: '0 8px 24px var(--panel-shadow, rgba(0,0,0,0.12))', padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>🧠 Vertex Lab</h1>
        <p style={{ color: 'var(--secondary-text, #666)' }}>
          <FormattedMessage id="landing.subtitle" defaultMessage="Create a new graph to get started." />
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onCreate} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--primary-button, #1976d2)', color: 'var(--primary-button-text, #fff)', cursor: 'pointer' }}>
            <FormattedMessage id="landing.newGraph" defaultMessage="New Graph" />
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href="#/login"
              onClick={(event) => {
                event.preventDefault();
                sessionStorage.setItem('vertex_auth_return', '#/');
                window.location.hash = '#/login';
              }}
              style={linkButtonStyle}
            >
              <FormattedMessage id="landing.signIn" defaultMessage="Sign in" />
            </a>
            <a
              href="#/signup"
              onClick={(event) => {
                event.preventDefault();
                sessionStorage.setItem('vertex_auth_return', '#/');
                window.location.hash = '#/signup';
              }}
              style={linkButtonStyle}
            >
              <FormattedMessage id="landing.signUp" defaultMessage="Sign up" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const linkButtonStyle = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid var(--input-border, #d1d5db)',
  textDecoration: 'none',
  color: 'var(--primary-button, #1976d2)',
  cursor: 'pointer',
  background: 'var(--panel-background, #ffffff)',
  fontWeight: 600,
};
