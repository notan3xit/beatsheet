import { describe, expect, it } from 'vitest';
import { emptyBeats, patternOf } from '../../test/patterns';
import { toNotation } from '../model';
import { CARD_SCALE, renderNotation } from './vexflow';

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

  it('Spec songbook-view › Kompakte Pattern-Karten › Gleicher Maßstab', () => {
    const quarters = (n: number) => patternOf(Array.from({ length: n }, () => ({ hits: { snare: [1] } })));
    const scaleOf = (beats: number) => {
      const container = document.createElement('div');
      renderNotation(toNotation(quarters(beats)), container, { card: true });
      const svg = container.querySelector('svg')!;
      expect(container.querySelectorAll('.vf-clef').length).toBe(1);
      const viewBox = svg.getAttribute('viewBox')!.split(' ').map(Number);
      return Number.parseFloat(svg.getAttribute('width')!) / viewBox[2]!;
    };
    expect(scaleOf(4)).toBeCloseTo(CARD_SCALE, 3);
    expect(scaleOf(8)).toBeCloseTo(CARD_SCALE, 3);
  });

  it('Karten-Darstellung bricht nach der verfügbaren Breite um', () => {
    const pattern = patternOf(Array.from({ length: 8 }, () => ({ hits: { snare: [1] } })));
    const single = () => {
      const c = document.createElement('div');
      renderNotation(toNotation(patternOf(Array.from({ length: 4 }, () => ({ hits: { snare: [1] } })))), c, { card: true });
      return c;
    };
    const wide = document.createElement('div');
    const narrow = document.createElement('div');
    // 400 px reichen im Kartenmaßstab für zwei 4/4-Takte, in Originalgröße nicht
    renderNotation(toNotation(pattern), wide, { card: true, maxWidth: 400 });
    renderNotation(toNotation(pattern), narrow, { card: true, maxWidth: 250 });
    const rows = (c: HTMLElement) =>
      new Set([...c.querySelectorAll('.vf-stave path')].map((p) => p.getAttribute('d')!.match(/^M[\d.]+ ([\d.]+)/)?.[1])).size;
    expect(rows(narrow)).toBeGreaterThan(rows(wide));
    expect(rows(wide)).toBe(rows(single()));
  });

  it('ersetzt vorherigen Inhalt beim erneuten Rendern', () => {
    const container = document.createElement('div');
    renderNotation(toNotation(patternOf(emptyBeats(4))), container);
    renderNotation(toNotation(patternOf(emptyBeats(4))), container);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });
});
