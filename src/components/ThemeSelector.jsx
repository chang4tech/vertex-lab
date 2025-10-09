import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSelector = ({ onClose }) => {
  const { currentTheme, currentThemeId, changeTheme, themes } = useTheme();

  const handleThemeChange = (themeId) => {
    changeTheme(themeId);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div onClick={handleOverlayClick} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: currentTheme.colors.overlayBackground,
      zIndex: 10200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: currentTheme.colors.panelBackground,
        borderRadius: '12px',
        boxShadow: `0 8px 32px ${currentTheme.colors.panelShadow}`,
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${currentTheme.colors.panelBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{
            margin: 0,
            color: currentTheme.colors.primaryText,
            fontSize: '18px',
            fontWeight: '600'
          }}>
            <FormattedMessage id="themes.title" defaultMessage="Choose Theme" />
          </h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: currentTheme.colors.secondaryText,
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Theme Grid */}
        <div style={{
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={currentThemeId === theme.id}
              onClick={() => handleThemeChange(theme.id)}
              currentTheme={currentTheme}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${currentTheme.colors.panelBorder}`,
          backgroundColor: currentTheme.colors.menuHover,
          fontSize: '12px',
          color: currentTheme.colors.secondaryText,
          textAlign: 'center'
        }}>
          <FormattedMessage 
            id="themes.tip" 
            defaultMessage="Theme preference is saved automatically"
          />
        </div>
      </div>
    </div>
  );
};

const ThemeCard = ({ theme, isSelected, onClick, currentTheme }) => {
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${isSelected ? currentTheme.colors.primaryButton : currentTheme.colors.panelBorder}`,
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        backgroundColor: isSelected ? currentTheme.colors.menuHover : 'transparent',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Theme Preview */}
      <div style={{
        height: '80px',
        borderRadius: '4px',
        marginBottom: '12px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: theme.colors.canvasBackground
      }}>
        {/* Mini nodes preview */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* Central node */}
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: theme.colors.nodeBackground,
            border: `2px solid ${theme.colors.nodeBorder}`,
            position: 'relative'
          }}>
            {/* Connection lines */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '100%',
              width: '12px',
              height: '1px',
              backgroundColor: theme.colors.edgeColor,
              transform: 'translateY(-50%)'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              right: '100%',
              width: '12px',
              height: '1px',
              backgroundColor: theme.colors.edgeColor,
              transform: 'translateY(-50%)'
            }} />
          </div>
          
          {/* Child nodes */}
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: theme.colors.nodeBackground,
            border: `1px solid ${theme.colors.nodeBorder}`
          }} />
          
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: theme.colors.highlightNodeBackground,
            border: `1px solid ${theme.colors.highlightNodeBorder}`
          }} />
        </div>
      </div>

      {/* Theme Name */}
      <div style={{
        fontWeight: isSelected ? '600' : '500',
        color: currentTheme.colors.primaryText,
        marginBottom: '4px'
      }}>
        {theme.name}
      </div>

      {/* Theme Description */}
      <div style={{
        fontSize: '12px',
        color: currentTheme.colors.secondaryText,
        lineHeight: '1.4'
      }}>
        <FormattedMessage 
          id={`themes.${theme.id}.description`} 
          defaultMessage={getThemeDescription(theme.id)}
        />
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: currentTheme.colors.primaryButton,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: currentTheme.colors.primaryButtonText,
          fontSize: '10px'
        }}>
          ✓
        </div>
      )}
    </div>
  );
};

function getThemeDescription(themeId) {
  const descriptions = {
    light: 'Clean and bright interface',
    dark: 'Easy on the eyes for long sessions',
    professional: 'Corporate-friendly design',
    creative: 'Vibrant and inspiring colors',
    focus: 'Minimal distractions for concentration'
  };
  return descriptions[themeId] || 'Custom theme';
}

export default ThemeSelector;
