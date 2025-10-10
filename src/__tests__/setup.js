import '@testing-library/jest-dom';
import { vi } from 'vitest'

if (typeof global.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    constructor(type, params = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? '';
      this.isPrimary = params.isPrimary ?? true;
      this.pressure = params.pressure ?? 0;
      this.tangentialPressure = params.tangentialPressure ?? 0;
      this.tiltX = params.tiltX ?? 0;
      this.tiltY = params.tiltY ?? 0;
      this.twist = params.twist ?? 0;
      this.width = params.width ?? 0;
      this.height = params.height ?? 0;
    }
  }
  global.PointerEvent = PointerEventPolyfill;
}

// Mock canvas
const mockCanvas = {
  getContext: () => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
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
    closePath: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
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

if (typeof HTMLCanvasElement !== 'undefined') {
  const canvasProto = HTMLCanvasElement.prototype;
  Object.defineProperty(canvasProto, 'getContext', {
    value: mockCanvas.getContext,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(canvasProto, 'toDataURL', {
    value: vi.fn(() => 'data:image/png;base64,mock'),
    configurable: true,
    writable: true,
  });
}

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
