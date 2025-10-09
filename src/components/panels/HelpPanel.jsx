import React, { useMemo } from 'react';
import { APP_SHORTCUTS, formatShortcut } from '../../utils/shortcutUtils';

export function HelpPanel({ isVisible, overlayRightInset = 0 }) {
  // Build a merged list from APP_SHORTCUTS, combining Cmd/Ctrl variants
  const mergedShortcuts = useMemo(() => {
    const groups = new Map();
    const norm = (mods) => mods.filter(m => m !== 'cmd' && m !== 'ctrl').sort().join('+');
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
    // Preserve insertion order
    const list = [];
    groups.forEach(g => {
      let display;
      if (g.hasCmd && g.hasCtrl) {
        const cmdStr = formatShortcut({ key: g.key, modifiers: ['cmd', ...g.otherMods] });
        const ctrlStr = formatShortcut({ key: g.key, modifiers: ['ctrl', ...g.otherMods] });
        display = `${cmdStr} / ${ctrlStr}`;
      } else if (g.single) {
        display = formatShortcut({ key: g.single.key, modifiers: g.single.modifiers || [] });
      } else if (g.hasCmd) {
        display = formatShortcut({ key: g.key, modifiers: ['cmd', ...g.otherMods] });
      } else if (g.hasCtrl) {
        display = formatShortcut({ key: g.key, modifiers: ['ctrl', ...g.otherMods] });
      } else {
        // Fallback
        display = formatShortcut({ key: g.key, modifiers: g.otherMods });
      }
      list.push({ key: display, desc: g.desc });
    });
    return list;
  }, []);

  const rightOffset = Math.max(0, Number.isFinite(overlayRightInset) ? overlayRightInset : 0);
  const className = `help ${isVisible ? 'show' : ''} ${rightOffset > 0 ? 'with-panel' : ''}`;

  return (
    <div
      role="dialog"
      className={className}
      style={{ '--help-right': `${20 + rightOffset}px` }}
    >
      <div className={`rules ${isVisible ? 'show' : ''}`} style={{ position: 'relative' }}>
        <h2>Keyboard Shortcuts</h2>
        {mergedShortcuts.map(({ key, desc }) => (
          <div className="rule" key={key}>
            <span className="key">{key}</span>
            <span className="desc">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
