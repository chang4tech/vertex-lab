import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { corePlugins } from '../plugins';
import '../styles/Settings.css';

const PluginsManager = ({ onClose, pluginPrefs = {}, onTogglePlugin = () => {} }) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <header className="settings-header">
          <h2><FormattedMessage id="settings.plugins" defaultMessage="Plugins" /></h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </header>

        <div className="settings-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
            {corePlugins.map(p => (
              <React.Fragment key={p.id}>
                <div>{p.name || p.id}</div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={pluginPrefs[p.id] ?? true}
                    onChange={(e) => onTogglePlugin(p.id, e.target.checked)}
                  />
                  <span>{(pluginPrefs[p.id] ?? true) ? 'Enabled' : 'Disabled'}</span>
                </label>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

PluginsManager.propTypes = {
  onClose: PropTypes.func.isRequired,
  pluginPrefs: PropTypes.object,
  onTogglePlugin: PropTypes.func,
};

export default PluginsManager;

