import { describe, it, expect } from 'vitest';
import { APP_SHORTCUTS, findShortcutConflicts, formatShortcut } from '../../utils/shortcutUtils';

describe('shortcutUtils', () => {
  it('formats shortcuts with symbols and keys', () => {
    expect(formatShortcut({ key: 's', modifiers: ['cmd'] })).toBe('⌘ + S');
    expect(formatShortcut({ key: 'z', modifiers: ['ctrl', 'shift'] })).toBe('Ctrl + ⇧ + Z');
    expect(formatShortcut({ key: '-', modifiers: ['alt'] })).toBe('⌥ + -');
  });

  it('detects potential browser conflicts', () => {
    const conflicts = findShortcutConflicts();
    // Expect at least a conflict with Cmd/Ctrl+S (Save Page)
    const hasSaveConflict = conflicts.some(c => c.appShortcut.key === 's');
    expect(hasSaveConflict).toBe(true);
  });

  it('exports a non-empty app shortcuts list', () => {
    expect(Array.isArray(APP_SHORTCUTS)).toBe(true);
    expect(APP_SHORTCUTS.length).toBeGreaterThan(0);
  });
});

