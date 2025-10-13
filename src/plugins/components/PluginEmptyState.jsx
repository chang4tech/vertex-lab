import React from 'react';
import { FormattedMessage } from 'react-intl';

/**
 * Empty state component for plugin panels with no content
 * @param {Object} props
 * @param {string} [props.icon] - Optional emoji or icon character
 * @param {string} [props.title] - Title text
 * @param {string} [props.titleId] - Optional i18n title ID
 * @param {string} [props.description] - Description text
 * @param {string} [props.descriptionId] - Optional i18n description ID
 * @param {React.ReactNode} [props.action] - Optional action button/link
 */
export default function PluginEmptyState({
  icon = '📭',
  title,
  titleId,
  description,
  descriptionId,
  action
}) {
  return (
    <div className="plugin-empty-state">
      {icon && <div className="plugin-empty-state__icon">{icon}</div>}
      {(title || titleId) && (
        <div className="plugin-empty-state__title">
          {titleId ? (
            <FormattedMessage id={titleId} defaultMessage={title || 'No content'} />
          ) : (
            title
          )}
        </div>
      )}
      {(description || descriptionId) && (
        <div className="plugin-empty-state__description">
          {descriptionId ? (
            <FormattedMessage id={descriptionId} defaultMessage={description || ''} />
          ) : (
            description
          )}
        </div>
      )}
      {action && <div className="plugin-empty-state__action">{action}</div>}
    </div>
  );
}
