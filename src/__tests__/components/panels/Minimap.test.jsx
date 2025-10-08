import React from 'react';
import { render, waitFor, cleanup } from '@testing-library/react';
import { ThemeProvider } from '../../../contexts/ThemeContext.jsx';
import { Minimap } from '../../../components/panels/Minimap.jsx';
import * as nodeUtils from '../../../utils/nodeUtils';
import { vi, afterEach, describe, it, expect } from 'vitest';

const createMockContext = () => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  translate: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  ellipse: vi.fn(),
  quadraticCurveTo: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
});

describe('Minimap', () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalGetBoundingClientRect = HTMLCanvasElement.prototype.getBoundingClientRect;

  afterEach(() => {
    cleanup();
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    vi.restoreAllMocks();
  });

  it('falls back to default bounds when no nodes are visible', async () => {
    const mockCtx = createMockContext();
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx);
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
    }));

    const visibleSpy = vi.spyOn(nodeUtils, 'getVisibleNodes').mockReturnValue([]);

    const nodes = [
      { id: 1, x: 100, y: 100, label: 'Hidden A' },
      { id: 2, x: 200, y: 200, label: 'Hidden B' },
    ];

    const { container } = render(
      <ThemeProvider>
        <Minimap nodes={nodes} edges={[]} visible viewBox={{ x: 0, y: 0, width: 100, height: 100 }} />
      </ThemeProvider>
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    await waitFor(() => {
      expect(Number.isFinite(canvas.width)).toBe(true);
      expect(Number.isFinite(canvas.height)).toBe(true);
      expect(canvas.width).toBeGreaterThan(0);
      expect(canvas.height).toBeGreaterThan(0);
    });

    visibleSpy.mockRestore();
  });
});
