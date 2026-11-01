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

const BEAT_WIDTH = 72;
const CLEF_WIDTH = 40;
const STAVE_PADDING = 30;
const STAVE_HEIGHT = 210;
const STAVE_TOP = 40;
const MARGIN = 10;

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

function buildMeasure(measure: Measure): BuiltMeasure {
  const up = buildVoice(measure.voices.up, 'up', measure.beatCount);
  const down = buildVoice(measure.voices.down, 'down', measure.beatCount);
  const formatter = new Formatter().joinVoices([up.voice, down.voice]);
  // Dichte Beats (Sechzehntel, Sextolen) brauchen mehr als die Grundbreite
  const minWidth = formatter.preCalculateMinTotalWidth([up.voice, down.voice]);
  return { up, down, formatter, contentWidth: Math.max(measure.beatCount * BEAT_WIDTH, minWidth * 1.4) };
}

const staveWidth = (built: BuiltMeasure, withClef: boolean) =>
  built.contentWidth + (withClef ? CLEF_WIDTH : 0) + STAVE_PADDING;

/** Zeichnet das Notationsmodell als SVG in den Container (vorheriger Inhalt wird ersetzt). */
export function renderNotation(model: NotationModel, container: HTMLElement, maxWidth = 900): void {
  container.innerHTML = '';
  const built = model.measures.map(buildMeasure);

  // Takte zeilenweise umbrechen
  const rows: BuiltMeasure[][] = [];
  let rowWidth = 0;
  for (const measure of built) {
    if (rows.length === 0 || rowWidth + staveWidth(measure, false) > maxWidth - 2 * MARGIN) {
      rows.push([]);
      rowWidth = 0;
    }
    rowWidth += staveWidth(measure, rowWidth === 0);
    rows[rows.length - 1]!.push(measure);
  }

  const totalWidth = Math.max(
    ...rows.map((row) => row.reduce((sum, m, i) => sum + staveWidth(m, i === 0), 0) + 2 * MARGIN),
  );
  const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG);
  renderer.resize(totalWidth, rows.length * STAVE_HEIGHT);
  const context = renderer.getContext();

  rows.forEach((row, rowIndex) => {
    let x = MARGIN;
    row.forEach((measure, i) => {
      const width = staveWidth(measure, i === 0);
      const stave = new Stave(x, rowIndex * STAVE_HEIGHT + STAVE_TOP, width);
      if (i === 0) stave.addClef('percussion');
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
