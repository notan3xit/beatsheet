import { describe, expect, it } from 'vitest';
import { emptyBeats, patternOf } from '../../test/patterns';
import { toNotation } from '../model';
import { renderNotation } from './vexflow';

describe('VexFlow-Adapter (Smoke-Test)', () => {
  it('rendert ein gemischtes Pattern ohne Fehler als SVG', () => {
    const pattern = patternOf([
      { hits: { crash: [1], hihat: [2, 3, 4], kick: [1, 4] } },
      { sub: 2, hits: { hihat: [1, 2], snare: [1], hihatPedal: [2] } },
      { sub: 3, hits: { snare: [1, 2, 3], kick: [1] } },
      { sub: 6, hits: { tom1: [1, 2], tom2: [3, 4], floorTom: [5, 6] } },
      { hits: { hihatOpen: [1], ride: [3] } },
      ...emptyBeats(1),
    ]);
    const container = document.createElement('div');
    renderNotation(toNotation(pattern), container);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('ersetzt vorherigen Inhalt beim erneuten Rendern', () => {
    const container = document.createElement('div');
    renderNotation(toNotation(patternOf(emptyBeats(4))), container);
    renderNotation(toNotation(patternOf(emptyBeats(4))), container);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });
});
