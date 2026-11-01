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

  it('Spec drum-notation › Keine fest vorgegebene Farbe', () => {
    const pattern = patternOf([
      { hits: { crash: [1], kick: [1, 4], hihat: [2, 3, 4] } },
      { sub: 3, hits: { snare: [1, 2, 3], kick: [1] } },
      { hits: { hihatOpen: [1], snare: [3] } },
      { sub: 6, hits: { tom1: [1, 2, 3, 4, 5, 6] } },
    ]);
    const container = document.createElement('div');
    renderNotation(toNotation(pattern), container);

    const colors = new Set<string>();
    for (const el of container.querySelectorAll('svg, svg *')) {
      for (const attr of ['fill', 'stroke']) {
        const value = el.getAttribute(attr);
        if (value !== null) colors.add(value);
      }
      const style = el.getAttribute('style') ?? '';
      for (const m of style.matchAll(/(?:^|;)\s*(?:fill|stroke)\s*:\s*([^;]+)/g)) colors.add(m[1]!.trim());
    }
    expect([...colors].filter((c) => c !== 'currentColor' && c !== 'none')).toEqual([]);
    expect(colors).toContain('currentColor');
  });

  it('Mini-Darstellung: ohne Schlüssel, skaliert über viewBox, nur Textfarbe', () => {
    const container = document.createElement('div');
    const normal = document.createElement('div');
    const fill = patternOf([{ hits: { snare: [1, 2, 3, 4] } }, { sub: 3, hits: { tom1: [1], floorTom: [2, 3], kick: [1] } }], 'fill');
    renderNotation(toNotation(fill), container, { compact: true });
    renderNotation(toNotation(fill), normal);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 \d+(\.\d+)? \d+$/);
    expect(svg.getAttribute('width')).toBe('100%');
    expect(container.querySelectorAll('.vf-clef').length).toBe(0);
    expect(normal.querySelectorAll('.vf-clef').length).toBe(1);
    const colors = new Set(
      [...container.querySelectorAll('svg, svg *')].flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]),
    );
    expect([...colors].filter((c) => c !== null && c !== 'currentColor' && c !== 'none')).toEqual([]);
  });

  it('ersetzt vorherigen Inhalt beim erneuten Rendern', () => {
    const container = document.createElement('div');
    renderNotation(toNotation(patternOf(emptyBeats(4))), container);
    renderNotation(toNotation(patternOf(emptyBeats(4))), container);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });
});
