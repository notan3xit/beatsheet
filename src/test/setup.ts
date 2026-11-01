import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom hat kein Canvas; VexFlow braucht es nur zur Textvermessung (design.md D10)
HTMLCanvasElement.prototype.getContext = function getContext() {
  return {
    font: '',
    measureText: (text: string) => ({
      width: text.length * 8,
      actualBoundingBoxAscent: 8,
      actualBoundingBoxDescent: 2,
      fontBoundingBoxAscent: 8,
      fontBoundingBoxDescent: 2,
    }),
  };
} as unknown as typeof HTMLCanvasElement.prototype.getContext;

afterEach(() => {
  cleanup();
});
