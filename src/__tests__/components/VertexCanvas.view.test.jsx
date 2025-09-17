import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import VertexCanvas from '../../VertexCanvas.jsx';
import { ThemeProvider } from '../../contexts/ThemeContext.jsx';

// Minimal 2D context mock
const mockCtx = {
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  setTransform: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  roundRect: vi.fn(),
  ellipse: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  HTMLCanvasElement.prototype.getContext = function () { return mockCtx; };
  HTMLCanvasElement.prototype.getBoundingClientRect = function () {
    return { left: 0, top: 0, width: 800, height: 600 };
  };
});

const renderWithTheme = (ui) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('VertexCanvas view controls', () => {
  const nodes = [
    { id: 1, label: 'A', x: 300, y: 250 },
    { id: 2, label: 'B', x: 500, y: 350 },
  ];

  it('center aligns viewBox center to content center', () => {
    const onViewBoxChange = vi.fn();
    const ref = { current: null };
    renderWithTheme(
      <VertexCanvas nodes={nodes} ref={ref} onViewBoxChange={onViewBoxChange} />
    );

    // Call center -> triggers redraw -> emits viewBox
    ref.current.center();
    const vb = onViewBoxChange.mock.calls.pop()[0];
    const centerX = vb.x + vb.width / 2;
    const centerY = vb.y + vb.height / 2;
    const expectedX = (nodes[0].x + nodes[1].x) / 2;
    const expectedY = (nodes[0].y + nodes[1].y) / 2;
    expect(Math.abs(centerX - expectedX)).toBeLessThan(2);
    expect(Math.abs(centerY - expectedY)).toBeLessThan(2);
  });

  it('zoom keeps scene center stable', () => {
    const onViewBoxChange = vi.fn();
    const ref = { current: null };
    renderWithTheme(
      <VertexCanvas nodes={nodes} ref={ref} onViewBoxChange={onViewBoxChange} />
    );

    // Center first to normalize offsets
    ref.current.center();
    const before = onViewBoxChange.mock.calls.pop()[0];
    const beforeCX = before.x + before.width / 2;
    const beforeCY = before.y + before.height / 2;

    // Zoom in around canvas center
    ref.current.zoom(1.2);
    const after = onViewBoxChange.mock.calls.pop()[0];
    const afterCX = after.x + after.width / 2;
    const afterCY = after.y + after.height / 2;

    expect(Math.abs(afterCX - beforeCX)).toBeLessThan(2);
    expect(Math.abs(afterCY - beforeCY)).toBeLessThan(2);
  });

  it('resetZoom sets scale to 1 and preserves center', () => {
    const onViewBoxChange = vi.fn();
    const ref = { current: null };
    renderWithTheme(
      <VertexCanvas nodes={nodes} ref={ref} onViewBoxChange={onViewBoxChange} />
    );

    // Center and capture center
    ref.current.center();
    const before = onViewBoxChange.mock.calls.pop()[0];
    const beforeCX = before.x + before.width / 2;
    const beforeCY = before.y + before.height / 2;

    // Create a non-1 scale and then reset
    ref.current.zoom(1.3);
    ref.current.resetZoom();
    const after = onViewBoxChange.mock.calls.pop()[0];

    // At scale=1, viewBox width/height should match canvas logical size
    expect(Math.round(after.width)).toBe(800);
    expect(Math.round(after.height)).toBe(600);

    const afterCX = after.x + after.width / 2;
    const afterCY = after.y + after.height / 2;
    expect(Math.abs(afterCX - beforeCX)).toBeLessThan(2);
    expect(Math.abs(afterCY - beforeCY)).toBeLessThan(2);
  });
});

