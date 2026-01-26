// Vitest setup file for frontend tests
import { beforeAll, afterEach, afterAll } from 'vitest';

// Mock Canvas API for testing
export function mockCanvas() {
  const canvas = document.createElement('canvas');
  const context = {
    fillStyle: '',
    strokeStyle: '',
    fillRect: () => {},
    clearRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    measureText: () => ({ width: 0 }),
    save: () => {},
    restore: () => {},
    scale: () => {},
    translate: () => {},
    rotate: () => {},
    drawImage: () => {}
  };

  canvas.getContext = () => context as any;
  return { canvas, context };
}

beforeAll(() => {
  // Setup code before all tests
});

afterEach(() => {
  // Cleanup after each test
});

afterAll(() => {
  // Cleanup after all tests
});
