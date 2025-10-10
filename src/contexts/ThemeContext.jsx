import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, defaultTheme, getTheme } from '../themes';

const ThemeContext = createContext();

const fallbackRgba = (alpha = 1) => {
  const clamped = Math.min(Math.max(alpha, 0), 1);
  return `rgba(15, 23, 42, ${clamped})`;
};

function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') {
    return fallbackRgba(alpha);
  }
  let normalized = hex.trim().replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map((c) => c + c).join('');
  }
  if (normalized.length !== 6) {
    return fallbackRgba(alpha);
  }
  const bigint = Number.parseInt(normalized, 16);
  if (Number.isNaN(bigint)) {
    return fallbackRgba(alpha);
  }
  const clamped = Math.min(Math.max(alpha, 0), 1);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }) {
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    // Load theme from localStorage or use default
    const savedTheme = localStorage.getItem('vertex_theme');
    return savedTheme && savedTheme in themes ? savedTheme : defaultTheme.id;
  });

  const [currentTheme, setCurrentTheme] = useState(() => getTheme(currentThemeId));

  // Update theme when themeId changes
  useEffect(() => {
    const theme = getTheme(currentThemeId);
    setCurrentTheme(theme);
    localStorage.setItem('vertex_theme', currentThemeId);
    
    // Apply theme to document body for global styles
    applyThemeToDocument(theme);
  }, [currentThemeId]);

  const changeTheme = (themeId) => {
    if (themeId in themes) {
      setCurrentThemeId(themeId);
    }
  };

  const toggleTheme = () => {
    const newThemeId = currentThemeId === 'light' ? 'dark' : 'light';
    changeTheme(newThemeId);
  };

  const value = {
    currentTheme,
    currentThemeId,
    changeTheme,
    toggleTheme,
    themes: Object.values(themes)
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyThemeToDocument(theme) {
  const root = document.documentElement;
  const { colors } = theme;
  
  // Set CSS custom properties for global use
  root.style.setProperty('--app-background', colors.appBackground);
  root.style.setProperty('--canvas-background', colors.canvasBackground);
  root.style.setProperty('--primary-text', colors.primaryText);
  root.style.setProperty('--secondary-text', colors.secondaryText);
  root.style.setProperty('--menu-background', colors.menuBackground);
  root.style.setProperty('--menu-border', colors.menuBorder);
  root.style.setProperty('--menu-text', colors.menuText);
  root.style.setProperty('--menu-hover', colors.menuHover);
  root.style.setProperty('--panel-background', colors.panelBackground);
  root.style.setProperty('--panel-border', colors.panelBorder);
  root.style.setProperty('--panel-shadow', colors.panelShadow);
  root.style.setProperty('--overlay-background', colors.overlayBackground);
  root.style.setProperty('--input-background', colors.inputBackground);
  root.style.setProperty('--input-border', colors.inputBorder);
  root.style.setProperty('--placeholder-text', colors.placeholderText);
  root.style.setProperty('--primary-button', colors.primaryButton);
  root.style.setProperty('--primary-button-hover', colors.primaryButtonHover);
  root.style.setProperty('--primary-button-text', colors.primaryButtonText);
  root.style.setProperty('--plugin-panel-text', colors.primaryText);
  root.style.setProperty('--plugin-panel-background-glass', hexToRgba(colors.panelBackground, 0.42));
  root.style.setProperty('--plugin-panel-border', hexToRgba(colors.panelBorder || colors.menuBorder || '#94a3b8', 0.35));
  root.style.setProperty('--plugin-panel-summary-glass', hexToRgba(colors.menuBackground || colors.panelBackground, 0.24));
  root.style.setProperty('--plugin-panel-surface-glass', hexToRgba(colors.inputBackground || colors.panelBackground, 0.16));
  root.style.setProperty('--plugin-panel-shadow-color', colors.panelShadow || 'rgba(15, 23, 42, 0.2)');
  
  // Update body background
  document.body.style.backgroundColor = colors.appBackground;
  document.body.style.color = colors.primaryText;
}
