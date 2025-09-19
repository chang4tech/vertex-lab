import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { loadTags, saveTags, generateTagId } from '../utils/tagUtils';
import '../styles/Settings.css';

const TagManager = ({ onClose }) => {
  const [tags, setTags] = useState(() => loadTags());
  const [newTag, setNewTag] = useState({ name: '', color: '#4caf50' });
  const tagFileRef = useRef(null);

  useEffect(() => { saveTags(tags); }, [tags]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <header className="settings-header">
          <h2><FormattedMessage id="settings.tagsManager" defaultMessage="Tag Manager" /></h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </header>

        <div className="settings-content tags-manager">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <input
              type="text"
              value={newTag.name}
              placeholder="New tag"
              onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
              style={{ padding: '6px 8px' }}
            />
            <input
              aria-label="New tag color"
              type="color"
              value={newTag.color}
              onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
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
                  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
                  try {
                    if (!isJsdom && typeof a.click === 'function') {
                      a.click();
                    }
                  } catch (clickError) {
                    console.warn('Tag export click failed (likely unsupported in test environment)', clickError);
                  } finally {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
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
      </div>
    </div>
  );
};

TagManager.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default TagManager;
