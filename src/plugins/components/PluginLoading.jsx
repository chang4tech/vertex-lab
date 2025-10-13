import React from 'react';
import { FormattedMessage } from 'react-intl';

/**
 * Loading spinner component for plugin panels
 * @param {Object} props
 * @param {string} [props.message] - Optional loading message
 * @param {string} [props.messageId] - Optional i18n message ID
 */
export default function PluginLoading({ message, messageId }) {
  return (
    <div className="plugin-loading">
      <div className="plugin-loading__spinner" role="status" aria-live="polite" />
      <div className="plugin-loading__message">
        {messageId ? (
          <FormattedMessage id={messageId} defaultMessage={message || 'Loading...'} />
        ) : (
          message || 'Loading...'
        )}
      </div>
    </div>
  );
}
