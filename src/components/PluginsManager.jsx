import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { corePlugins } from '../plugins';
import '../styles/Settings.css';
import { getPluginErrors, getPluginErrorsById, subscribePluginErrors } from '../plugins/errorLog.js';
import { useTheme } from '../contexts/ThemeContext';

const PluginsManager = ({
  onClose,
  pluginPrefs = {},
  onTogglePlugin = () => {},
  availablePlugins = corePlugins,
  customPlugins = [],
  onImportCustomPlugin = async () => {},
  onRemoveCustomPlugin = () => {},
  nonRemovablePluginIds = null,
  onOpenControlHub = () => {},
}) => {
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const [expanded, setExpanded] = useState({});
  const [errors, setErrors] = useState(() => getPluginErrors());
  const { currentTheme } = useTheme();
  const intl = useIntl();
  const colors = currentTheme.colors;
  const titleId = useId();

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
  const logContainerStyle = {
    maxHeight: 120,
    overflow: 'auto',
    fontSize: 12,
    background: colors.inputBackground,
    border: `1px solid ${colors.inputBorder}`,
    padding: 8,
    borderRadius: 8
  };
  const nonRemovableSet = React.useMemo(() => {
    if (!nonRemovablePluginIds) return new Set();
    if (typeof nonRemovablePluginIds.has === 'function') return nonRemovablePluginIds;
    if (Array.isArray(nonRemovablePluginIds)) return new Set(nonRemovablePluginIds);
    return new Set();
  }, [nonRemovablePluginIds]);

  useEffect(() => {
    console.debug('[plugins-manager] mounted');
    return () => {
      console.debug('[plugins-manager] unmounted');
    };
  }, []);

  const getPluginName = (plugin) => {
    if (plugin?.nameMessageId) {
      return intl.formatMessage(
        { id: plugin.nameMessageId, defaultMessage: plugin.name || plugin.id },
      );
    }
    return plugin?.name || plugin?.id;
  };

  const isIncomplete = (p) => {
    const s = p?.slots || {};
    const hasSidePanels = Array.isArray(s.sidePanels) && s.sidePanels.length > 0;
    const hasCommands = Array.isArray(s.commands) && s.commands.length > 0;
    const hasOverlays = Array.isArray(s.canvasOverlays) && s.canvasOverlays.length > 0;
    const hasAbout = !!s.aboutPage;
    const hasConfig = !!s.configPage;
    return !(hasSidePanels || hasCommands || hasOverlays || hasAbout || hasConfig);
  };
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const unsub = subscribePluginErrors(() => setErrors(getPluginErrors()));
    return unsub;
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const modalEl = modalRef.current;
    const focusTarget =
      closeButtonRef.current ||
      modalEl?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus({ preventScroll: true });
    } else if (modalEl instanceof HTMLElement) {
      modalEl.focus({ preventScroll: true });
    }

    return () => {
      const previous = previouslyFocusedElementRef.current;
      if (previous instanceof HTMLElement && typeof previous.focus === 'function') {
        previous.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };
  const triggerImport = () => fileInputRef.current?.click();
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await onImportCustomPlugin(text);
    e.target.value = '';
  };

  const openControlHub = React.useCallback((pluginId) => {
    console.debug('[plugins-manager] Control Hub requested', { pluginId });
    onOpenControlHub(pluginId);
  }, [onOpenControlHub]);

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div
        className="settings-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex="-1"
      >
        <header className="settings-header">
          <h2 id={titleId}><FormattedMessage id="settings.plugins" defaultMessage="Plugins" /></h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label={intl.formatMessage({ id: 'plugins.close', defaultMessage: 'Close plugins manager' })}
            ref={closeButtonRef}
          >
            &times;
          </button>
        </header>

        <div className="settings-content">
          <section style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '8px 0' }}><FormattedMessage id="plugins.core" defaultMessage="Core Plugins" /></h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
              {availablePlugins.map(p => (
                <React.Fragment key={p.id}>
                  <div>
                    <div style={pillContainerStyle}>
                      <strong>{getPluginName(p)}</strong>
                      <span style={badgeStyle}>
                        {`• ${intl.formatMessage({ id: (pluginPrefs[p.id] ?? true) ? 'plugins.enabled' : 'plugins.disabled', defaultMessage: (pluginPrefs[p.id] ?? true) ? 'Enabled' : 'Disabled' })}`}
                      </span>
                      {isIncomplete(p) && (
                        <span style={warningBadgeStyle}>• <FormattedMessage id="plugins.incomplete" defaultMessage="Incomplete" /></span>
                      )}
                      {getPluginErrorsById(p.id).length > 0 && (
                        <span style={errorBadgeStyle}>
                          {`• ${intl.formatMessage({ id: 'plugins.errors', defaultMessage: 'Errors' })}: ${getPluginErrorsById(p.id).length}`}
                        </span>
                      )}
                      <button
                        style={{ ...subtleButtonStyle, marginLeft: 'auto' }}
                        onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      >
                        {expanded[p.id]
                          ? intl.formatMessage({ id: 'plugins.hideDetails', defaultMessage: 'Hide Details' })
                          : intl.formatMessage({ id: 'plugins.showDetails', defaultMessage: 'Details' })}
                      </button>
                    </div>
                    {expanded[p.id] && (
                      <div style={detailsTextStyle}>
                        {p.description && (
                          <div>
                            <strong>Description:</strong> {p.descriptionId
                              ? <FormattedMessage id={p.descriptionId} defaultMessage={p.description} />
                              : p.description}
                          </div>
                        )}
                        {p.version && <div><strong><FormattedMessage id="plugins.version" defaultMessage="Version:" /></strong> {p.version}</div>}
                        {p.author && <div><strong><FormattedMessage id="plugins.author" defaultMessage="Author:" /></strong> {p.author}</div>}
                        {!p.description && !p.version && !p.author && (
                          <div style={subtleTextStyle}>
                            <FormattedMessage id="plugins.noMetadata" defaultMessage="No metadata" />
                          </div>
                        )}
                        <div style={{ ...pillContainerStyle, marginTop: 8 }}>
                          <button
                            style={subtleButtonStyle}
                            onClick={() => openControlHub(p.id)}
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
                      checked={pluginPrefs[p.id] ?? true}
                      onChange={(e) => onTogglePlugin(p.id, e.target.checked)}
                    />
                    <span><FormattedMessage id={(pluginPrefs[p.id] ?? true) ? 'plugins.enabled' : 'plugins.disabled'} defaultMessage={(pluginPrefs[p.id] ?? true) ? 'Enabled' : 'Disabled'} /></span>
                  </label>
                </React.Fragment>
              ))}
            </div>
          </section>

          <section>
            <h3 style={{ margin: '8px 0' }}><FormattedMessage id="plugins.custom" defaultMessage="Custom Plugins" /></h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <button style={subtleButtonStyle} onClick={triggerImport}><FormattedMessage id="plugins.import" defaultMessage="Import Plugin (.js)" /></button>
              <input ref={fileInputRef} type="file" accept=".js,.mjs" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
            {customPlugins.length === 0 ? (
              <div style={subtleTextStyle}><FormattedMessage id="plugins.none" defaultMessage="No custom plugins imported yet." /></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 8 }}>
                {customPlugins.map((p) => (
                  <React.Fragment key={p.id}>
                    <div>
                      <div style={pillContainerStyle}>
                        <strong>{getPluginName(p)}</strong>
                        <span style={badgeStyle}>
                          {`• ${intl.formatMessage({ id: (pluginPrefs[p.id] ?? true) ? 'plugins.enabled' : 'plugins.disabled', defaultMessage: (pluginPrefs[p.id] ?? true) ? 'Enabled' : 'Disabled' })}`}
                        </span>
                        {isIncomplete(p) && (
                          <span style={warningBadgeStyle}>• <FormattedMessage id="plugins.incomplete" defaultMessage="Incomplete" /></span>
                        )}
                        {getPluginErrorsById(p.id).length > 0 && (
                        <span style={errorBadgeStyle}>
                          {`• ${intl.formatMessage({ id: 'plugins.errors', defaultMessage: 'Errors' })}: ${getPluginErrorsById(p.id).length}`}
                        </span>
                      )}
                      <button
                        style={{ ...subtleButtonStyle, marginLeft: 'auto' }}
                        onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      >
                        {expanded[p.id]
                          ? intl.formatMessage({ id: 'plugins.hideDetails', defaultMessage: 'Hide Details' })
                          : intl.formatMessage({ id: 'plugins.showDetails', defaultMessage: 'Details' })}
                      </button>
                    </div>
                    {expanded[p.id] && (
                      <div style={detailsTextStyle}>
                        {p.description && (
                          <div>
                            <strong>Description:</strong> {p.descriptionId
                              ? <FormattedMessage id={p.descriptionId} defaultMessage={p.description} />
                              : p.description}
                          </div>
                        )}
                        {p.version && <div><strong><FormattedMessage id="plugins.version" defaultMessage="Version:" /></strong> {p.version}</div>}
                        {p.author && <div><strong><FormattedMessage id="plugins.author" defaultMessage="Author:" /></strong> {p.author}</div>}
                        {!p.description && !p.version && !p.author && (
                          <div style={subtleTextStyle}>
                            <FormattedMessage id="plugins.noMetadata" defaultMessage="No metadata" />
                          </div>
                        )}
                        <div style={{ ...pillContainerStyle, marginTop: 8 }}>
                          <button
                            style={subtleButtonStyle}
                            onClick={() => openControlHub(p.id)}
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
                        checked={pluginPrefs[p.id] ?? true}
                        onChange={(e) => onTogglePlugin(p.id, e.target.checked)}
                      />
                    <span><FormattedMessage id={(pluginPrefs[p.id] ?? true) ? 'plugins.enabled' : 'plugins.disabled'} defaultMessage={(pluginPrefs[p.id] ?? true) ? 'Enabled' : 'Disabled'} /></span>
                    </label>
                    {nonRemovableSet.has(p.id) ? (
                      <span style={badgeStyle}>
                        <FormattedMessage id="plugins.bundled" defaultMessage="Bundled" />
                      </span>
                    ) : (
                      <button style={subtleButtonStyle} onClick={() => onRemoveCustomPlugin(p.id)}><FormattedMessage id="plugins.remove" defaultMessage="Remove" /></button>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </section>

          <section style={{ marginTop: 16 }}>
            <h3 style={{ margin: '8px 0' }}>
              <FormattedMessage id="plugins.errorsHeading" defaultMessage="Plugin Errors" />
            </h3>
            {errors.length === 0 ? (
              <div style={subtleTextStyle}>
                <FormattedMessage id="plugins.noErrors" defaultMessage="No plugin errors captured." />
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 8 }}>
                  <button style={subtleButtonStyle} onClick={() => {
                    const text = errors.map(e => `[${new Date(e.time).toISOString()}] ${e.pluginId}: ${e.message}`).join('\n');
                    navigator.clipboard?.writeText(text).catch(() => {});
                  }}>Copy</button>
                </div>
                <div style={logContainerStyle}>
                  {errors.slice(-10).map((e, idx) => (
                    <div key={idx} style={{ color: colors.primaryText }}>
                      <span style={subtleTextStyle}>[{new Date(e.time).toLocaleTimeString()}]</span> <strong>{e.pluginId}</strong>: {e.message}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

PluginsManager.propTypes = {
  onClose: PropTypes.func.isRequired,
  pluginPrefs: PropTypes.object,
  onTogglePlugin: PropTypes.func,
  availablePlugins: PropTypes.array,
  customPlugins: PropTypes.array,
  onImportCustomPlugin: PropTypes.func,
  onRemoveCustomPlugin: PropTypes.func,
  nonRemovablePluginIds: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.instanceOf(Set),
  ]),
  onOpenControlHub: PropTypes.func,
};

export default PluginsManager;
