import { useState } from 'react';
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
  const [expanded, setExpanded] = useState(false);

  const buttons = [
    { key: 'zoomIn', label: 'Zoom In', handler: onZoomIn },
    { key: 'zoomOut', label: 'Zoom Out', handler: onZoomOut },
    { key: 'resetZoom', label: 'Reset Zoom', handler: onResetZoom },
    { key: 'center', label: 'Center Diagram', handler: onCenter },
  ];

  const toggleLabel = expanded ? 'Hide canvas controls' : 'Show canvas controls';
  const toggleGlyph = expanded ? '×' : '☰';

  const handleAction = (handler) => () => {
    handler?.();
    setExpanded(false);
  };

  return (
    <div className="mobile-controls" data-expanded={expanded}>
      <div
        className="mobile-controls__cluster"
        role="group"
        aria-label="Canvas controls"
        aria-hidden={!expanded}
      >
        {buttons.map(({ key, label, handler }) => (
          <button
            key={key}
            type="button"
            className="mobile-controls__button"
            aria-label={label}
            title={label}
            tabIndex={expanded ? 0 : -1}
            onClick={handleAction(handler)}
          >
            <span aria-hidden="true" className="mobile-controls__glyph">{BUTTON_GLYPHS[key]}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="mobile-controls__button mobile-controls__toggle"
        aria-label={toggleLabel}
        title={toggleLabel}
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span aria-hidden="true" className="mobile-controls__glyph">{toggleGlyph}</span>
      </button>
    </div>
  );
}

MobileCanvasControls.propTypes = {
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
  onResetZoom: PropTypes.func.isRequired,
  onCenter: PropTypes.func.isRequired,
};
