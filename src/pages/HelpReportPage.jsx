import React from 'react';
import { FormattedMessage } from 'react-intl';
import { helpReportContacts } from '../config/helpLinks.js';
import helpReportTemplate from '../templates/helpReport.html?raw';

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

const makeMailAnchor = (email) => {
  if (!email) return '';
  const safe = escapeHtml(email);
  return `<a href="mailto:${safe}">${safe}</a>`;
};

const buildTemplate = () => {
  let html = helpReportTemplate;
  const { critical, functional, customer, note } = helpReportContacts;
  const replacements = {
    '{{CRITICAL_ANCHOR}}': makeMailAnchor(critical?.email),
    '{{CRITICAL_DESC}}': escapeHtml(critical?.description || ''),
    '{{FUNCTIONAL_ANCHOR}}': makeMailAnchor(functional?.email),
    '{{FUNCTIONAL_DESC}}': escapeHtml(functional?.description || ''),
    '{{CUSTOMER_ANCHOR}}': makeMailAnchor(customer?.email),
    '{{CUSTOMER_DESC}}': escapeHtml(customer?.description || ''),
    '{{NOTE_TEXT}}': escapeHtml(note || ''),
  };
  Object.entries(replacements).forEach(([token, value]) => {
    html = html.replaceAll(token, value || '');
  });
  return html;
};

const HelpReportPage = () => {
  const returnTarget = React.useMemo(() => {
    try { return sessionStorage.getItem('vertex_help_return') || '#/'; } catch { return '#/'; }
  }, []);

  const handleBack = () => {
    try { sessionStorage.removeItem('vertex_help_return'); } catch {}
    window.location.hash = returnTarget;
  };

  const html = React.useMemo(() => buildTemplate(), []);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0 }}>
              <FormattedMessage id="help.report" defaultMessage="Report a Problem" />
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

export default HelpReportPage;
