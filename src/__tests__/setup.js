import '@testing-library/jest-dom';
import { vi } from 'vitest'

// Mock canvas
const mockCanvas = {
  getContext: () => ({
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillText: vi.fn(),
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  getBoundingClientRect: () => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
  }),
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Helper to create a canvas element
global.createCanvas = () => {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'getContext', {
    value: mockCanvas.getContext,
  });
  Object.defineProperty(canvas, 'addEventListener', {
    value: mockCanvas.addEventListener,
  });
  Object.defineProperty(canvas, 'removeEventListener', {
    value: mockCanvas.removeEventListener,
  });
  Object.defineProperty(canvas, 'dispatchEvent', {
    value: mockCanvas.dispatchEvent,
  });
  Object.defineProperty(canvas, 'getBoundingClientRect', {
    value: mockCanvas.getBoundingClientRect,
  });
  return canvas;
};

// Note: use native FileReader in JSDOM for blob/file operations
