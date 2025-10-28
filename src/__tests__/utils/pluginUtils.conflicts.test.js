import { describe, it, expect } from 'vitest';
import { detectPluginConflicts, checkPluginConflicts } from '../../utils/pluginUtils';

describe('Plugin Conflicts', () => {
  describe('detectPluginConflicts', () => {
    it('should return empty array when no plugins have conflicts', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A' },
        { id: 'plugin.b', name: 'Plugin B' },
      ];
      const pluginPrefs = { 'plugin.a': true, 'plugin.b': true };

      const conflicts = detectPluginConflicts(plugins, pluginPrefs);

      expect(conflicts).toEqual([]);
    });

    it('should detect conflicts when both conflicting plugins are enabled', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: ['plugin.b'] },
        { id: 'plugin.b', name: 'Plugin B' },
      ];
      const pluginPrefs = { 'plugin.a': true, 'plugin.b': true };

      const conflicts = detectPluginConflicts(plugins, pluginPrefs);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toEqual({
        pluginId: 'plugin.a',
        conflictsWith: ['plugin.b'],
        enabledConflicts: ['plugin.b']
      });
    });

    it('should not detect conflicts when conflicting plugin is disabled', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: ['plugin.b'] },
        { id: 'plugin.b', name: 'Plugin B' },
      ];
      const pluginPrefs = { 'plugin.a': true, 'plugin.b': false };

      const conflicts = detectPluginConflicts(plugins, pluginPrefs);

      expect(conflicts).toEqual([]);
    });

    it('should detect multiple conflicts for a single plugin', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: ['plugin.b', 'plugin.c'] },
        { id: 'plugin.b', name: 'Plugin B' },
        { id: 'plugin.c', name: 'Plugin C' },
      ];
      const pluginPrefs = { 'plugin.a': true, 'plugin.b': true, 'plugin.c': true };

      const conflicts = detectPluginConflicts(plugins, pluginPrefs);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].enabledConflicts).toEqual(['plugin.b', 'plugin.c']);
    });

    it('should detect conflicts from multiple plugins', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: ['plugin.b'] },
        { id: 'plugin.b', name: 'Plugin B', conflicts: ['plugin.a'] },
      ];
      const pluginPrefs = { 'plugin.a': true, 'plugin.b': true };

      const conflicts = detectPluginConflicts(plugins, pluginPrefs);

      expect(conflicts).toHaveLength(2);
    });

    it('should ignore conflicts with non-existent plugins', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: ['plugin.nonexistent'] },
        { id: 'plugin.b', name: 'Plugin B' },
      ];
      const pluginPrefs = { 'plugin.a': true, 'plugin.b': true };

      const conflicts = detectPluginConflicts(plugins, pluginPrefs);

      expect(conflicts).toEqual([]);
    });

    it('should handle plugins with empty conflicts array', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: [] },
        { id: 'plugin.b', name: 'Plugin B' },
      ];
      const pluginPrefs = { 'plugin.a': true, 'plugin.b': true };

      const conflicts = detectPluginConflicts(plugins, pluginPrefs);

      expect(conflicts).toEqual([]);
    });
  });

  describe('checkPluginConflicts', () => {
    it('should return no conflict when plugin has no conflicts field', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A' },
        { id: 'plugin.b', name: 'Plugin B' },
      ];
      const pluginPrefs = { 'plugin.b': true };

      const result = checkPluginConflicts('plugin.a', plugins, pluginPrefs);

      expect(result).toEqual({ hasConflict: false, conflicts: [] });
    });

    it('should return conflict when enabling a plugin that conflicts with enabled plugin', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: ['plugin.b'] },
        { id: 'plugin.b', name: 'Plugin B' },
      ];
      const pluginPrefs = { 'plugin.b': true };

      const result = checkPluginConflicts('plugin.a', plugins, pluginPrefs);

      expect(result).toEqual({ hasConflict: true, conflicts: ['plugin.b'] });
    });

    it('should return no conflict when conflicting plugin is disabled', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: ['plugin.b'] },
        { id: 'plugin.b', name: 'Plugin B' },
      ];
      const pluginPrefs = { 'plugin.b': false };

      const result = checkPluginConflicts('plugin.a', plugins, pluginPrefs);

      expect(result).toEqual({ hasConflict: false, conflicts: [] });
    });

    it('should detect reverse conflicts (when enabled plugin lists this plugin as conflict)', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A' },
        { id: 'plugin.b', name: 'Plugin B', conflicts: ['plugin.a'] },
      ];
      const pluginPrefs = { 'plugin.b': true };

      const result = checkPluginConflicts('plugin.a', plugins, pluginPrefs);

      expect(result).toEqual({ hasConflict: true, conflicts: ['plugin.b'] });
    });

    it('should detect both direct and reverse conflicts', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: ['plugin.b'] },
        { id: 'plugin.b', name: 'Plugin B', conflicts: ['plugin.a'] },
        { id: 'plugin.c', name: 'Plugin C', conflicts: ['plugin.a'] },
      ];
      const pluginPrefs = { 'plugin.b': true, 'plugin.c': true };

      const result = checkPluginConflicts('plugin.a', plugins, pluginPrefs);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(2);
      expect(result.conflicts).toContain('plugin.b');
      expect(result.conflicts).toContain('plugin.c');
    });

    it('should not include duplicates in conflicts array', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: ['plugin.b'] },
        { id: 'plugin.b', name: 'Plugin B', conflicts: ['plugin.a'] },
      ];
      const pluginPrefs = { 'plugin.b': true };

      const result = checkPluginConflicts('plugin.a', plugins, pluginPrefs);

      expect(result.conflicts).toEqual(['plugin.b']);
    });

    it('should handle multiple conflicts', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: ['plugin.b', 'plugin.c', 'plugin.d'] },
        { id: 'plugin.b', name: 'Plugin B' },
        { id: 'plugin.c', name: 'Plugin C' },
        { id: 'plugin.d', name: 'Plugin D' },
      ];
      const pluginPrefs = { 'plugin.b': true, 'plugin.c': true, 'plugin.d': false };

      const result = checkPluginConflicts('plugin.a', plugins, pluginPrefs);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toEqual(['plugin.b', 'plugin.c']);
    });

    it('should return no conflict for non-existent plugin', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A' },
      ];
      const pluginPrefs = { 'plugin.a': true };

      const result = checkPluginConflicts('plugin.nonexistent', plugins, pluginPrefs);

      expect(result).toEqual({ hasConflict: false, conflicts: [] });
    });

    it('should handle default enabled plugins (undefined in prefs)', () => {
      const plugins = [
        { id: 'plugin.a', name: 'Plugin A', conflicts: ['plugin.b'] },
        { id: 'plugin.b', name: 'Plugin B' },
      ];
      const pluginPrefs = {}; // Both default to enabled

      const result = checkPluginConflicts('plugin.a', plugins, pluginPrefs);

      expect(result).toEqual({ hasConflict: true, conflicts: ['plugin.b'] });
    });
  });
});
