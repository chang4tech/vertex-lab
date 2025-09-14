import React from 'react';

export function HelpPanel({ isVisible, onClose }) {
  const shortcuts = [
    { key: '⌘⇧N / Ctrl⇧N', desc: 'New Diagram' },
    { key: '⌘S / CtrlS', desc: 'Export JSON' },
    { key: '⌘⇧S / Ctrl⇧S', desc: 'Export PNG' },
    { key: '⌘⇧O / Ctrl⇧O', desc: 'Import JSON' },
    { key: '⌘Z / CtrlZ', desc: 'Undo' },
    { key: '⌘⇧Z / Ctrl⇧Z', desc: 'Redo' },
    { key: '⌘L / CtrlL', desc: 'Auto Layout' },
    { key: '⌘F / CtrlF', desc: 'Search' },
    { key: '⌥+ / ⌥=', desc: 'Zoom In' },
    { key: '⌥-', desc: 'Zoom Out' },
    { key: '⌥0', desc: 'Reset Zoom' },
    { key: '⌥C', desc: 'Center Diagram' },
    { key: '⌘I / CtrlI', desc: 'Toggle Node Info Panel' },
    { key: 'M', desc: 'Toggle Minimap' },
    { key: 'Delete / Backspace', desc: 'Delete Selection' },
    { key: 'F2', desc: 'Edit Node' },
  ];

  return (
    <div role="dialog" className={`help ${isVisible ? 'show' : ''}`}>
      <div className={`rules ${isVisible ? 'show' : ''}`}>
        <h2>Keyboard Shortcuts</h2>
        {shortcuts.map(({ key, desc }) => (
          <div className="rule" key={key}>
            <span className="key">{key}</span>
            <span className="desc">{desc}</span>
          </div>
        ))}
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
