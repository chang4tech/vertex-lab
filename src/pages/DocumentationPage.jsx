import React from 'react';
import { FormattedMessage } from 'react-intl';

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '48px 24px',
  background: 'var(--app-background, #f3f4f6)',
};

const cardStyle = {
  width: 'min(860px, 100%)',
  background: 'var(--panel-background, #ffffff)',
  border: '1px solid var(--panel-border, #e5e7eb)',
  borderRadius: 12,
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const sectionCardStyle = {
  background: 'var(--menu-background, #ffffff)',
  border: '1px solid var(--panel-border, #e5e7eb)',
  borderRadius: 10,
  padding: '20px 24px',
};

const backButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid var(--input-border, #d1d5db)',
  background: 'var(--panel-background, #ffffff)',
  color: 'var(--primary-text, #111827)',
  cursor: 'pointer',
  fontWeight: 600,
};

const linkStyle = {
  color: 'var(--primary-button, #2563eb)',
  textDecoration: 'none',
  fontWeight: 600,
};

function DocumentationPage() {
  const getReturnTarget = React.useCallback(() => {
    try {
      const stored = sessionStorage.getItem('vertex_help_return');
      return stored || '#/';
    } catch {
      return '#/';
    }
  }, []);

  const handleBack = React.useCallback(() => {
    const target = getReturnTarget();
    try { sessionStorage.removeItem('vertex_help_return'); } catch {}
    window.location.hash = target;
  }, [getReturnTarget]);

  const openInNewTab = (href) => {
    try {
      window.open(href, '_blank', 'noopener');
    } catch {
      window.location.href = href;
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0' }}>
              <FormattedMessage id="help.documentation" defaultMessage="Documentation" />
            </h1>
            <p style={{ margin: 0, color: 'var(--secondary-text, #4b5563)', maxWidth: 540 }}>
              <FormattedMessage id="docs.subtitle" defaultMessage="Reference notes while we prepare a full manual." />
            </p>
          </div>
          <button type="button" onClick={handleBack} style={backButtonStyle}>
            ← <FormattedMessage id="docs.back" defaultMessage="Back to graph" />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>
              <FormattedMessage id="docs.quickStart.title" defaultMessage="Quick start" />
            </h2>
            <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--secondary-text, #374151)', lineHeight: 1.6 }}>
              <li><FormattedMessage id="docs.quickStart.addNodes" defaultMessage="Create nodes from the File menu or by double-clicking the canvas." /></li>
              <li><FormattedMessage id="docs.quickStart.drag" defaultMessage="Drag nodes to rearrange, use the mouse wheel (or touch gestures) to zoom and pan." /></li>
              <li><FormattedMessage id="docs.quickStart.shortcuts" defaultMessage="Open Settings → Keyboard Shortcuts for search, selection, and editing tips." /></li>
            </ol>
          </div>

          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>
              <FormattedMessage id="docs.resources.title" defaultMessage="In-app resources" />
            </h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--secondary-text, #374151)', lineHeight: 1.6 }}>
              <li><FormattedMessage id="docs.resources.keyboard" defaultMessage="Global keyboard shortcuts live under Settings → Keyboard Shortcuts." /></li>
              <li><FormattedMessage id="docs.resources.search" defaultMessage="Use the search palette (press / or Cmd/Ctrl + K) to jump to nodes instantly." /></li>
              <li><FormattedMessage id="docs.resources.feedback" defaultMessage="Send feedback or report an issue from Help → Send Feedback / Report a Problem." /></li>
            </ul>
          </div>

          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>
              <FormattedMessage id="docs.external.title" defaultMessage="External references" />
            </h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--secondary-text, #374151)', lineHeight: 1.6 }}>
              <li>
                <a
                  href="https://github.com/vertex-lab/vertex-lab-app/blob/main/README.md"
                  style={linkStyle}
                  onClick={(e) => { e.preventDefault(); openInNewTab('https://github.com/vertex-lab/vertex-lab-app/blob/main/README.md'); }}
                >
                  <FormattedMessage id="docs.external.readme" defaultMessage="Project README" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/vertex-lab/vertex-lab-app/blob/main/CHANGELOG.md"
                  style={linkStyle}
                  onClick={(e) => { e.preventDefault(); openInNewTab('https://github.com/vertex-lab/vertex-lab-app/blob/main/CHANGELOG.md'); }}
                >
                  <FormattedMessage id="docs.external.changelog" defaultMessage="Latest changelog" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentationPage;
