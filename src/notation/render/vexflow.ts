import { Annotation, Beam, Dot, Formatter, Renderer, Stave, StaveNote, Tuplet, Voice } from 'vexflow';
import type { BeatGroup, Measure, NotationEvent, NotationModel, VoiceName } from '../model';

// Systemschritt 0 = Linie 1 = e/4 (Percussion-Schlüssel wie Violinschlüssel)
const STEP_NAMES = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
function pitchOf(staffStep: number): string {
  const diatonic = staffStep + 2 + 4 * 7; // e/4 relativ zu c/0
  return `${STEP_NAMES[diatonic % 7]}/${Math.floor(diatonic / 7)}`;
}

const REST_KEY: Record<VoiceName, string> = { up: 'c/5', down: 'f/4' };
const STEM: Record<VoiceName, number> = { up: 1, down: -1 };

const CLEF_WIDTH = 40;
const INK = 'currentColor';

/** Maße in SVG-Einheiten; die Mini-Darstellung spart Ränder, damit sie beim Skalieren groß bleibt. */
interface Sizing {
  beatWidth: number;
  /** Zuschlag auf die Mindestbreite des Formatters. */
  spread: number;
  stavePadding: number;
  margin: number;
  rowHeight: number;
  rowTop: number;
}

const NORMAL: Sizing = { beatWidth: 72, spread: 1.4, stavePadding: 30, margin: 10, rowHeight: 210, rowTop: 40 };
const COMPACT: Sizing = { beatWidth: 36, spread: 1.1, stavePadding: 12, margin: 2, rowHeight: 115, rowTop: 12 };

function noteFor(event: NotationEvent, voice: VoiceName): StaveNote {
  const isRest = event.kind === 'rest';
  const keys = isRest
    ? [REST_KEY[voice]]
    : event.keys.map((k) => `${pitchOf(k.staffStep)}${k.notehead === 'x' ? '/x2' : ''}`);
  const note = new StaveNote({
    keys,
    duration: `${event.duration}${isRest ? 'r' : ''}`,
    clef: 'percussion',
    stemDirection: STEM[voice],
  });
  note.setStemStyle({ strokeStyle: INK });
  if (event.duration === '8d') Dot.buildAndAttach([note], { all: true });
  if (event.keys.some((k) => k.open)) {
    note.addModifier(new Annotation('o').setVerticalJustification(Annotation.VerticalJustify.TOP), 0);
  }
  return note;
}

interface BuiltVoice {
  voice: Voice;
  beams: Beam[];
  tuplets: Tuplet[];
}

function buildVoice(groups: BeatGroup[], name: VoiceName, beatCount: number): BuiltVoice {
  const notes: StaveNote[] = [];
  const beams: Beam[] = [];
  const tuplets: Tuplet[] = [];
  for (const group of groups) {
    const groupNotes = group.events.map((e) => noteFor(e, name));
    if (group.tuplet) {
      tuplets.push(
        new Tuplet(groupNotes, {
          numNotes: group.tuplet,
          notesOccupied: group.tuplet === 3 ? 2 : 4,
          location: name === 'up' ? 1 : -1,
          bracketed: true,
          ratioed: false,
        }),
      );
    }
    if (group.beamed) {
      beams.push(new Beam(groupNotes.filter((_, i) => group.events[i]!.kind === 'note' && group.events[i]!.duration !== 'q')));
    }
    notes.push(...groupNotes);
  }
  const voice = new Voice({ numBeats: beatCount, beatValue: 4 }).addTickables(notes);
  return { voice, beams, tuplets };
}

interface BuiltMeasure {
  up: BuiltVoice;
  down: BuiltVoice;
  formatter: Formatter;
  /** Breite der Noten ohne Schlüssel und Ränder. */
  contentWidth: number;
}

function buildMeasure(measure: Measure, sizing: Sizing): BuiltMeasure {
  const up = buildVoice(measure.voices.up, 'up', measure.beatCount);
  const down = buildVoice(measure.voices.down, 'down', measure.beatCount);
  const formatter = new Formatter().joinVoices([up.voice, down.voice]);
  // Dichte Beats (Sechzehntel, Sextolen) brauchen mehr als die Grundbreite
  const minWidth = formatter.preCalculateMinTotalWidth([up.voice, down.voice]);
  return {
    up,
    down,
    formatter,
    contentWidth: Math.max(measure.beatCount * sizing.beatWidth, minWidth * sizing.spread),
  };
}

const staveWidth = (built: BuiltMeasure, withClef: boolean, sizing: Sizing) =>
  built.contentWidth + (withClef ? CLEF_WIDTH : 0) + sizing.stavePadding;

export interface RenderOptions {
  /** Maximale Zeilenbreite in px, danach Umbruch (nicht im Kompaktmodus). */
  maxWidth?: number;
  /**
   * Mini-Darstellung für Fill-Blöcke (design.md D4): kein Schlüssel, eine Zeile, und das SVG
   * skaliert über seine viewBox auf die Breite des Containers.
   */
  compact?: boolean;
}

/** Zeichnet das Notationsmodell als SVG in den Container (vorheriger Inhalt wird ersetzt). */
export function renderNotation(model: NotationModel, container: HTMLElement, options: RenderOptions = {}): void {
  const { maxWidth = 900, compact = false } = options;
  container.innerHTML = '';
  const sizing = compact ? COMPACT : NORMAL;
  const { margin, rowHeight, rowTop } = sizing;
  const built = model.measures.map((m) => buildMeasure(m, sizing));
  const withClef = (i: number) => !compact && i === 0;

  // Takte zeilenweise umbrechen (kompakt: alles in einer Zeile)
  const rows: BuiltMeasure[][] = [];
  let rowWidth = 0;
  for (const measure of built) {
    if (rows.length === 0 || (!compact && rowWidth + staveWidth(measure, false, sizing) > maxWidth - 2 * margin)) {
      rows.push([]);
      rowWidth = 0;
    }
    rowWidth += staveWidth(measure, withClef(rows[rows.length - 1]!.length), sizing);
    rows[rows.length - 1]!.push(measure);
  }

  const totalWidth = Math.max(
    ...rows.map((row) => row.reduce((sum, m, i) => sum + staveWidth(m, withClef(i), sizing), 0) + 2 * margin),
  );
  const totalHeight = rows.length * rowHeight;
  const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG);
  renderer.resize(totalWidth, totalHeight);
  const context = renderer.getContext();
  // Alles in der Textfarbe der Umgebung zeichnen (Farbschema hell/dunkel)
  context.setFillStyle(INK).setStrokeStyle(INK);
  const svg = container.querySelector('svg');
  svg?.setAttribute('fill', INK);
  svg?.setAttribute('stroke', INK);
  if (compact && svg) {
    svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    // renderer.resize setzt zusätzlich feste Inline-Maße, die die viewBox-Skalierung aushebeln
    svg.style.width = '100%';
    svg.style.height = '100%';
  }

  rows.forEach((row, rowIndex) => {
    let x = margin;
    row.forEach((measure, i) => {
      const width = staveWidth(measure, withClef(i), sizing);
      const stave = new Stave(x, rowIndex * rowHeight + rowTop, width);
      if (withClef(i)) stave.addClef('percussion');
      stave.setStyle({ fillStyle: INK, strokeStyle: INK });
      stave.setDefaultLedgerLineStyle({ strokeStyle: INK, lineWidth: 2 });
      stave.setContext(context).draw();

      const { up, down, formatter } = measure;
      formatter.formatToStave([up.voice, down.voice], stave);
      for (const built of [up, down]) {
        built.voice.draw(context, stave);
        built.beams.forEach((beam) => beam.setContext(context).draw());
        built.tuplets.forEach((tuplet) => tuplet.setContext(context).draw());
      }
      x += width;
    });
  });
}
