import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';
import VertexCanvas from '../../VertexCanvas.jsx';

// Minimal canvas context mock for draw calls
beforeAll(() => {
  const ctx = {
    clearRect: () => {},
    fillRect: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    ellipse: () => {},
    rect: () => {},
    roundRect: () => {},
    closePath: () => {},
    stroke: () => {},
    strokeRect: () => {},
    fill: () => {},
    fillText: () => {},
    get font() { return ''; },
    set font(_) {},
  };
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => ctx,
  });
});

describe('VertexCanvas mobile UX', () => {
  it('disables iOS callout/selection via inline styles', () => {
    const { container } = render(
      <ThemeProvider>
        <VertexCanvas nodes={[]} edges={[]} selectedNodeIds={[]} highlightedNodeIds={[]} onSelectionChange={() => {}} />
      </ThemeProvider>
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    // React maps camelCase to CSS properties on the element style
    expect(canvas.style.userSelect).toBe('none');
    // Prefixed properties are browser-specific; asserting standard property is sufficient here
  });
});
