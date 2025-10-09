import React from 'react';
import { FormattedMessage } from 'react-intl';
import { helpCommunityLinks } from '../config/helpLinks.js';
import helpCommunityTemplate from '../templates/helpCommunity.html?raw';

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

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const escapeAttr = (value = '') => escapeHtml(value);

const makeAnchor = (link) => {
  if (!link || !link.href) return '';
  const href = escapeAttr(link.href);
  const label = escapeHtml(link.label || link.href);
  const isInternal = href.startsWith('#');
  const targetAttrs = isInternal ? '' : ' target="_blank" rel="noopener noreferrer"';
  return `<a href="${href}"${targetAttrs}>${label}</a>`;
};

function renderTemplate() {
  let html = helpCommunityTemplate;
  const replacements = {
    '{{SLACK_ANCHOR}}': makeAnchor(helpCommunityLinks.slack),
    '{{ISSUES_ANCHOR}}': makeAnchor(helpCommunityLinks.issues),
    '{{EMAIL_ANCHOR}}': makeAnchor(helpCommunityLinks.email),
    '{{DOCS_ANCHOR}}': makeAnchor(helpCommunityLinks.docs),
    '{{NOTE_TEXT}}': escapeHtml(helpCommunityLinks.note || ''),
  };

  Object.entries(replacements).forEach(([token, value]) => {
    html = html.replaceAll(token, value || '');
  });
  return html;
}

const HelpCommunityPage = () => {
  const getReturnTarget = React.useCallback(() => {
    try {
      return sessionStorage.getItem('vertex_help_return') || '#/';
    } catch {
      return '#/';
    }
  }, []);

  const handleBack = React.useCallback(() => {
    const target = getReturnTarget();
    try { sessionStorage.removeItem('vertex_help_return'); } catch {}
    window.location.hash = target;
  }, [getReturnTarget]);

  const html = React.useMemo(() => renderTemplate(), []);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0' }}>
              <FormattedMessage id="help.community" defaultMessage="Help Community" />
            </h1>
          </div>
          <button type="button" onClick={handleBack} style={backButtonStyle}>
            ← <FormattedMessage id="docs.back" defaultMessage="Back to graph" />
          </button>
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--primary-text, #111827)' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
};

export default HelpCommunityPage;
