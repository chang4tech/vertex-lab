import React from 'react';
import { formatShortcut } from '../../utils/shortcutUtils';

export function FileMenu({ onNew, onImport, onExport, onExportPNG, isOpen, onClose }) {
  const menuStyle = {
    position: 'absolute',
    top: 32,
    left: 0,
    background: '#fff',
    border: '1px solid #eee',
    borderRadius: 4,
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    minWidth: 140,
    zIndex: 1000,
    padding: '4px 0',
    display: isOpen ? 'block' : 'none'
  };

  const itemStyle = {
    padding: '8px 20px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between'
  };

  const handleClick = (handler) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    handler();
    onClose();
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? 'cmd' : 'ctrl';

  const key = (k, mods=[]) => formatShortcut({ key: k, modifiers: mods });

  return (
    <div className="menu-dropdown" style={menuStyle}>
      <div style={itemStyle} onClick={handleClick(onNew)}>
        <span>New</span>
        <span style={{ opacity: 0.5, marginLeft: 20 }}>{key('n', [mod])}</span>
      </div>
      <div style={itemStyle} onClick={handleClick(onExport)}>
        <span>Export JSON</span>
        <span style={{ opacity: 0.5, marginLeft: 20 }}>{key('s', [mod])}</span>
      </div>
      <div style={itemStyle} onClick={handleClick(onExportPNG)}>
        <span>Export PNG</span>
        <span style={{ opacity: 0.5, marginLeft: 20 }}>{key('s', [mod, 'shift'])}</span>
      </div>
      <div style={itemStyle} onClick={handleClick(onImport)}>
        <span>Import JSON</span>
        <span style={{ opacity: 0.5, marginLeft: 20 }}>{key('o', [mod])}</span>
      </div>
    </div>
  );
}
