import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { corePlugins } from '../plugins';
import '../styles/Settings.css';

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
                  <div>{p.name || p.id}</div>
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
                    <div>{p.name || p.id}</div>
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
