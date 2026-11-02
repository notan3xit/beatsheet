import { describe, expect, it } from 'vitest';
import { emptyBeats, patternOf } from '../../test/patterns';
import { toNotation } from '../model';
import type { NotationEvent } from '../model';
import { CARD_SCALE, noteFor, renderNotation } from './vexflow';

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

  describe('Pausen der Stimmen (rest-voices)', () => {
    const notesOf = (pattern: ReturnType<typeof patternOf>) => {
      const container = document.createElement('div');
      renderNotation(toNotation(pattern), container);
      return container.querySelectorAll('.vf-stavenote').length;
    };

    it('Hi-Hat-Achtel ohne Füße: nur die Hi-Hat-Noten, keine Fußpausen', () => {
      expect(notesOf(patternOf(Array.from({ length: 4 }, () => ({ hits: { hihat: [1, 3] } }))))).toBe(8);
    });

    it('leerer 4-Beat-Groove: genau eine Pause', () => {
      expect(notesOf(patternOf(emptyBeats(4)))).toBe(1);
    });

    it('leerer 2-Beat-Fill: genau zwei Pausen', () => {
      expect(notesOf(patternOf(emptyBeats(2), 'fill'))).toBe(2);
    });

    it('Halbe Pause in der unteren Stimme', () => {
      // oben 4 Viertel Snare, unten Halbe Pause + 2 Viertel Bassdrum
      const pattern = patternOf([
        { hits: { snare: [1] } },
        { hits: { snare: [1] } },
        { hits: { snare: [1], kick: [1] } },
        { hits: { snare: [1], kick: [1] } },
      ]);
      expect(notesOf(pattern)).toBe(4 + 3);
    });
  });

  describe('Spec drum-notation › Flam und Ghost Note (Renderer)', () => {
    const event = (...keys: [instrument: 'snare' | 'hihat', staffStep: number, articulation?: 'flam' | 'ghost'][]): NotationEvent => ({
      kind: 'note',
      duration: '8',
      keys: keys.map(([instrument, staffStep, articulation]) => ({
        instrument,
        staffStep,
        notehead: instrument === 'hihat' ? 'x' : 'normal',
        ...(articulation ? { articulation } : {}),
      })),
    });
    const modifiers = (note: ReturnType<typeof noteFor>, category: string) =>
      note.getModifiersByType(category).map((m) => m.checkIndex());

    it('Flam auf der Snare: ein durchgestrichener Vorschlag', () => {
      const note = noteFor(event(['snare', 5, 'flam']), 'up');
      const groups = note.getModifiersByType('GraceNoteGroup') as unknown as { getGraceNotes(): { slash: boolean; keys: string[] }[] }[];
      expect(groups).toHaveLength(1);
      const graces = groups[0]!.getGraceNotes();
      expect(graces).toHaveLength(1);
      expect(graces[0]!.slash).toBe(true);
      expect(graces[0]!.keys).toEqual([note.keys[0]]);
    });

    it('Flam im Akkord: Vorschlag nur für die Snare', () => {
      const note = noteFor(event(['snare', 5, 'flam'], ['hihat', 9]), 'up');
      const groups = note.getModifiersByType('GraceNoteGroup') as unknown as { getGraceNotes(): { keys: string[] }[] }[];
      expect(groups[0]!.getGraceNotes()[0]!.keys).toEqual([note.keys[0]]);
    });

    it('Ghost Note: Klammern nur um den Snare-Kopf', () => {
      expect(modifiers(noteFor(event(['snare', 5, 'ghost']), 'up'), 'Parenthesis')).toEqual([0, 0]);
      expect(modifiers(noteFor(event(['snare', 5, 'ghost'], ['hihat', 9]), 'up'), 'Parenthesis')).toEqual([0, 0]);
    });

    it('Flam: Bogen unter Vorschlag und Hauptnote', () => {
      const pattern = patternOf([{ hits: { snare: [1], hihat: [1] } }]);
      pattern.beats[0] = { ...pattern.beats[0]!, articulations: { snare: { 0: 'flam' } } };
      const container = document.createElement('div');
      renderNotation(toNotation(pattern), container);
      const ties = container.querySelectorAll('.vf-stavetie');
      expect(ties).toHaveLength(1);
      // Bogen unter den Köpfen: seine Kurve liegt unterhalb (größeres y) des Snare-Kopfs
      const snareY = Math.max(
        ...[...container.querySelectorAll('text')].filter((t) => t.textContent === '\u{E0A4}').map((t) => Number(t.getAttribute('y'))),
      );
      const ys = [...(ties[0]!.querySelector('path')!.getAttribute('d') ?? '').matchAll(/[\d.]+[ ,]([\d.]+)/g)].map((m) => Number(m[1]));
      expect(Math.max(...ys)).toBeGreaterThan(snareY);
    });

    it('Vorschlag steht dicht vor der Hauptnote', () => {
      const pattern = patternOf([{ hits: { snare: [1] } }]);
      pattern.beats[0] = { ...pattern.beats[0]!, articulations: { snare: { 0: 'flam' } } };
      const container = document.createElement('div');
      renderNotation(toNotation(pattern), container);
      // Schwarze Notenköpfe (SMuFL U+E0A4) der Snare: klein (Vorschlag) und normal
      const heads = [...container.querySelectorAll('text')]
        .filter((t) => t.textContent === '\u{E0A4}')
        .map((t) => Number(t.getAttribute('x')));
      const [grace, main] = heads.length === 2 ? heads.sort((a, b) => a - b) : [NaN, NaN];
      // VexFlow allein: 24 Einheiten; dicht heißt höchstens 16 (Kopf ca. 8 breit, Fähnchen frei von der Hauptnote)
      expect(main! - grace!).toBeLessThanOrEqual(16);
    });

    it('rendert Flam und Ghost Note ohne Fehler, nur in Textfarbe', () => {
      const pattern = {
        ...patternOf([{ hits: { snare: [1, 2], hihat: [1, 3] } }]),
      };
      pattern.beats[0] = { ...pattern.beats[0]!, articulations: { snare: { 0: 'flam', 1: 'ghost' } } };
      const container = document.createElement('div');
      renderNotation(toNotation(pattern), container);
      const colors = new Set(
        [...container.querySelectorAll('svg, svg *')].flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]),
      );
      expect([...colors].filter((c) => c !== null && c !== 'currentColor' && c !== 'none')).toEqual([]);
    });
  });

  it('ersetzt vorherigen Inhalt beim erneuten Rendern', () => {
    const container = document.createElement('div');
    renderNotation(toNotation(patternOf(emptyBeats(4))), container);
    renderNotation(toNotation(patternOf(emptyBeats(4))), container);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });
});
