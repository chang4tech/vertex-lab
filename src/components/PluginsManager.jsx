import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { corePlugins } from '../plugins';
import '../styles/Settings.css';
import { getPluginErrors, subscribePluginErrors } from '../plugins/errorLog.js';
import { useTheme } from '../contexts/ThemeContext';
import { checkPluginConflicts } from '../utils/pluginUtils';
import PluginRow from './PluginRow';

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

  // Helper to get conflicts for a plugin
  const getPluginConflictsInfo = React.useCallback((plugin) => {
    const allPlugins = [...availablePlugins, ...customPlugins];
    if (!plugin.conflicts || plugin.conflicts.length === 0) {
      return null;
    }

    const conflictingPlugins = plugin.conflicts
      .map(id => allPlugins.find(p => p.id === id))
      .filter(Boolean)
      .map(p => getPluginName(p));

    return conflictingPlugins.length > 0 ? conflictingPlugins : null;
  }, [availablePlugins, customPlugins, getPluginName]);

  // Helper to get formatted conflict names for a list of plugin IDs
  const getConflictNames = React.useCallback((conflictIds, allPlugins) => {
    return conflictIds
      .map(id => {
        const plugin = allPlugins.find(p => p.id === id);
        return plugin ? getPluginName(plugin) : null;
      })
      .filter(Boolean)
      .join(', ');
  }, [getPluginName]);

  // Helper to show conflict confirmation dialog
  const confirmConflictResolution = React.useCallback((pluginName, conflictNames) => {
    return window.confirm(
      intl.formatMessage(
        {
          id: 'plugins.conflictWarning',
          defaultMessage: 'Enabling "{pluginName}" will disable the following conflicting plugin(s): {conflictNames}. Continue?'
        },
        { pluginName, conflictNames }
      )
    );
  }, [intl]);

  // Helper to disable conflicting plugins
  const disableConflictingPlugins = React.useCallback((conflicts) => {
    conflicts.forEach(conflictId => {
      onTogglePlugin(conflictId, false);
    });
  }, [onTogglePlugin]);

  // Handle plugin conflicts when enabling a plugin
  const handleEnableWithConflicts = React.useCallback((pluginId, allPlugins) => {
    const { hasConflict, conflicts } = checkPluginConflicts(pluginId, allPlugins, pluginPrefs);

    if (!hasConflict) {
      onTogglePlugin(pluginId, true);
      return;
    }

    const plugin = allPlugins.find(p => p.id === pluginId);
    const pluginName = getPluginName(plugin);
    const conflictNames = getConflictNames(conflicts, allPlugins);

    const confirmed = confirmConflictResolution(pluginName, conflictNames);
    if (!confirmed) {
      return;
    }

    disableConflictingPlugins(conflicts);
    onTogglePlugin(pluginId, true);
  }, [pluginPrefs, onTogglePlugin, getPluginName, getConflictNames, confirmConflictResolution, disableConflictingPlugins]);

  const handleTogglePlugin = React.useCallback((pluginId, enabled) => {
    const allPlugins = [...availablePlugins, ...customPlugins];

    if (enabled) {
      handleEnableWithConflicts(pluginId, allPlugins);
    } else {
      onTogglePlugin(pluginId, enabled);
    }
  }, [availablePlugins, customPlugins, onTogglePlugin, handleEnableWithConflicts]);

  const handleToggleExpanded = React.useCallback((pluginId) => {
    setExpanded(prev => ({ ...prev, [pluginId]: !prev[pluginId] }));
  }, []);

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
                <PluginRow
                  key={p.id}
                  plugin={p}
                  pluginPrefs={pluginPrefs}
                  expanded={expanded}
                  colors={colors}
                  onToggleExpanded={handleToggleExpanded}
                  onToggleEnabled={handleTogglePlugin}
                  onOpenControlHub={openControlHub}
                  getPluginName={getPluginName}
                  getPluginConflictsInfo={getPluginConflictsInfo}
                  isIncomplete={isIncomplete}
                />
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
                  <PluginRow
                    key={p.id}
                    plugin={p}
                    pluginPrefs={pluginPrefs}
                    expanded={expanded}
                    colors={colors}
                    onToggleExpanded={handleToggleExpanded}
                    onToggleEnabled={handleTogglePlugin}
                    onOpenControlHub={openControlHub}
                    getPluginName={getPluginName}
                    getPluginConflictsInfo={getPluginConflictsInfo}
                    isIncomplete={isIncomplete}
                    showRemoveButton={true}
                    onRemove={!nonRemovableSet.has(p.id) ? onRemoveCustomPlugin : null}
                  />
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
