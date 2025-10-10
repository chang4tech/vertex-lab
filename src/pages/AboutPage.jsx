import React from 'react';
import { FormattedMessage } from 'react-intl';
import packageJson from '../../package.json';

const sections = [
  {
    id: 'about.app.overview',
    defaultMessage: 'Vertex Lab is an interactive canvas for building and exploring graph-based ideas.',
  },
  {
    id: 'about.app.features',
    defaultMessage: 'Features include high-DPI rendering, plugin system, template library, and offline-first storage.',
  },
  {
    id: 'about.app.plugins',
    defaultMessage: 'Extend the app with plugins for overlays, panels, and commands. Visit the plugin control hub for details.',
  },
];

export default function AboutPage() {
  const version = packageJson.version ?? '0.0.0';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-background, #111)', color: 'var(--primary-text, #f8fafc)', padding: '64px 16px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 720, width: '100%', background: 'var(--panel-background, rgba(17,24,39,0.8))', border: '1px solid var(--panel-border, rgba(148,163,184,0.25))', borderRadius: 16, boxShadow: '0 24px 48px rgba(15,23,42,0.45)', padding: '48px 40px', backdropFilter: 'blur(16px)' }}>
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span role="img" aria-label="Vertex Lab">🧠</span>
            Vertex Lab
          </h1>
          <div style={{ marginTop: 12, fontSize: 18, opacity: 0.75 }}>
            <FormattedMessage id="about.tagline" defaultMessage="Craft, connect, and explore your ideas visually." />
          </div>
          <div style={{ marginTop: 16, fontSize: 14, opacity: 0.6 }}>
            <FormattedMessage id="about.version" defaultMessage="Version" />: v{version}
          </div>
        </header>

        <section style={{ display: 'grid', gap: 18, marginBottom: 40 }}>
          {sections.map((section) => (
            <p key={section.id} style={{ margin: 0, fontSize: 16, lineHeight: 1.65, opacity: 0.88 }}>
              <FormattedMessage id={section.id} defaultMessage={section.defaultMessage} />
            </p>
          ))}
        </section>

        <section style={{ display: 'grid', gap: 12, marginBottom: 40 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            <FormattedMessage id="about.links.title" defaultMessage="Resources" />
          </h2>
          <nav style={{ display: 'grid', gap: 8, fontSize: 15 }}>
            <a href="#/docs" style={linkStyle}>
              <FormattedMessage id="about.links.docs" defaultMessage="Documentation" />
            </a>
            <a href="#/docs/community" style={linkStyle}>
              <FormattedMessage id="about.links.community" defaultMessage="Community & Support" />
            </a>
            <a href="#/docs/feedback" style={linkStyle}>
              <FormattedMessage id="about.links.feedback" defaultMessage="Send Feedback" />
            </a>
            <a href="#/docs/report" style={linkStyle}>
              <FormattedMessage id="about.links.report" defaultMessage="Report an issue" />
            </a>
          </nav>
        </section>

        <footer style={{ fontSize: 14, opacity: 0.55, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span><FormattedMessage id="about.license" defaultMessage="Licensed under MIT." /></span>
          <button
            type="button"
            onClick={() => {
              const ret = sessionStorage.getItem('vertex_help_return');
              if (ret) {
                sessionStorage.removeItem('vertex_help_return');
                window.location.hash = ret;
                return;
              }
              window.history.length > 1 ? window.history.back() : (window.location.hash = '#/');
            }}
            style={{
              border: '1px solid rgba(148,163,184,0.35)',
              background: 'transparent',
              color: 'var(--primary-button-text, #e2e8f0)',
              borderRadius: 999,
              padding: '8px 18px',
              cursor: 'pointer',
            }}
          >
            <FormattedMessage id="about.back" defaultMessage="Back" />
          </button>
        </footer>
      </div>
    </div>
  );
}

const linkStyle = {
  color: 'var(--primary-button, #60a5fa)',
  textDecoration: 'none',
  fontWeight: 600,
};

