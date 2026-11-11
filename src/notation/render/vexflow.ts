import {
  Annotation,
  Beam,
  Dot,
  Formatter,
  GhostNote,
  GraceNote,
  GraceNoteGroup,
  ModifierPosition,
  Parenthesis,
  Renderer,
  type RenderContext,
  Stave,
  StaveNote,
  Tuplet,
  Voice,
} from 'vexflow';
import type { Articulation } from '../../domain/types';
import type { BeatGroup, Measure, NotationEvent, NotationModel, NoteKey, VoiceName } from '../model';

// Systemschritt 0 = Linie 1 = e/4 (Percussion-Schlüssel wie Violinschlüssel)
const STEP_NAMES = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
function pitchOf(staffStep: number): string {
  const diatonic = staffStep + 2 + 4 * 7; // e/4 relativ zu c/0
  return `${STEP_NAMES[diatonic % 7]}/${Math.floor(diatonic / 7)}`;
}

const REST_KEY: Record<VoiceName, string> = { up: 'c/5', down: 'f/4' };
/** Die Ganze Pause hängt an der vierten Linie (rest-voices D3). */
const WHOLE_REST_KEY = 'd/5';
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
/** Patternkarten: Maße wie NORMAL, aber engere Notenzeilen; Höhe wird nach dem Zeichnen zugeschnitten. */
const CARD: Sizing = { ...NORMAL, rowHeight: 130, rowTop: 10 };

/** Pixel pro SVG-Einheit in den Patternkarten, für alle Karten gleich (gleicher Maßstab). */
export const CARD_SCALE = 0.55;
/** Rand um das zugeschnittene Notenbild der Karten, in SVG-Einheiten. */
export const CARD_TRIM_MARGIN = 4;

/** Notenköpfe, die eine Spielweise vorgibt. */
const ARTICULATION_HEADS: Partial<Record<Articulation, string>> = { rim: 'sf', cross: 'x2', bell: 'd2' };

const vexKey = (k: NoteKey) => {
  const head = (k.articulation && ARTICULATION_HEADS[k.articulation]) ?? (k.notehead === 'x' ? 'x2' : '');
  return `${pitchOf(k.staffStep)}${head ? `/${head}` : ''}`;
};

/** Exportiert für Tests der Spielweisen (Modifier lassen sich im SVG nicht stabil prüfen). */
export function noteFor(event: NotationEvent, voice: VoiceName): StaveNote {
  const isRest = event.kind === 'rest';
  const keys = isRest ? [event.duration === 'w' ? WHOLE_REST_KEY : REST_KEY[voice]] : event.keys.map(vexKey);
  const note = new StaveNote({
    keys,
    duration: `${event.duration}${isRest ? 'r' : ''}`,
    clef: 'percussion',
    stemDirection: STEM[voice],
  });
  note.setStemStyle({ strokeStyle: INK });
  if (event.duration.endsWith('d')) Dot.buildAndAttach([note], { all: true });
  // Ganze Pause eines leeren Takts mittig im Takt
  if (isRest && event.duration === 'w') note.setCenterAlignment(true);
  if (event.keys.some((k) => k.open)) {
    note.addModifier(new Annotation('o').setVerticalJustification(Annotation.VerticalJustify.TOP), 0);
  }
  addArticulations(note, event, voice);
  return note;
}

/**
 * VexFlow setzt Vorschläge an den linken Rand des für sie reservierten Platzes, ein gutes Stück vor die
 * Hauptnote. Für Flams rückt der Vorschlag dicht an die Hauptnote (hit-articulations D4); der reservierte
 * Platz davor bleibt und hält Abstand zur vorigen Note.
 */
const GRACE_NUDGE = 8;

function tightenGraceNotes(voice: Voice): void {
  for (const tickable of voice.getTickables()) {
    if (!(tickable instanceof StaveNote)) continue;
    for (const group of tickable.getModifiersByType(GraceNoteGroup.CATEGORY)) {
      group.setSpacingFromNextModifier(group.getSpacingFromNextModifier() + GRACE_NUDGE);
    }
  }
}

/**
 * Ghost Note als Notenkopf in Klammern, Flam als durchgestrichener Vorschlag, Drag als zwei Vorschläge,
 * jeweils nur für die betroffenen Köpfe. Am selben Hals trägt der zweite Vorschlag eines Drags auch die Flams.
 */
function addArticulations(note: StaveNote, event: NotationEvent, voice: VoiceName): void {
  event.keys.forEach((k, index) => {
    if (k.articulation !== 'ghost') return;
    note.addModifier(new Parenthesis(ModifierPosition.LEFT), index);
    note.addModifier(new Parenthesis(ModifierPosition.RIGHT), index);
  });
  const flams = event.keys.filter((k) => k.articulation === 'flam');
  const drags = event.keys.filter((k) => k.articulation === 'drag');
  if (flams.length + drags.length === 0) return;
  const graceNote = (keys: NoteKey[], duration: string, slash: boolean) => {
    const grace = new GraceNote({ keys: keys.map(vexKey), duration, slash, clef: 'percussion', stemDirection: STEM[voice] });
    grace.setStyle({ fillStyle: INK, strokeStyle: INK });
    grace.setStemStyle({ strokeStyle: INK });
    return grace;
  };
  if (drags.length === 0) {
    note.addModifier(new GraceNoteGroup([graceNote(flams, '8', true)], true), 0); // mit Bogen unter beiden Köpfen
    return;
  }
  const last = event.keys.filter((k) => k.articulation === 'flam' || k.articulation === 'drag');
  note.addModifier(new GraceNoteGroup([graceNote(drags, '16', false), graceNote(last, '16', false)], true).beamNotes(), 0);
}

interface BuiltVoice {
  voice: Voice;
  beams: Beam[];
  tuplets: Tuplet[];
  /** Noten mit ihren Ereignissen, für Betonung und Choke. */
  placed: { note: StaveNote; keys: NoteKey[] }[];
}

function buildVoice(groups: BeatGroup[], name: VoiceName, beatCount: number): BuiltVoice {
  const notes: StaveNote[] = [];
  const beams: Beam[] = [];
  const tuplets: Tuplet[] = [];
  const placed: BuiltVoice['placed'] = [];
  for (const group of groups) {
    const groupNotes = group.events.map((e) => noteFor(e, name));
    group.events.forEach((e, i) => {
      if (e.kind === 'note') placed.push({ note: groupNotes[i]!, keys: e.keys });
    });
    if (group.tuplet) {
      tuplets.push(
        new Tuplet(groupNotes, {
          numNotes: group.tuplet,
          // Triolen: drei im Raum von zwei (3 → 2, 6 → 4, 12 → 8)
          notesOccupied: (group.tuplet * 2) / 3,
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
  // Stimme ohne sichtbare Events im Takt: unsichtbar auffüllen, VexFlow verlangt volle Stimmen (rest-voices D2)
  const tickables = notes.length > 0 ? notes : Array.from({ length: beatCount }, () => new GhostNote({ duration: 'q' }));
  const voice = new Voice({ numBeats: beatCount, beatValue: 4 }).addTickables(tickables);
  return { voice, beams, tuplets, placed };
}

/** Abstand des `>` über dem höchsten Punkt der Zeile; Platz für „o“ und Triolenklammern; Rand des Bildes über dem `>`. */
const EMPHASIS_GAP = 10;
const OPEN_MARK_SPACE = 16;
const TUPLET_SPACE = 18;
const EMPHASIS_MARGIN = 6;
const CHOKE_GAP = 9;

const headCenter = (note: StaveNote) => (note.getNoteHeadBeginX() + note.getNoteHeadEndX()) / 2;

/**
 * Betonung und Choke einer Notenzeile (hit-types, design.md D7): nach dem Zeichnen, denn erst dann stehen
 * die Halsenden unter den Balken fest. Ein `>` je Spalte, alle auf derselben Höhe. `minY` begrenzt die Höhe.
 * Liefert die oberste Kante der Zeichen, falls es welche gibt.
 */
function drawMarks(context: RenderContext, row: readonly BuiltMeasure[], staveTop: number, minY: number): number | undefined {
  const up = row.flatMap((m) => m.up.placed);
  const down = row.flatMap((m) => m.down.placed);
  let top = staveTop;
  for (const { note } of up) top = Math.min(top, note.getStemExtents().topY);
  if (up.some(({ keys }) => keys.some((k) => k.open))) top -= OPEN_MARK_SPACE;
  if (row.some((m) => m.up.tuplets.length > 0)) top -= TUPLET_SPACE;
  const y = Math.max(minY, top - EMPHASIS_GAP);

  context.save();
  context.setLineWidth(1.4);
  const columns = new Map<unknown, StaveNote>();
  for (const { note, keys } of [...up, ...down]) {
    const column = note.getTickContext();
    if (keys.some((k) => k.emphasis) && !columns.has(column)) columns.set(column, note);
  }
  for (const note of columns.values()) {
    const x = headCenter(note);
    context.openGroup('emphasis');
    context.beginPath();
    context.moveTo(x - 5, y - 3);
    context.lineTo(x + 5, y);
    context.lineTo(x - 5, y + 3);
    context.stroke();
    context.closeGroup();
  }
  for (const { note, keys } of up) {
    keys.forEach((k, index) => {
      if (k.articulation !== 'choke') return;
      context.openGroup('choke');
      context.beginPath();
      context.arc(headCenter(note), note.getYs()[index]! - CHOKE_GAP, 1.8, 0, 2 * Math.PI, false);
      context.fill();
      context.closeGroup();
    });
  }
  context.restore();
  return columns.size > 0 ? y - 3 : undefined;
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
  /**
   * Patternkarten (compact-pattern-page D1/D2): mit Schlüssel und Umbruch, feste Skalierung
   * CARD_SCALE, Höhe auf das Notenbild zugeschnitten. `compact` hat Vorrang.
   */
  card?: boolean;
}

/** Breite einer Notenzeile in SVG-Einheiten: Takte mit Schlüssel am ersten (nicht kompakt) plus Rand. */
const lineWidth = (row: readonly BuiltMeasure[], sizing: Sizing, clef: boolean) =>
  row.reduce((sum, m, i) => sum + staveWidth(m, clef && i === 0, sizing), 0) + 2 * sizing.margin;

/** Zeichnet das Notationsmodell als SVG in den Container (vorheriger Inhalt wird ersetzt). */
export function renderNotation(model: NotationModel, container: HTMLElement, options: RenderOptions = {}): void {
  const { maxWidth = 900, compact = false } = options;
  const card = !compact && options.card === true;
  container.innerHTML = '';
  const sizing = compact ? COMPACT : card ? CARD : NORMAL;
  // Umbruchgrenze in SVG-Einheiten
  const rowLimit = card ? maxWidth / CARD_SCALE : maxWidth;
  const { margin, rowHeight, rowTop } = sizing;
  const built = model.measures.map((m) => buildMeasure(m, sizing));
  const withClef = (i: number) => !compact && i === 0;

  // Takte zeilenweise umbrechen (kompakt: alles in einer Zeile)
  const rows: BuiltMeasure[][] = [];
  let rowWidth = 0;
  for (const measure of built) {
    if (rows.length === 0 || (!compact && rowWidth + staveWidth(measure, false, sizing) > rowLimit - 2 * margin)) {
      rows.push([]);
      rowWidth = 0;
    }
    rowWidth += staveWidth(measure, withClef(rows[rows.length - 1]!.length), sizing);
    rows[rows.length - 1]!.push(measure);
  }

  const totalWidth = Math.max(...rows.map((row) => lineWidth(row, sizing, !compact)));
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

  let marksTop = Infinity;
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
      for (const built of [up, down]) tightenGraceNotes(built.voice);
      for (const built of [up, down]) {
        built.voice.draw(context, stave);
        built.beams.forEach((beam) => beam.setContext(context).draw());
        built.tuplets.forEach((tuplet) => tuplet.setContext(context).draw());
      }
      x += width;
    });
    // Die erste Zeile darf über das Bild hinaus, das wächst dann nach oben; spätere bleiben unter ihrer Vorgängerin
    const minY = compact || rowIndex > 0 ? rowIndex * rowHeight + EMPHASIS_MARGIN : -Infinity;
    const top = drawMarks(context, row, new Stave(margin, rowIndex * rowHeight + rowTop, 0).getYForLine(0), minY);
    if (rowIndex === 0 && top !== undefined) marksTop = top;
  });

  if (!compact && !card && svg && marksTop < EMPHASIS_MARGIN) {
    const extra = EMPHASIS_MARGIN - marksTop;
    svg.setAttribute('viewBox', `0 ${-extra} ${totalWidth} ${totalHeight + extra}`);
    svg.setAttribute('height', String(totalHeight + extra));
    svg.style.height = `${totalHeight + extra}px`;
  }

  if (card && svg) fitCard(svg, totalWidth, totalHeight);
}

/**
 * Ober- und Unterkante der sichtbaren Zeichen. VexFlow zeichnet Notenköpfe, Schlüssel und Ziffern als <text>
 * in der Notenschrift; deren getBBox ist der Schriftkasten, daher die Tinte aus measureText (design.md D3).
 * `pending` sammelt Schriften, die noch laden. Ohne getBBox oder Canvas (jsdom): undefined.
 */
function inkExtent(svg: SVGSVGElement, pending: Set<string>): { top: number; bottom: number } | undefined {
  if (typeof svg.getBBox !== 'function') return undefined;
  const canvas = document.createElement('canvas').getContext('2d');
  if (!canvas) return undefined;
  let top = Infinity;
  let bottom = -Infinity;
  for (const element of svg.querySelectorAll<SVGGraphicsElement>('path, rect, text')) {
    if (element.tagName === 'text') {
      const text = element.textContent ?? '';
      if (!text) continue;
      const font = getComputedStyle(element).font;
      if (font && document.fonts?.check(font, text) === false) pending.add(font);
      canvas.font = font;
      const metrics = canvas.measureText(text);
      const baseline = Number(element.getAttribute('y'));
      top = Math.min(top, baseline - metrics.actualBoundingBoxAscent);
      bottom = Math.max(bottom, baseline + metrics.actualBoundingBoxDescent);
    } else {
      const box = element.getBBox();
      if (box.width === 0 && box.height === 0) continue;
      top = Math.min(top, box.y);
      bottom = Math.max(bottom, box.y + box.height);
    }
  }
  return bottom > top ? { top, bottom } : undefined;
}

/**
 * Skaliert das Karten-SVG mit CARD_SCALE und schneidet die Höhe auf die sichtbaren Zeichen zu, auch über
 * `totalHeight` hinaus (ohne Messung: volle Höhe). Lädt die Notenschrift noch, folgt ein zweiter Zuschnitt.
 */
function fitCard(svg: SVGSVGElement, totalWidth: number, totalHeight: number): void {
  const pending = new Set<string>();
  const ink = inkExtent(svg, pending);
  const top = ink ? ink.top - CARD_TRIM_MARGIN : 0;
  const height = ink ? ink.bottom + CARD_TRIM_MARGIN - top : totalHeight;
  if (pending.size > 0) {
    void Promise.all([...pending].map((font) => document.fonts.load(font))).then(() => {
      if (svg.isConnected) fitCard(svg, totalWidth, totalHeight);
    });
  }
  svg.setAttribute('viewBox', `0 ${top} ${totalWidth} ${height}`);
  svg.setAttribute('width', String(totalWidth * CARD_SCALE));
  svg.setAttribute('height', String(height * CARD_SCALE));
  // Feste Inline-Maße von renderer.resize ersetzen; die Höhe folgt per CSS (height: auto) der viewBox,
  // damit ein zu breiter Takt mit max-width proportional schrumpft
  svg.style.width = `${totalWidth * CARD_SCALE}px`;
  svg.style.height = '';
}
