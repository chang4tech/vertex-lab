import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { APP_SHORTCUTS, findShortcutConflicts, formatShortcut } from '../utils/shortcutUtils';
import '../styles/Settings.css';

const Settings = ({ onClose, pluginPrefs = {}, onTogglePlugin = () => {} }) => {
  const [shortcuts, setShortcuts] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Build a merged list from APP_SHORTCUTS, combining Cmd/Ctrl variants
    const groups = new Map();
    const norm = (mods) => (mods || []).filter(m => m !== 'cmd' && m !== 'ctrl').sort().join('+');
    APP_SHORTCUTS.forEach(sc => {
      const baseMods = sc.modifiers || [];
      const other = norm(baseMods);
      const key = `${sc.key}|${other}|${sc.description}`;
      if (!groups.has(key)) {
        groups.set(key, { key: sc.key, otherMods: other ? other.split('+') : [], desc: sc.description, hasCmd: false, hasCtrl: false, single: null });
      }
      const g = groups.get(key);
      if (baseMods.includes('cmd')) g.hasCmd = true;
      if (baseMods.includes('ctrl')) g.hasCtrl = true;
      if (!baseMods.includes('cmd') && !baseMods.includes('ctrl')) g.single = sc; // e.g., Alt-only or no-mod
    });
    const list = [];
    groups.forEach(g => {
      let combo;
      if (g.hasCmd && g.hasCtrl) {
        const cmdStr = formatShortcut({ key: g.key, modifiers: ['cmd', ...g.otherMods] });
        const ctrlStr = formatShortcut({ key: g.key, modifiers: ['ctrl', ...g.otherMods] });
        combo = `${cmdStr} / ${ctrlStr}`;
      } else if (g.single) {
        combo = formatShortcut({ key: g.single.key, modifiers: g.single.modifiers || [] });
      } else if (g.hasCmd) {
        combo = formatShortcut({ key: g.key, modifiers: ['cmd', ...g.otherMods] });
      } else if (g.hasCtrl) {
        combo = formatShortcut({ key: g.key, modifiers: ['ctrl', ...g.otherMods] });
      } else {
        combo = formatShortcut({ key: g.key, modifiers: g.otherMods });
      }
      list.push({ combo, desc: g.desc });
    });
    // Sort by description asc
    list.sort((a, b) => a.desc.localeCompare(b.desc));
    setShortcuts(list);
    setConflicts(findShortcutConflicts());
  }, []);

  // Tags managed in TagManager

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
          {null}
        </div>

        <div className="settings-content">
          {activeTab === 'all' ? (
            <div className="shortcuts-list">
              <h3><FormattedMessage id="settings.shortcuts" defaultMessage="Keyboard Shortcuts" /></h3>
              {shortcuts.map((s, i) => (
                <div key={`${s.desc}-${i}`} className="shortcut-group" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <div className="shortcut-description">{s.desc}</div>
                  <div className="shortcut-combinations"><span className="shortcut-combo">{s.combo}</span></div>
                </div>
              ))}
            </div>
          ) : activeTab === 'conflicts' ? (
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
          ) : activeTab === 'conflicts' ? (
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
          ) : activeTab === 'plugins' ? (
            <PluginSettings pluginPrefs={pluginPrefs} onTogglePlugin={onTogglePlugin} />
          ) : null}
        </div>
      </div>
    </div>
  );
};

Settings.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default Settings;

// Inline plugin settings component
function PluginSettings({ pluginPrefs, onTogglePlugin }) {
  // Lazy import to avoid circular issues
  const { corePlugins } = require('../plugins');
  return (
    <div>
      <h3><FormattedMessage id="settings.plugins" defaultMessage="Plugins" /></h3>
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
  );
}
