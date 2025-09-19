import React from 'react';
import { formatShortcut } from '../../utils/shortcutUtils';

export function FileMenu({ onNew, onMakeCopy, onShowVersionHistory, onImport, onExport, onExportPNG, isOpen, onClose }) {
  if (!isOpen) return null;
  const menuStyle = {
    position: 'absolute',
    top: 32,
    left: 0
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
    <div role="menu" className="menu-dropdown" style={menuStyle}>
      <div className="menu-item" onClick={handleClick(onNew)}>
        <span>New</span>
        <span className="menu-shortcut">{key('n', [mod])}</span>
      </div>
      <div className="menu-item" onClick={handleClick(onMakeCopy)}>
        <span>Make a Copy</span>
        <span className="menu-shortcut">{key('n', [mod, 'alt', 'shift'])}</span>
      </div>
      <div className="menu-item" onClick={handleClick(onShowVersionHistory)}>
        <span>Version History</span>
      </div>
      <div className="menu-item" onClick={handleClick(onExport)}>
        <span>Export JSON</span>
        <span className="menu-shortcut">{key('s', [mod])}</span>
      </div>
      <div className="menu-item" onClick={handleClick(onExportPNG)}>
        <span>Export PNG</span>
        <span className="menu-shortcut">{key('s', [mod, 'shift'])}</span>
      </div>
      <div className="menu-item" onClick={handleClick(onImport)}>
        <span>Import JSON</span>
        <span className="menu-shortcut">{key('o', [mod])}</span>
      </div>
    </div>
  );
}
