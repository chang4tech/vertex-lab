import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { APP_SHORTCUTS, findShortcutConflicts, getShortcutsByKey, formatShortcut } from '../utils/shortcutUtils';
import '../styles/Settings.css';

const Settings = ({ onClose }) => {
  const [shortcuts, setShortcuts] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    setShortcuts(getShortcutsByKey());
    setConflicts(findShortcutConflicts());
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <header className="settings-header">
          <h2><FormattedMessage id="settings.title" defaultMessage="Settings" /></h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </header>

        <div className="settings-tabs">
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <FormattedMessage id="settings.allShortcuts" defaultMessage="All Shortcuts" />
          </button>
          <button 
            className={`tab-button ${activeTab === 'conflicts' ? 'active' : ''}`}
            onClick={() => setActiveTab('conflicts')}
          >
            <FormattedMessage id="settings.conflicts" defaultMessage="Conflicts" />
            {conflicts.length > 0 && <span className="conflict-badge">{conflicts.length}</span>}
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'all' ? (
            <div className="shortcuts-list">
              <h3><FormattedMessage id="settings.shortcuts" defaultMessage="Keyboard Shortcuts" /></h3>
              {Object.entries(shortcuts).map(([key, shortcutList]) => (
                <div key={key} className="shortcut-group">
                  <div className="shortcut-key">{key.toUpperCase()}</div>
                  <div className="shortcut-combinations">
                    {shortcutList.map((shortcut, index) => (
                      <div key={index} className="shortcut-item">
                        <span className="shortcut-combo">{formatShortcut(shortcut)}</span>
                        <span className="shortcut-description">{shortcut.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="conflicts-list">
              <h3>Browser Conflicts</h3>
              {conflicts.length === 0 ? (
                <p className="no-conflicts">
                <FormattedMessage id="settings.noConflicts" defaultMessage="No conflicts detected! 🎉" />
              </p>
              ) : (
                conflicts.map((conflict, index) => (
                  <div key={index} className="conflict-item">
                    <div className="conflict-header">
                      <span className="conflict-combo">{formatShortcut(conflict.appShortcut)}</span>
                    </div>
                    <div className="conflict-details">
                      <div className="conflict-app">
                        <span className="label">
                          <FormattedMessage id="settings.app" defaultMessage="App:" />
                        </span>
                        <span>{conflict.appShortcut.description}</span>
                      </div>
                      <div className="conflict-browser">
                        <span className="label">
                          <FormattedMessage id="settings.browser" defaultMessage="Browser:" />
                        </span>
                        <span>{conflict.browserShortcut.description}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Settings.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default Settings;
