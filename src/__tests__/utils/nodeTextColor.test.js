import { describe, it, expect } from 'vitest';
import { 
  getNodeTextColor, 
  getThemeNodeColor, 
  NODE_COLORS, 
  NODE_COLORS_DARK 
} from '../../utils/nodeUtils';

describe('Node Text Color', () => {
  const lightTheme = {
    id: 'light',
    colors: {
      nodeBackground: '#ffffff'
    }
  };

  const darkTheme = {
    id: 'dark',
    colors: {
      nodeBackground: '#2d2d2d'
    }
  };

  describe('getNodeTextColor', () => {
    it('should return dark text for light backgrounds', () => {
      const lightNode = { color: '#ffffff' };
      const textColor = getNodeTextColor(lightNode, lightTheme);
      expect(textColor).toBe('#333333');
    });

    it('should return light text for dark backgrounds', () => {
      const darkNode = { color: '#2d2d2d' };
      const textColor = getNodeTextColor(darkNode, darkTheme);
      expect(textColor).toBe('#ffffff');
    });

    it('should handle nodes without custom colors', () => {
      const nodeWithoutColor = {};
      const lightTextColor = getNodeTextColor(nodeWithoutColor, lightTheme);
      const darkTextColor = getNodeTextColor(nodeWithoutColor, darkTheme);
      
      expect(lightTextColor).toBe('#333333'); // Dark text on light theme
      expect(darkTextColor).toBe('#ffffff'); // Light text on dark theme
    });
  });

  describe('getThemeNodeColor', () => {
    it('should return theme background for nodes without color', () => {
      const nodeWithoutColor = {};
      const lightColor = getThemeNodeColor(nodeWithoutColor, lightTheme);
      const darkColor = getThemeNodeColor(nodeWithoutColor, darkTheme);
      
      expect(lightColor).toBe('#ffffff');
      expect(darkColor).toBe('#2d2d2d');
    });

    it('should return dark variant for light colors in dark theme', () => {
      const blueNode = { color: NODE_COLORS.BLUE };
      const darkColor = getThemeNodeColor(blueNode, darkTheme);
      expect(darkColor).toBe(NODE_COLORS_DARK.BLUE);
    });

    it('should return original color for light theme', () => {
      const blueNode = { color: NODE_COLORS.BLUE };
      const lightColor = getThemeNodeColor(blueNode, lightTheme);
      expect(lightColor).toBe(NODE_COLORS.BLUE);
    });

    it('should return custom colors as-is if not in predefined colors', () => {
      const customNode = { color: '#ff5722' };
      const lightColor = getThemeNodeColor(customNode, lightTheme);
      const darkColor = getThemeNodeColor(customNode, darkTheme);
      
      expect(lightColor).toBe('#ff5722');
      expect(darkColor).toBe('#ff5722');
    });
  });
});