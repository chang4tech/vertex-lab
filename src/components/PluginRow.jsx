import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { getPluginErrorsById } from '../plugins/errorLog.js';

/**
 * Renders a single plugin row in the PluginsManager
 */
const PluginRow = ({
  plugin,
  pluginPrefs,
  expanded,
  colors,
  onToggleExpanded,
  onToggleEnabled,
  onOpenControlHub,
  getPluginName,
  getPluginConflictsInfo,
  isIncomplete,
  showRemoveButton = false,
  onRemove = null
}) => {
  const intl = useIntl();

  const badgeStyle = { fontSize: 12, color: colors.secondaryText };
  const warningBadgeStyle = { fontSize: 12, color: colors.warning };
  const errorBadgeStyle = { fontSize: 12, color: colors.error };
  const subtleTextStyle = { color: colors.secondaryText };
  const detailsTextStyle = { fontSize: 12, color: colors.primaryText, marginTop: 6 };
  const subtleButtonStyle = {
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBackground,
    color: colors.primaryText,
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer'
  };
  const pillContainerStyle = {
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  };

  const isEnabled = pluginPrefs[plugin.id] ?? true;
  const isExpanded = expanded[plugin.id];
  const hasErrors = getPluginErrorsById(plugin.id).length > 0;
  const hasConflicts = plugin.conflicts && plugin.conflicts.length > 0;

  return (
    <React.Fragment>
      <div>
        <div style={pillContainerStyle}>
          <strong>{getPluginName(plugin)}</strong>
          <span style={badgeStyle}>
            {`• ${intl.formatMessage({
              id: isEnabled ? 'plugins.enabled' : 'plugins.disabled',
              defaultMessage: isEnabled ? 'Enabled' : 'Disabled'
            })}`}
          </span>
          {isIncomplete(plugin) && (
            <span style={warningBadgeStyle}>
              • <FormattedMessage id="plugins.incomplete" defaultMessage="Incomplete" />
            </span>
          )}
          {hasErrors && (
            <span style={errorBadgeStyle}>
              {`• ${intl.formatMessage({ id: 'plugins.errors', defaultMessage: 'Errors' })}: ${getPluginErrorsById(plugin.id).length}`}
            </span>
          )}
          {hasConflicts && (
            <span
              style={warningBadgeStyle}
              title={intl.formatMessage(
                { id: 'plugins.conflictsWith', defaultMessage: 'Conflicts with: {conflicts}' },
                { conflicts: getPluginConflictsInfo(plugin)?.join(', ') || '' }
              )}
            >
              • <FormattedMessage id="plugins.hasConflicts" defaultMessage="Has conflicts" />
            </span>
          )}
          <button
            style={{ ...subtleButtonStyle, marginLeft: 'auto' }}
            onClick={() => onToggleExpanded(plugin.id)}
          >
            {isExpanded
              ? intl.formatMessage({ id: 'plugins.hideDetails', defaultMessage: 'Hide Details' })
              : intl.formatMessage({ id: 'plugins.showDetails', defaultMessage: 'Details' })}
          </button>
        </div>
        {isExpanded && (
          <div style={detailsTextStyle}>
            {plugin.description && (
              <div>
                <strong>Description:</strong>{' '}
                {plugin.descriptionId
                  ? <FormattedMessage id={plugin.descriptionId} defaultMessage={plugin.description} />
                  : plugin.description}
              </div>
            )}
            {plugin.version && (
              <div>
                <strong><FormattedMessage id="plugins.version" defaultMessage="Version:" /></strong> {plugin.version}
              </div>
            )}
            {plugin.author && (
              <div>
                <strong><FormattedMessage id="plugins.author" defaultMessage="Author:" /></strong> {plugin.author}
              </div>
            )}
            {!plugin.description && !plugin.version && !plugin.author && (
              <div style={subtleTextStyle}>
                <FormattedMessage id="plugins.noMetadata" defaultMessage="No metadata" />
              </div>
            )}
            <div style={{ ...pillContainerStyle, marginTop: 8 }}>
              <button
                style={subtleButtonStyle}
                onClick={() => onOpenControlHub(plugin.id)}
              >
                <FormattedMessage id="plugins.controlHub" defaultMessage="Control Hub" />
              </button>
            </div>
          </div>
        )}
      </div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: colors.primaryText }}>
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => onToggleEnabled(plugin.id, e.target.checked)}
        />
        <span>
          <FormattedMessage
            id={isEnabled ? 'plugins.enabled' : 'plugins.disabled'}
            defaultMessage={isEnabled ? 'Enabled' : 'Disabled'}
          />
        </span>
      </label>
      {showRemoveButton && (
        onRemove ? (
          <button style={subtleButtonStyle} onClick={() => onRemove(plugin.id)}>
            <FormattedMessage id="plugins.remove" defaultMessage="Remove" />
          </button>
        ) : (
          <span style={badgeStyle}>
            <FormattedMessage id="plugins.bundled" defaultMessage="Bundled" />
          </span>
        )
      )}
    </React.Fragment>
  );
};

PluginRow.propTypes = {
  plugin: PropTypes.object.isRequired,
  pluginPrefs: PropTypes.object.isRequired,
  expanded: PropTypes.object.isRequired,
  colors: PropTypes.object.isRequired,
  onToggleExpanded: PropTypes.func.isRequired,
  onToggleEnabled: PropTypes.func.isRequired,
  onOpenControlHub: PropTypes.func.isRequired,
  getPluginName: PropTypes.func.isRequired,
  getPluginConflictsInfo: PropTypes.func.isRequired,
  isIncomplete: PropTypes.func.isRequired,
  showRemoveButton: PropTypes.bool,
  onRemove: PropTypes.func
};

export default PluginRow;
