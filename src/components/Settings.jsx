import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { APP_SHORTCUTS, findShortcutConflicts, formatShortcut } from '../utils/shortcutUtils';
import { loadTags, saveTags, generateTagId } from '../utils/tagUtils';
import '../styles/Settings.css';

const Settings = ({ onClose }) => {
  const [shortcuts, setShortcuts] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [tags, setTags] = useState(() => loadTags());
  const [newTag, setNewTag] = useState({ name: '', color: '#4caf50' });
  const tagFileRef = useRef(null);

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

  useEffect(() => {
    saveTags(tags);
  }, [tags]);

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
          <button 
            className={`tab-button ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            <FormattedMessage id="settings.tags" defaultMessage="Tags" />
          </button>
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
          ) : (
            <div className="tags-manager" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3><FormattedMessage id="settings.tagsManager" defaultMessage="Tag Manager" /></h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Tag name"
                  value={newTag.name}
                  onChange={(e) => setNewTag(t => ({ ...t, name: e.target.value }))}
                  style={{ flex: 1, padding: '8px 10px' }}
                />
                <input
                  aria-label="Tag color"
                  title="Tag color"
                  type="color"
                  value={newTag.color}
                  onChange={(e) => setNewTag(t => ({ ...t, color: e.target.value }))}
                />
                <button
                  onClick={() => {
                    if (!newTag.name.trim()) return;
                    const id = generateTagId(newTag.name.trim());
                    setTags(prev => [...prev, { id, name: newTag.name.trim(), color: newTag.color }]);
                    setNewTag({ name: '', color: newTag.color });
                  }}
                  className="primary"
                >
                  <FormattedMessage id="settings.addTag" defaultMessage="Add" />
                </button>

                {/* Export / Import tag presets */}
                <button
                  onClick={() => {
                    try {
                      const dataStr = JSON.stringify(tags, null, 2);
                      const blob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      const ts = new Date();
                      const pad = (n) => String(n).padStart(2, '0');
                      const filename = `vertex-tags-${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.json`;
                      a.href = url;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      alert('Failed to export tags');
                    }
                  }}
                >
                  <FormattedMessage id="settings.exportTags" defaultMessage="Export Tags" />
                </button>
                <button onClick={() => tagFileRef.current?.click?.()}>
                  <FormattedMessage id="settings.importTags" defaultMessage="Import Tags" />
                </button>
                <input
                  ref={tagFileRef}
                  type="file"
                  accept="application/json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) { e.target.value = ''; return; }
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      try {
                        const parsed = JSON.parse(String(evt.target.result || 'null'));
                        if (!Array.isArray(parsed)) throw new Error('Invalid format: expected an array');
                        const valid = parsed.every(t => t && typeof t.id === 'string' && typeof t.name === 'string' && typeof t.color === 'string');
                        if (!valid) throw new Error('Invalid tag entries');
                        setTags(parsed);
                      } catch (err) {
                        alert(`Failed to import tags: ${err.message}`);
                      }
                    };
                    reader.onerror = () => alert('Failed to read file');
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </div>

              <div>
                {tags.length === 0 ? (
                  <div style={{ opacity: 0.7 }}><FormattedMessage id="settings.noTags" defaultMessage="No tags yet" /></div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
                    {tags.map((t, idx) => (
                      <React.Fragment key={t.id}>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setTags(prev => prev.map((x, i) => i === idx ? { ...x, name } : x));
                          }}
                          style={{ padding: '6px 8px' }}
                        />
                        <input
                          aria-label={`Color for ${t.name}`}
                          type="color"
                          value={t.color}
                          onChange={(e) => {
                            const color = e.target.value;
                            setTags(prev => prev.map((x, i) => i === idx ? { ...x, color } : x));
                          }}
                        />
                        <button
                          onClick={() => setTags(prev => prev.filter((_, i) => i !== idx))}
                          className="danger"
                        >
                          <FormattedMessage id="common.delete" defaultMessage="Delete" />
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
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
