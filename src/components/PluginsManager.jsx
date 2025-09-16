import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { corePlugins } from '../plugins';
import '../styles/Settings.css';
import { getPluginErrors, getPluginErrorsById, subscribePluginErrors } from '../plugins/errorLog.js';

const PluginsManager = ({
  onClose,
  pluginPrefs = {},
  onTogglePlugin = () => {},
  availablePlugins = corePlugins,
  customPlugins = [],
  onImportCustomPlugin = async () => {},
  onRemoveCustomPlugin = () => {},
}) => {
  const fileInputRef = useRef(null);
  const [expanded, setExpanded] = useState({});
  const [errors, setErrors] = useState(() => getPluginErrors());
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
    const unsub = subscribePluginErrors(() => setErrors(getPluginErrors()));
    return unsub;
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

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <header className="settings-header">
          <h2><FormattedMessage id="settings.plugins" defaultMessage="Plugins" /></h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </header>

        <div className="settings-content">
          <section style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '8px 0' }}><FormattedMessage id="plugins.core" defaultMessage="Core Plugins" /></h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
              {availablePlugins.map(p => (
                <React.Fragment key={p.id}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong>{p.name || p.id}</strong>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{pluginPrefs[p.id] ?? true ? '• Enabled' : '• Disabled'}</span>
                      {isIncomplete(p) && (
                        <span style={{ fontSize: 12, color: '#b45309' }}>• <FormattedMessage id="plugins.incomplete" defaultMessage="Incomplete" /></span>
                      )}
                      {getPluginErrorsById(p.id).length > 0 && (
                        <span style={{ fontSize: 12, color: '#b91c1c' }}>• Errors: {getPluginErrorsById(p.id).length}</span>
                      )}
                      <button style={{ marginLeft: 'auto' }} onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !prev[p.id] }))}>
                        {expanded[p.id] ? 'Hide Details' : 'Details'}
                      </button>
                    </div>
                    {expanded[p.id] && (
                      <div style={{ fontSize: 12, color: '#374151', marginTop: 6 }}>
                        {p.description && <div><strong>Description:</strong> {p.description}</div>}
                        {p.version && <div><strong>Version:</strong> {p.version}</div>}
                        {p.author && <div><strong>Author:</strong> {p.author}</div>}
                        {!p.description && !p.version && !p.author && (
                          <div style={{ color: '#6b7280' }}>No metadata</div>
                        )}
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                          <button onClick={() => {
                            try { sessionStorage.setItem('vertex_plugin_return', window.location.hash || '#/'); } catch {}
                            window.location.hash = `#/plugin/${encodeURIComponent(p.id)}`;
                          }}><FormattedMessage id="plugins.controlHub" defaultMessage="Control Hub" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
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
              <button onClick={triggerImport}><FormattedMessage id="plugins.import" defaultMessage="Import Plugin (.js)" /></button>
              <input ref={fileInputRef} type="file" accept=".js,.mjs" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
            {customPlugins.length === 0 ? (
              <div style={{ color: '#6b7280' }}><FormattedMessage id="plugins.none" defaultMessage="No custom plugins imported yet." /></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 8 }}>
                {customPlugins.map((p) => (
                  <React.Fragment key={p.id}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong>{p.name || p.id}</strong>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{pluginPrefs[p.id] ?? true ? '• Enabled' : '• Disabled'}</span>
                        {isIncomplete(p) && (
                          <span style={{ fontSize: 12, color: '#b45309' }}>• <FormattedMessage id="plugins.incomplete" defaultMessage="Incomplete" /></span>
                        )}
                        {getPluginErrorsById(p.id).length > 0 && (
                          <span style={{ fontSize: 12, color: '#b91c1c' }}>• Errors: {getPluginErrorsById(p.id).length}</span>
                        )}
                        <button style={{ marginLeft: 'auto' }} onClick={() => setExpanded(prev => ({ ...prev, [p.id]: !prev[p.id] }))}>
                          {expanded[p.id] ? 'Hide Details' : 'Details'}
                        </button>
                    </div>
                    {expanded[p.id] && (
                      <div style={{ fontSize: 12, color: '#374151', marginTop: 6 }}>
                        {p.description && <div><strong>Description:</strong> {p.description}</div>}
                        {p.version && <div><strong>Version:</strong> {p.version}</div>}
                        {p.author && <div><strong>Author:</strong> {p.author}</div>}
                        {!p.description && !p.version && !p.author && (
                          <div style={{ color: '#6b7280' }}>No metadata</div>
                        )}
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                          <button onClick={() => {
                            try { sessionStorage.setItem('vertex_plugin_return', window.location.hash || '#/'); } catch {}
                            window.location.hash = `#/plugin/${encodeURIComponent(p.id)}`;
                          }}><FormattedMessage id="plugins.controlHub" defaultMessage="Control Hub" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={pluginPrefs[p.id] ?? true}
                        onChange={(e) => onTogglePlugin(p.id, e.target.checked)}
                      />
                      <span><FormattedMessage id={(pluginPrefs[p.id] ?? true) ? 'plugins.enabled' : 'plugins.disabled'} defaultMessage={(pluginPrefs[p.id] ?? true) ? 'Enabled' : 'Disabled'} /></span>
                    </label>
                    <button onClick={() => onRemoveCustomPlugin(p.id)}><FormattedMessage id="plugins.remove" defaultMessage="Remove" /></button>
                  </React.Fragment>
                ))}
              </div>
            )}
          </section>

          <section style={{ marginTop: 16 }}>
            <h3 style={{ margin: '8px 0' }}>Plugin Errors</h3>
            {errors.length === 0 ? (
              <div style={{ color: '#6b7280' }}>No plugin errors captured.</div>
            ) : (
              <>
                <div style={{ marginBottom: 8 }}>
                  <button onClick={() => {
                    const text = errors.map(e => `[${new Date(e.time).toISOString()}] ${e.pluginId}: ${e.message}`).join('\n');
                    navigator.clipboard?.writeText(text).catch(() => {});
                  }}>Copy</button>
                </div>
                <div style={{ maxHeight: 120, overflow: 'auto', fontSize: 12, background: '#f9fafb', border: '1px solid #e5e7eb', padding: 8 }}>
                  {errors.slice(-10).map((e, idx) => (
                    <div key={idx} style={{ color: '#111827' }}>
                      <span style={{ color: '#6b7280' }}>[{new Date(e.time).toLocaleTimeString()}]</span> <strong>{e.pluginId}</strong>: {e.message}
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
};

export default PluginsManager;
