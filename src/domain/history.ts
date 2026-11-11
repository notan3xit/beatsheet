import { normalizeSong } from './normalize';
import { articulationAt, emphasisAt } from './sequencer';
import { removePattern } from './songPatterns';
import { DEFAULT_METER, type Instrument, type Pattern, type PatternColor, type Song } from './types';

/** Gegenstand einer Änderung (song-history): Song-Daten, Struktur oder ein Pattern. */
export type Subject = 'song' | 'structure' | `pattern:${string}`;

export const patternSubject = (id: string): Subject => `pattern:${id}`;

/** Pattern-ID eines Gegenstands, sonst `null`. */
export const patternIdOf = (subject: Subject): string | null => (subject.startsWith('pattern:') ? subject.slice(8) : null);

/** Eine Änderung der Historie, ohne Bezug zum Speicherformat. */
export interface Step {
  /** Unixzeit in Sekunden. */
  time: number;
  author: string | null;
  /** Bei einer Wiederherstellung die Zeit des Zielstands. */
  restore?: number;
  subject: Subject;
}

export interface HistoryInput {
  steps: readonly Step[];
  /** Stand nach dem Schritt `index`; `null` vor dem ersten. */
  songAt(index: number): Song | null;
}

/** Aufeinanderfolgende Schritte desselben Autors am selben Gegenstand am selben Tag (design.md D5). */
export interface Edit {
  subject: Subject;
  author: string | null;
  /** Erster und letzter Schritt. */
  first: number;
  last: number;
  /** Schritt, nach dem der Vergleichsstand „vorher“ gilt; -1 vor dem ersten. */
  from: number;
  /** Leere Neuanlage, die mit dieser Bearbeitung zusammengefasst ist. */
  created?: boolean;
  restore?: number;
}

/** Kalendertag in Ortszeit. */
export function localDay(time: number): string {
  const date = new Date(time * 1000);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

const findPattern = (song: Song | null, id: string) => song?.patterns.find((p) => p.id === id);
const hasHits = (pattern: Pattern) => pattern.beats.some((beat) => Object.values(beat.hits).some((hits) => hits.length > 0));
/** Inhalt eines Patterns ohne Änderungsmetadaten. */
const contentOf = ({ revision: _r, updatedAt: _u, createdAt: _c, ...rest }: Pattern) => JSON.stringify(rest);

/** Bearbeitungen in zeitlicher Reihenfolge, älteste zuerst. */
export function groupEdits({ steps, songAt }: HistoryInput, dayOf: (time: number) => string = localDay): Edit[] {
  const edits: Edit[] = [];
  let key: string | null = null;
  steps.forEach((step, index) => {
    const next = step.restore === undefined ? `${step.author}|${step.subject}|${dayOf(step.time)}` : null;
    const current = edits.at(-1);
    if (current && next !== null && next === key) {
      current.last = index;
    } else {
      edits.push({
        subject: step.subject,
        author: step.author,
        first: index,
        last: index,
        from: index - 1,
        ...(step.restore === undefined ? {} : { restore: step.restore }),
      });
    }
    key = next;
  });
  return mergeEmptyCreations(edits, songAt);
}

/** Leere Neuanlage: Anlegen und die nächste Bearbeitung desselben Autors bilden eine Bearbeitung (song-history). */
function mergeEmptyCreations(edits: Edit[], songAt: HistoryInput['songAt']): Edit[] {
  const hidden = new Set<Edit>();
  edits.forEach((edit, index) => {
    const id = patternIdOf(edit.subject);
    if (!id || edit.restore !== undefined) return;
    const start = findPattern(songAt(edit.from), id);
    const end = findPattern(songAt(edit.last), id);
    if (!start || !end || hasHits(start) || contentOf(start) === contentOf(end)) return;

    const between: Edit[] = [];
    for (let k = index - 1; k >= 0; k--) {
      const earlier = edits[k]!;
      if (findPattern(songAt(earlier.from), id)) {
        // Das Pattern bestand schon; eine eigene Bearbeitung dazwischen muss es leer gelassen haben
        if (earlier.subject === edit.subject) {
          const state = findPattern(songAt(earlier.last), id);
          if (!state || hasHits(state)) return;
          between.push(earlier);
        }
        continue;
      }
      // In `earlier` entstanden
      if (earlier.author !== edit.author || earlier.restore !== undefined) return;
      const created = findPattern(songAt(earlier.last), id);
      if (!created || hasHits(created)) return;
      if (earlier.subject === edit.subject) between.push(earlier);
      between.forEach((e) => hidden.add(e));
      edit.from = earlier.from;
      edit.created = true;
      return;
    }
  });
  return edits.filter((edit) => !hidden.has(edit));
}

// --- Unterschiede ---------------------------------------------------------------------

export interface Change<T> {
  from: T;
  to: T;
}

export interface SongDiff {
  kind: 'song';
  created?: true;
  title?: Change<string>;
  tempo?: Change<number>;
  meter?: Change<number>;
}

export type SegmentChange =
  | { type: 'added'; segmentId: string; name: string; bars: number }
  | { type: 'removed'; segmentId: string; name: string }
  | { type: 'renamed'; segmentId: string; from: string; to: string }
  | { type: 'bars'; segmentId: string; name: string; from: number; to: number }
  | { type: 'blocks'; segmentId: string; name: string; from: number; to: number }
  | { type: 'reassigned'; segmentId: string; name: string; count: number }
  | { type: 'moved' };

export interface StructureDiff {
  kind: 'structure';
  segments: SegmentChange[];
}

export interface PatternDiff {
  kind: 'pattern';
  patternId: string;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  /** Vorlage einer neu angelegten Kopie. */
  copyOf?: string;
  name?: Change<string>;
  length?: Change<number>;
  color?: Change<PatternColor>;
  meter?: Change<number | null>;
  /** Unterteilung mindestens eines Beats geändert. */
  grid?: true;
  hits: { added: number; removed: number; changed: number };
}

export type EditDiff = SongDiff | StructureDiff | PatternDiff;

/** Ändert die Bearbeitung netto nichts? */
export function isUnchanged(diff: EditDiff): boolean {
  if (diff.kind === 'pattern') return diff.status === 'unchanged';
  if (diff.kind === 'structure') return diff.segments.length === 0;
  return !diff.created && !diff.title && !diff.tempo && !diff.meter;
}

const change = <T>(from: T, to: T): Change<T> | undefined => (from === to ? undefined : { from, to });

/** Nettounterschied einer Bearbeitung zwischen dem Stand vorher und dem nach ihrem letzten Schritt. */
export function editDiff(edit: Edit, input: HistoryInput, at: number = edit.last): EditDiff {
  const before = input.songAt(edit.from);
  const after = input.songAt(at)!;
  const id = patternIdOf(edit.subject);
  if (id) return patternDiff(id, before, after, copySource(edit, input, id, at));
  if (edit.subject === 'structure') return { kind: 'structure', segments: segmentChanges(before?.segments ?? [], after.segments) };
  if (!before) return { kind: 'song', created: true };
  const diff: SongDiff = { kind: 'song' };
  const title = change(before.title, after.title);
  const tempo = change(before.tempo, after.tempo);
  const meter = change(before.meter ?? DEFAULT_METER, after.meter ?? DEFAULT_METER);
  if (title) diff.title = title;
  if (tempo) diff.tempo = tempo;
  if (meter) diff.meter = meter;
  return diff;
}

/** Vorlage einer Kopie: im Stand, in dem das Pattern entstand, ein anderes mit denselben Beats und Schlägen. */
export function copySource(edit: Edit, { songAt }: HistoryInput, id: string, at: number = edit.last): Pattern | undefined {
  if (findPattern(songAt(edit.from), id)) return undefined;
  for (let index = edit.from + 1; index <= at; index++) {
    const song = songAt(index);
    const created = findPattern(song, id);
    if (!created) continue;
    if (!hasHits(created)) return undefined;
    const beats = JSON.stringify(created.beats);
    return song!.patterns.find((p) => p.id !== id && p.kind === created.kind && JSON.stringify(p.beats) === beats);
  }
  return undefined;
}

function patternDiff(id: string, before: Song | null, after: Song, source: Pattern | undefined): PatternDiff {
  const old = findPattern(before, id);
  const now = findPattern(after, id);
  const base = old ?? source;
  const marks = compareHits(base, now);
  const count = (mark: HitMark) => [...marks.values()].filter((m) => m === mark).length;
  const diff: PatternDiff = {
    kind: 'pattern',
    patternId: id,
    status: !old ? 'added' : !now ? 'removed' : 'changed',
    hits: { added: count('added'), removed: count('removed'), changed: count('changed') },
  };
  if (!old && source) diff.copyOf = source.id;
  if (old && now) {
    const name = change(old.name, now.name);
    const length = change(old.beats.length, now.beats.length);
    const color = change(old.color, now.color);
    const meter = change(old.meter ?? null, now.meter ?? null);
    if (name) diff.name = name;
    if (length) diff.length = length;
    if (color) diff.color = color;
    if (meter) diff.meter = meter;
    if (old.beats.map((b) => b.subdivision).join() !== now.beats.map((b) => b.subdivision).join()) diff.grid = true;
    if (contentOf(old) === contentOf(now)) diff.status = 'unchanged';
  }
  return diff;
}

// --- Schläge nach Lage im Beat --------------------------------------------------------

export type HitMark = 'added' | 'changed' | 'removed';

/** Lage eines Schlags: Beat und Position in 24steln des Beats, damit ein anderes Raster dieselbe Lage ergibt. */
export const hitKey = (beat: number, subdivision: number, position: number, instrument: Instrument) =>
  `${beat}:${(position * 24) / subdivision}:${instrument}`;

function hitsOf(pattern: Pattern | undefined): Map<string, string> {
  const hits = new Map<string, string>();
  pattern?.beats.forEach((beat, index) => {
    for (const [instrument, positions] of Object.entries(beat.hits) as [Instrument, number[]][]) {
      for (const position of positions) {
        const way = `${articulationAt(beat, instrument, position) ?? ''}${emphasisAt(beat, instrument, position) ? '>' : ''}`;
        hits.set(hitKey(index, beat.subdivision, position, instrument), way);
      }
    }
  });
  return hits;
}

/** Neue, in Spielweise oder Betonung geänderte und entfernte Schläge, je Lage. */
export function compareHits(before: Pattern | undefined, after: Pattern | undefined): Map<string, HitMark> {
  const old = hitsOf(before);
  const now = hitsOf(after);
  const marks = new Map<string, HitMark>();
  for (const [key, way] of now) {
    if (!old.has(key)) marks.set(key, 'added');
    else if (old.get(key) !== way) marks.set(key, 'changed');
  }
  for (const key of old.keys()) if (!now.has(key)) marks.set(key, 'removed');
  return marks;
}

// --- Struktur -------------------------------------------------------------------------

type Segments = Song['segments'];
const barsOf = (segment: Segments[number]) => segment.blocks.flatMap((block) => block.bars);
const sameBar = (a: { grooveId: string | null; fillId: string | null; beats: number }, b: typeof a) =>
  a.grooveId === b.grooveId && a.fillId === b.fillId && a.beats === b.beats;

/** Gemeinsame Segmente, die ihre Reihenfolge untereinander geändert haben. */
function movedSegments(before: Segments, after: Segments): Set<string> {
  const common = (list: Segments, other: Segments) => list.map((s) => s.id).filter((id) => other.some((o) => o.id === id));
  const a = common(before, after);
  const b = common(after, before);
  return new Set(a.filter((id, i) => b[i] !== id));
}

function segmentChanges(before: Segments, after: Segments): SegmentChange[] {
  const changes: SegmentChange[] = [];
  const old = new Map(before.map((s) => [s.id, s]));
  for (const segment of after) {
    const previous = old.get(segment.id);
    if (!previous) {
      changes.push({ type: 'added', segmentId: segment.id, name: segment.name, bars: barsOf(segment).length });
      continue;
    }
    if (previous.name !== segment.name) changes.push({ type: 'renamed', segmentId: segment.id, from: previous.name, to: segment.name });
    const oldBars = barsOf(previous);
    const newBars = barsOf(segment);
    if (oldBars.length !== newBars.length) changes.push({ type: 'bars', segmentId: segment.id, name: segment.name, from: oldBars.length, to: newBars.length });
    const byId = new Map(oldBars.map((bar) => [bar.id, bar]));
    const reassigned = newBars.filter((bar) => {
      const earlier = byId.get(bar.id);
      return earlier && !sameBar(earlier, bar);
    }).length;
    if (reassigned > 0) changes.push({ type: 'reassigned', segmentId: segment.id, name: segment.name, count: reassigned });
    if (previous.blocks.length !== segment.blocks.length) {
      changes.push({ type: 'blocks', segmentId: segment.id, name: segment.name, from: previous.blocks.length, to: segment.blocks.length });
    }
  }
  for (const segment of before) if (!after.some((s) => s.id === segment.id)) changes.push({ type: 'removed', segmentId: segment.id, name: segment.name });
  if (movedSegments(before, after).size > 0) changes.push({ type: 'moved' });
  return changes;
}

export type SegmentMark = 'added' | 'removed' | 'renamed' | 'moved';

export interface StructureMarks {
  /** Takte, die hervorgehoben erscheinen: vorher entfernte oder umbelegte, nachher neue oder umbelegte. */
  bars: Set<string>;
  segments: Map<string, SegmentMark>;
}

/** Was im Motiv vorher und nachher hervorgehoben erscheint (song-history › Vergleich der Struktur). */
export function structureChanges(before: Song | null, after: Song): { before: StructureMarks; after: StructureMarks } {
  const a = before?.segments ?? [];
  const b = after.segments;
  const moved = movedSegments(a, b);
  const marks = (own: Segments, other: Segments, missing: SegmentMark): StructureMarks => {
    const otherSegments = new Map(other.map((s) => [s.id, s]));
    const otherBars = new Map(other.flatMap(barsOf).map((bar) => [bar.id, bar]));
    const segments = new Map<string, SegmentMark>();
    const bars = new Set<string>();
    for (const segment of own) {
      const counterpart = otherSegments.get(segment.id);
      if (!counterpart) segments.set(segment.id, missing);
      else if (counterpart.name !== segment.name) segments.set(segment.id, 'renamed');
      else if (moved.has(segment.id)) segments.set(segment.id, 'moved');
      for (const bar of barsOf(segment)) {
        const twin = otherBars.get(bar.id);
        if (!counterpart || !twin || !sameBar(twin, bar)) bars.add(bar.id);
      }
    }
    return { bars, segments };
  };
  return { before: marks(a, b, 'removed'), after: marks(b, a, 'added') };
}

// --- Wiederherstellen -----------------------------------------------------------------

/** `subject`: nur der Gegenstand der Bearbeitung; `song`: der ganze Song. */
export type RestoreScope = 'subject' | 'song';

/** Pattern aus dem Zielstand mit fortgeschriebener Revision (library-persistence › Änderungsmetadaten). */
const restoredPattern = (pattern: Pattern, current: Pattern | undefined, now: Date): Pattern => ({
  ...pattern,
  revision: Math.max(pattern.revision, current?.revision ?? 0) + 1,
  updatedAt: now.toISOString(),
});

/** Patterns, auf die die Struktur des Ziels verweist und die es im aktuellen Stand nicht gibt. */
function missingForStructure(current: Song, target: Song): Pattern[] {
  const used = new Set(target.segments.flatMap(barsOf).flatMap((bar) => [bar.grooveId, bar.fillId]));
  return target.patterns.filter((p) => used.has(p.id) && !findPattern(current, p.id));
}

const songData = (song: Song, target: Song): Song => {
  const { meter: _meter, ...rest } = song;
  return { ...rest, title: target.title, tempo: target.tempo, ...(target.meter === undefined ? {} : { meter: target.meter }) };
};

/** Neuer Song für eine Wiederherstellung; Revision und Änderungszeit des Songs setzt der Store (design.md D6). */
export function restoreTarget(current: Song, target: Song, subject: Subject, scope: RestoreScope, now: Date): Song {
  if (scope === 'song') {
    const patterns = target.patterns.map((p) => {
      const existing = findPattern(current, p.id);
      return existing && contentOf(existing) === contentOf(p) ? existing : restoredPattern(p, existing, now);
    });
    return normalizeSong({ ...songData(current, target), patterns, segments: target.segments });
  }
  if (subject === 'song') return normalizeSong(songData(current, target));
  if (subject === 'structure') {
    const back = missingForStructure(current, target).map((p) => restoredPattern(p, undefined, now));
    return normalizeSong({ ...current, segments: target.segments, patterns: [...current.patterns, ...back] });
  }
  const id = patternIdOf(subject)!;
  const then = findPattern(target, id);
  const existing = findPattern(current, id);
  if (!then) return existing ? normalizeSong(removePattern(current, id)) : current;
  const restored = restoredPattern(then, existing, now);
  const patterns = existing ? current.patterns.map((p) => (p.id === id ? restored : p)) : [...current.patterns, restored];
  return normalizeSong({ ...current, patterns });
}

export type RestoreConsequence =
  | { type: 'reset' | 're-added' | 'deleted'; patternId: string }
  | { type: 'structure' }
  | ({ type: 'song' } & Omit<SongDiff, 'kind' | 'created'>);

export interface RestoreConsequences {
  /** Leer, wenn der Gegenstand schon dem Zielstand entspricht. */
  items: RestoreConsequence[];
  /** Andere Autoren, deren spätere Änderungen am Gegenstand zurückgenommen werden. */
  others: string[];
}

function patternConsequence(current: Song, target: Song, id: string): RestoreConsequence | null {
  const now = findPattern(current, id);
  const then = findPattern(target, id);
  if (!now && then) return { type: 're-added', patternId: id };
  if (now && !then) return { type: 'deleted', patternId: id };
  if (now && then && contentOf(now) !== contentOf(then)) return { type: 'reset', patternId: id };
  return null;
}

function songConsequence(current: Song, target: Song): RestoreConsequence | null {
  const { kind: _kind, ...diff } = editDiff(
    { subject: 'song', author: null, first: 1, last: 1, from: 0 },
    { steps: [], songAt: (index) => (index === 0 ? current : target) },
  ) as SongDiff;
  return Object.keys(diff).length > 0 ? { type: 'song', ...diff } : null;
}

/** Folgen einer Wiederherstellung für den Bestätigungsdialog (design.md D6). */
export function restoreConsequences(
  current: Song,
  target: Song,
  subject: Subject,
  scope: RestoreScope,
  later: readonly Step[],
  /** Eigene Kennung und Adresse (account-id-authorship, design.md D5). */
  me: readonly string[],
): RestoreConsequences {
  const items: RestoreConsequence[] = [];
  const push = (item: RestoreConsequence | null) => item && items.push(item);
  if (scope === 'song' || subject === 'song') push(songConsequence(current, target));
  if (scope === 'song') {
    const ids = new Set([...current.patterns, ...target.patterns].map((p) => p.id));
    ids.forEach((id) => push(patternConsequence(current, target, id)));
  } else {
    const id = patternIdOf(subject);
    if (id) push(patternConsequence(current, target, id));
  }
  if ((scope === 'song' || subject === 'structure') && JSON.stringify(current.segments) !== JSON.stringify(target.segments)) {
    items.push({ type: 'structure' });
    if (scope === 'subject') missingForStructure(current, target).forEach((p) => items.push({ type: 're-added', patternId: p.id }));
  }
  const affected = later.filter((step) => scope === 'song' || step.subject === subject);
  const others = [...new Set(affected.map((step) => step.author).filter((author): author is string => author !== null && !me.includes(author)))];
  return { items, others: items.length > 0 ? others : [] };
}
