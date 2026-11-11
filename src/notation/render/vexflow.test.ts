import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyBeats, patternOf } from '../../test/patterns';
import { toNotation } from '../model';
import type { NotationEvent } from '../model';
import { GraceNoteGroup } from 'vexflow';
import type { Beat } from '../../domain/types';
import { CARD_SCALE, CARD_TRIM_MARGIN, noteFor, renderNotation } from './vexflow';

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

  describe('Spec drum-notation › Zweiunddreißigstel (Renderer)', () => {
    it('Zweiunddreißigstel im Beat: ein dreifacher Balken nur über diesen Beat', () => {
      const pattern = patternOf([{ sub: 8, hits: { snare: [1, 2, 3, 4, 5, 6, 7, 8] } }, { hits: { snare: [1, 3] } }]);
      const container = document.createElement('div');
      renderNotation(toNotation(pattern), container);
      const beams = container.querySelectorAll('.vf-beam');
      expect(beams).toHaveLength(2);
      // Direkte path-Kinder sind die Balken; die Hälse liegen in eigenen Untergruppen
      expect(beams[0]!.querySelectorAll(':scope > path')).toHaveLength(3);
      expect(beams[1]!.querySelectorAll(':scope > path')).toHaveLength(1);
    });

    it('Zweiunddreißigsteltriole: dreifacher Balken und „12“ über der Gruppe', () => {
      const pattern = patternOf([{ sub: 12, hits: { snare: Array.from({ length: 12 }, (_, i) => i + 1) } }], 'fill');
      const container = document.createElement('div');
      renderNotation(toNotation(pattern), container);
      const beams = container.querySelectorAll('.vf-beam');
      expect(beams).toHaveLength(1);
      expect(beams[0]!.querySelectorAll(':scope > path')).toHaveLength(3);
      // Tuplet-Ziffern sind SMuFL-Zeichen: U+E880 + Ziffer
      const digits = [...container.querySelectorAll('.vf-tuplet text, .vf-tuplet')].map((t) => t.textContent).join('');
      expect(digits).toContain('\u{E881}\u{E882}');
    });

    it('Punkt an der punktierten Sechzehntel', () => {
      const note = noteFor({ kind: 'note', duration: '16d', keys: [{ instrument: 'snare', staffStep: 5, notehead: 'normal' }] }, 'up');
      expect(note.getModifiersByType('Dot')).toHaveLength(1);
    });

    it('Zweiunddreißigstelpause rendert ohne Fehler', () => {
      const pattern = patternOf([{ sub: 8, hits: { snare: [1, 4] } }]);
      const container = document.createElement('div');
      expect(() => renderNotation(toNotation(pattern), container)).not.toThrow();
    });
  });

  it('ersetzt vorherigen Inhalt beim erneuten Rendern', () => {
    const container = document.createElement('div');
    renderNotation(toNotation(patternOf(emptyBeats(4))), container);
    renderNotation(toNotation(patternOf(emptyBeats(4))), container);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });
});

describe('Spec drum-notation › Neue Spielweisen und Betonung (Renderer)', () => {
  const single = (keys: Partial<NotationEvent['keys'][number]>[]): NotationEvent =>
    ({ kind: 'note', duration: '8', keys: keys.map((k) => ({ instrument: 'snare', staffStep: 5, notehead: 'normal', ...k })) }) as NotationEvent;
  const graces = (event: NotationEvent) => {
    const groups = noteFor(event, 'up').getModifiersByType(GraceNoteGroup.CATEGORY) as GraceNoteGroup[];
    return groups.flatMap((g) => g.getGraceNotes().map((n) => n.getKeys()));
  };

  /** Rendert ein Pattern, dessen erster Beat die Felder `beat` trägt. */
  function render(hits: Parameters<typeof patternOf>[0], beat: Partial<Beat> = {}, options = {}) {
    const pattern = patternOf(hits);
    pattern.beats[0] = { ...pattern.beats[0]!, ...beat };
    const container = document.createElement('div');
    renderNotation(toNotation(pattern), container, options);
    return container;
  }
  /** x- und y-Lage jedes `>` aus seinem Pfad. */
  const marks = (container: HTMLElement) =>
    [...container.querySelectorAll('.vf-emphasis path')].map((path) => {
      const numbers = [...(path.getAttribute('d') ?? '').matchAll(/-?[\d.]+/g)].map((m) => Number(m[0]));
      return { x: numbers[0]!, y: numbers[1]! };
    });

  it('Rim Shot: durchgestrichener Notenkopf, nur für die Snare', () => {
    const note = noteFor(single([{ articulation: 'rim' }, { instrument: 'hihat', staffStep: 9, notehead: 'x' }]), 'up');
    expect(note.getKeys()).toEqual(['c/5/sf', 'g/5/x2']);
  });

  it('Cross-Stick: x-Notenkopf auf der Snare-Position', () => {
    expect(noteFor(single([{ articulation: 'cross' }]), 'up').getKeys()).toEqual(['c/5/x2']);
  });

  it('Ride-Glocke: Raute auf Linie 5', () => {
    expect(noteFor(single([{ instrument: 'ride', staffStep: 8, notehead: 'x', articulation: 'bell' }]), 'up').getKeys()).toEqual(['f/5/d2']);
  });

  it('Drag: zwei Vorschläge auf derselben Position', () => {
    expect(graces(single([{ articulation: 'drag' }]))).toEqual([['c/5'], ['c/5']]);
  });

  it('Drag im Akkord: Vorschläge nur für die Snare', () => {
    expect(graces(single([{ articulation: 'drag' }, { instrument: 'hihat', staffStep: 9, notehead: 'x' }]))).toEqual([['c/5'], ['c/5']]);
  });

  it('Flam und Drag am selben Hals: Flam nur im zweiten Vorschlag', () => {
    expect(graces(single([{ instrument: 'floorTom', staffStep: 3, articulation: 'flam' }, { articulation: 'drag' }]))).toEqual([['c/5'], ['a/4', 'c/5']]);
  });

  it('Drag: Bogen unter den Notenköpfen', () => {
    const container = render([{ hits: { snare: [1] } }], { articulations: { snare: { 0: 'drag' } } });
    expect(container.querySelectorAll('.vf-stavetie')).toHaveLength(1);
  });

  it('Choke: Punkt über dem Crash-Notenkopf', () => {
    const container = render([{ hits: { crash: [1] } }], { articulations: { crash: { 0: 'choke' } } });
    expect(container.querySelectorAll('.vf-choke')).toHaveLength(1);
  });

  it('Normaler Crash und unbetonter Schlag haben keine Zeichen', () => {
    const container = render([{ hits: { crash: [1], snare: [1] } }]);
    expect(container.querySelectorAll('.vf-choke, .vf-emphasis')).toHaveLength(0);
  });

  it('Betonte Snare im Akkord: ein > über der Spalte', () => {
    const container = render([{ hits: { hihat: [1], snare: [1] } }], { emphasis: { snare: [0] } });
    expect(marks(container)).toHaveLength(1);
  });

  it('Nur die Bassdrum betont: > oberhalb des Systems', () => {
    const [mark] = marks(render([{ hits: { kick: [1] } }], { emphasis: { kick: [0] } }));
    // Oberste Linie: Zeilenanfang 40 plus Rand von 40 über dem System
    expect(mark!.y).toBeLessThan(80);
  });

  it('Hände und Füße betont: genau ein > je Spalte', () => {
    const container = render([{ hits: { hihat: [1], kick: [1] } }], { emphasis: { hihat: [0], kick: [0] } });
    expect(marks(container)).toHaveLength(1);
  });

  it('Einheitliche Höhe über Balken und Viertelnote', () => {
    const pattern = patternOf([{ hits: { hihat: [1, 3] } }, { sub: 2, hits: { snare: [1] } }]);
    pattern.beats[0] = { ...pattern.beats[0]!, emphasis: { hihat: [0, 2] } };
    pattern.beats[1] = { ...pattern.beats[1]!, emphasis: { snare: [0] } };
    const both = document.createElement('div');
    renderNotation(toNotation(pattern), both);
    expect(new Set(marks(both).map((m) => m.y)).size).toBe(1);
    expect(marks(both)).toHaveLength(3);
  });

  it('Offene Hi-Hat: > liegt höher als ohne „o“', () => {
    const open = marks(render([{ hits: { hihatOpen: [1] } }], { emphasis: { hihatOpen: [0] } }))[0]!;
    const closed = marks(render([{ hits: { hihat: [1] } }], { emphasis: { hihat: [0] } }))[0]!;
    expect(open.y).toBeLessThan(closed.y);
  });

  it('Das Bild wächst nach oben, wenn das > über den Rand ragt', () => {
    const pattern = patternOf([{ sub: 3, hits: { crash: [1], hihatOpen: [2] } }]);
    pattern.beats[0] = { ...pattern.beats[0]!, emphasis: { crash: [0] } };
    const container = document.createElement('div');
    renderNotation(toNotation(pattern), container);
    const [mark] = marks(container);
    expect(mark!.y).toBeLessThan(6);
    const [, top, , height] = container.querySelector('svg')!.getAttribute('viewBox')!.split(' ').map(Number);
    expect(top!).toBeLessThanOrEqual(mark!.y - 3);
    expect(Number(container.querySelector('svg')!.getAttribute('height'))).toBeCloseTo(height!, 6);
  });

  it('Mini-Darstellung hält die Betonung im festen Bild, die Karte zeichnet sie', () => {
    const [compact] = marks(render([{ hits: { hihat: [1], snare: [1] } }], { emphasis: { snare: [0] } }, { compact: true }));
    expect(compact!.y).toBeGreaterThanOrEqual(0);
    expect(marks(render([{ hits: { hihat: [1], snare: [1] } }], { emphasis: { snare: [0] } }, { card: true }))).toHaveLength(1);
  });

  it('Zeichen nur in Textfarbe', () => {
    const container = render([{ hits: { crash: [1], hihat: [1] } }], { articulations: { crash: { 0: 'choke' } }, emphasis: { hihat: [0] } });
    const colors = new Set([...container.querySelectorAll('svg, svg *')].flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]));
    expect([...colors].filter((c) => c !== null && c !== 'currentColor' && c !== 'none')).toEqual([]);
  });
});

describe('Spec songbook-view › Höhe des Notenbilds der Pattern-Karte', () => {
  // Wie im Browser: getBBox eines <text> ist der Schriftkasten (160 Einheiten), weit über und unter dem Zeichen
  const FONT_BOX = { above: 80, below: 80 };
  const INK = { ascent: 5, descent: 3 };
  let pathBox: (path: Element, index: number) => { y: number; height: number };

  beforeEach(() => {
    pathBox = () => ({ y: 50, height: 40 });
    const proto = SVGElement.prototype as unknown as { getBBox?: () => DOMRect };
    proto.getBBox = function (this: SVGElement) {
      const box = (y: number, height: number) => ({ x: 0, y, width: 10, height }) as DOMRect;
      if (this.tagName === 'text') {
        const y = Number(this.getAttribute('y'));
        return box(y - FONT_BOX.above, FONT_BOX.above + FONT_BOX.below);
      }
      if (this.tagName === 'path') {
        const paths = [...this.ownerSVGElement!.querySelectorAll('path')];
        const { y, height } = pathBox(this, paths.indexOf(this as SVGPathElement));
        return box(y, height);
      }
      if (this.tagName === 'rect') return { x: 0, y: 0, width: 0, height: 0 } as DOMRect;
      // svg und g: Vereinigung der enthaltenen Elemente, wie im Browser
      const boxes = [...this.querySelectorAll('path, text')].map((e) => (e as unknown as { getBBox: () => DOMRect }).getBBox());
      const top = Math.min(...boxes.map((b) => b.y));
      return box(top, Math.max(...boxes.map((b) => b.y + b.height)) - top);
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          font: '',
          measureText: () => ({ width: 10, actualBoundingBoxAscent: INK.ascent, actualBoundingBoxDescent: INK.descent }),
        }) as unknown as CanvasRenderingContext2D,
    );
  });

  afterEach(() => {
    delete (SVGElement.prototype as unknown as { getBBox?: unknown }).getBBox;
    vi.restoreAllMocks();
  });

  const card = (pattern: ReturnType<typeof patternOf>) => {
    const container = document.createElement('div');
    renderNotation(toNotation(pattern), container, { card: true });
    const svg = container.querySelector('svg')!;
    const [, y, , height] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    return { svg, top: y!, bottom: y! + height! };
  };

  it('Balken unter dem System: vollständig in der viewBox, auch unterhalb der Zeilenhöhe', () => {
    // Ein Balken reicht bis 170, unter die Zeilenhöhe der Karte (130)
    pathBox = (_, index) => (index === 0 ? { y: 150, height: 20 } : { y: 50, height: 40 });
    const pattern = patternOf([{ hits: { kick: [1, 2, 3, 4] } }, { hits: { kick: [1, 2, 3, 4] } }]);
    const { bottom } = card(pattern);
    expect(bottom).toBe(170 + CARD_TRIM_MARGIN);
  });

  it('Triolenklammer oben: Oberkante aus der Tinte der Zeichen, nicht aus dem Schriftkasten', () => {
    const pattern = patternOf([{ sub: 6, hits: { snare: [1, 2], tom1: [3, 4, 5, 6] } }], 'fill');
    const { svg, top } = card(pattern);
    const inkTop = Math.min(50, ...[...svg.querySelectorAll('text')].map((t) => Number(t.getAttribute('y')) - INK.ascent));
    expect(top).toBe(inkTop - CARD_TRIM_MARGIN);
  });
});
