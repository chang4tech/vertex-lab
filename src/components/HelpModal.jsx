import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useTheme } from '../contexts/ThemeContext';

export default function HelpModal({ open, titleId, messageId, onClose }) {
  const { currentTheme } = useTheme();
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 10500,
        background: currentTheme.colors.overlayBackground,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        style={{
          width: 420,
          maxWidth: '92vw',
          background: currentTheme.colors.panelBackground,
          border: `1px solid ${currentTheme.colors.panelBorder}`,
          borderRadius: 8,
          boxShadow: `0 8px 24px ${currentTheme.colors.panelShadow}`,
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${currentTheme.colors.panelBorder}`,
          background: currentTheme.colors.menuBackground,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <strong style={{ color: currentTheme.colors.primaryText }}>
            <FormattedMessage id={titleId} />
          </strong>
          <button onClick={onClose} aria-label="Close" style={{ fontSize: 18, lineHeight: 1, background: 'transparent', border: 'none', color: currentTheme.colors.primaryText, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: 16, color: currentTheme.colors.primaryText }}>
          <p style={{ marginTop: 0 }}><FormattedMessage id={messageId} /></p>
          <p style={{ marginBottom: 0, color: currentTheme.colors.secondaryText }}>
            <FormattedMessage id="help.comingSoon" defaultMessage="More improvements coming soon." />
          </p>
        </div>
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${currentTheme.colors.panelBorder}`,
          display: 'flex', justifyContent: 'flex-end', gap: 8
        }}>
          <button onClick={onClose} style={{
            padding: '6px 12px',
            background: currentTheme.colors.primaryButton,
            color: currentTheme.colors.primaryButtonText,
            border: 'none', borderRadius: 6, cursor: 'pointer'
          }}>
            <FormattedMessage id="common.close" defaultMessage="Close" />
          </button>
        </div>
      </div>
    </div>
  );
}
