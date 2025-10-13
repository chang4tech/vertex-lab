import React from 'react';
import { FormattedMessage } from 'react-intl';

/**
 * Enhanced error display component for plugin panels
 * @param {Object} props
 * @param {Error} props.error - The error object
 * @param {Function} [props.onRetry] - Optional retry callback
 * @param {Function} [props.onDismiss] - Optional dismiss callback
 * @param {string} [props.pluginName] - Plugin name for context
 */
export default function PluginError({ error, onRetry, onDismiss, pluginName }) {
  return (
    <div className="plugin-error" role="alert">
      <div className="plugin-error__icon">⚠️</div>
      <div className="plugin-error__content">
        <div className="plugin-error__title">
          <FormattedMessage
            id="plugin.error.title"
            defaultMessage="Something went wrong"
          />
          {pluginName && ` in ${pluginName}`}
        </div>
        <div className="plugin-error__message">
          {error?.message || 'An unexpected error occurred'}
        </div>
        {process.env.NODE_ENV === 'development' && error?.stack && (
          <details className="plugin-error__details">
            <summary>
              <FormattedMessage id="plugin.error.details" defaultMessage="Error details" />
            </summary>
            <pre className="plugin-error__stack">{error.stack}</pre>
          </details>
        )}
      </div>
      {(onRetry || onDismiss) && (
        <div className="plugin-error__actions">
          {onRetry && (
            <button
              className="plugin-error__button plugin-error__button--primary"
              onClick={onRetry}
            >
              <FormattedMessage id="plugin.error.retry" defaultMessage="Try Again" />
            </button>
          )}
          {onDismiss && (
            <button
              className="plugin-error__button plugin-error__button--secondary"
              onClick={onDismiss}
            >
              <FormattedMessage id="plugin.error.dismiss" defaultMessage="Dismiss" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
