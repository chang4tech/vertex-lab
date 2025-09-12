import { themes, defaultTheme, getTheme, getThemeList, isValidTheme } from '../../themes';

describe('Theme System', () => {
  describe('themes object', () => {
    it('contains all required themes', () => {
      expect(themes).toHaveProperty('light');
      expect(themes).toHaveProperty('dark');
      expect(themes).toHaveProperty('professional');
      expect(themes).toHaveProperty('creative');
      expect(themes).toHaveProperty('focus');
    });

    it('all themes have required structure', () => {
      Object.values(themes).forEach(theme => {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('colors');
        
        // Check required color properties
        const requiredColors = [
          'canvasBackground', 'appBackground', 'nodeBackground', 'nodeBorder',
          'nodeText', 'selectedNodeBorder', 'highlightNodeBackground',
          'edgeColor', 'menuBackground', 'primaryText'
        ];
        
        requiredColors.forEach(colorKey => {
          expect(theme.colors).toHaveProperty(colorKey);
          expect(typeof theme.colors[colorKey]).toBe('string');
        });
      });
    });
  });

  describe('getTheme', () => {
    it('returns correct theme for valid ID', () => {
      expect(getTheme('light')).toBe(themes.light);
      expect(getTheme('dark')).toBe(themes.dark);
    });

    it('returns default theme for invalid ID', () => {
      expect(getTheme('invalid')).toBe(defaultTheme);
      expect(getTheme(null)).toBe(defaultTheme);
      expect(getTheme(undefined)).toBe(defaultTheme);
    });
  });

  describe('getThemeList', () => {
    it('returns array of all themes', () => {
      const themeList = getThemeList();
      expect(Array.isArray(themeList)).toBe(true);
      expect(themeList.length).toBe(5);
      expect(themeList).toContain(themes.light);
      expect(themeList).toContain(themes.dark);
    });
  });

  describe('isValidTheme', () => {
    it('returns true for valid theme IDs', () => {
      expect(isValidTheme('light')).toBe(true);
      expect(isValidTheme('dark')).toBe(true);
      expect(isValidTheme('professional')).toBe(true);
    });

    it('returns false for invalid theme IDs', () => {
      expect(isValidTheme('invalid')).toBe(false);
      expect(isValidTheme(null)).toBe(false);
      expect(isValidTheme(undefined)).toBe(false);
      expect(isValidTheme('')).toBe(false);
    });
  });

  describe('theme color consistency', () => {
    it('all themes have consistent color structure', () => {
      const firstTheme = Object.values(themes)[0];
      const firstThemeColors = Object.keys(firstTheme.colors);
      
      Object.values(themes).forEach(theme => {
        const themeColors = Object.keys(theme.colors);
        expect(themeColors.sort()).toEqual(firstThemeColors.sort());
      });
    });

    it('color values are valid CSS colors', () => {
      Object.values(themes).forEach(theme => {
        Object.entries(theme.colors).forEach(([key, value]) => {
          if (typeof value === 'string') {
            // Basic check for CSS color format
            expect(value).toMatch(/^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)$/);
          }
        });
      });
    });
  });
});