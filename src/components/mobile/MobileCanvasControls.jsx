import PropTypes from 'prop-types';

const BUTTON_GLYPHS = {
  zoomIn: '＋',
  zoomOut: '－',
  resetZoom: '⟳',
  center: '⤢',
};

export function MobileCanvasControls({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onCenter,
}) {
  const buttons = [
    { key: 'zoomIn', label: 'Zoom In', handler: onZoomIn },
    { key: 'zoomOut', label: 'Zoom Out', handler: onZoomOut },
    { key: 'resetZoom', label: 'Reset Zoom', handler: onResetZoom },
    { key: 'center', label: 'Center', handler: onCenter },
  ];

  const containerStyle = {
    position: 'fixed',
    right: 'calc(20px + env(safe-area-inset-right))',
    bottom: 'calc(96px + env(safe-area-inset-bottom))',
    zIndex: 20000,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    pointerEvents: 'auto',
  };

  const content = (
    <div className="mobile-controls" role="group" aria-label="Canvas controls" style={containerStyle}>
      {buttons.map(({ key, label, handler }) => (
        <button
          key={key}
          type="button"
          className="mobile-controls__button"
          aria-label={label}
          title={label}
          onClick={handler}
        >
          <span aria-hidden="true" className="mobile-controls__glyph">{BUTTON_GLYPHS[key]}</span>
        </button>
      ))}
    </div>
  );

  return content;
}

MobileCanvasControls.propTypes = {
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
  onResetZoom: PropTypes.func.isRequired,
  onCenter: PropTypes.func.isRequired,
};
