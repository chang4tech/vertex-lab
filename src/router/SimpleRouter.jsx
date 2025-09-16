import React from 'react';
import App from '../App.jsx';
import PluginPage from '../components/PluginPage.jsx';
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
    const tab = segments[2] === 'console' ? 'console' : 'config';
    return { route: 'plugin', pluginId, tab };
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
    return <PluginPage pluginId={state.pluginId} tab={state.tab} />;
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
        <button onClick={onCreate} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--primary-button, #1976d2)', color: 'var(--primary-button-text, #fff)', cursor: 'pointer' }}>
          <FormattedMessage id="landing.newGraph" defaultMessage="New Graph" />
        </button>
      </div>
    </div>
  );
}
