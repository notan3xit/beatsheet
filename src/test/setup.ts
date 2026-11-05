import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { initAutomerge } from '../persistence/songDoc';

await initAutomerge();

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

// jsdom kennt kein scrollIntoView; die Song-Wiedergabe scrollt damit zum laufenden Takt (song-playback, design.md D4)
Element.prototype.scrollIntoView ??= function scrollIntoView() {};

afterEach(() => {
  cleanup();
  // Die Wahl des Workbooks liegt in sessionStorage (song-overview-tiles, design.md D5)
  sessionStorage.clear();
});
