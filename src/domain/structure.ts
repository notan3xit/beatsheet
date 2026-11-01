import { ValidationError, type Deps } from './pattern';
import { addPattern, mapBars } from './songPatterns';
import {
  MAX_BAR_BEATS,
  MAX_SEGMENT_BARS,
  type Accent,
  type Bar,
  type Block,
  type Pattern,
  type PatternKind,
  type Segment,
  type Song,
} from './types';

const newId = (deps?: Deps) => deps?.newId() ?? crypto.randomUUID();

function assertRange(value: number, max: number, what: string) {
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new ValidationError(`${what} muss eine ganze Zahl von 1 bis ${max} sein.`);
  }
}

function makeBars(count: number, beats: number, grooveId: string | null, deps?: Deps): Bar[] {
  assertRange(count, MAX_SEGMENT_BARS, 'Die Taktzahl');
  assertRange(beats, MAX_BAR_BEATS, 'Die Taktlänge');
  return Array.from({ length: count }, () => ({ id: newId(deps), beats, grooveId, fillId: null, accents: [] }));
}

function assertPattern(song: Song, id: string | null | undefined, kind: PatternKind) {
  if (id == null) return;
  const pattern = song.patterns.find((p) => p.id === id);
  if (!pattern || pattern.kind !== kind) {
    throw new ValidationError(kind === 'groove' ? 'Als Groove ist nur ein Groove dieses Songs wählbar.' : 'Als Fill ist nur ein Fill dieses Songs wählbar.');
  }
}

const mapSegments = (song: Song, change: (segment: Segment) => Segment): Song => ({
  ...song,
  segments: song.segments.map(change),
});

const mapBlocks = (song: Song, change: (block: Block) => Block): Song =>
  mapSegments(song, (segment) => ({ ...segment, blocks: segment.blocks.map(change) }));

/** Entfernt Blöcke ohne Takte; Segmente bleiben bestehen. */
const dropEmptyBlocks = (song: Song): Song =>
  mapSegments(song, (segment) => ({ ...segment, blocks: segment.blocks.filter((b) => b.bars.length > 0) }));

export interface BlockInput {
  bars: number;
  beats?: number;
  grooveId?: string | null;
}

// --- Segmente -----------------------------------------------------------------

export function appendSegment(song: Song, input: BlockInput & { name: string }, deps?: Deps): Song {
  assertPattern(song, input.grooveId, 'groove');
  const bars = makeBars(input.bars, input.beats ?? 4, input.grooveId ?? null, deps);
  const segment: Segment = {
    id: newId(deps),
    name: input.name.trim() || `Segment ${song.segments.length + 1}`,
    blocks: [{ id: newId(deps), bars }],
  };
  return { ...song, segments: [...song.segments, segment] };
}

export function renameSegment(song: Song, segmentId: string, name: string): Song {
  const trimmed = name.trim();
  if (!trimmed) return song;
  return mapSegments(song, (s) => (s.id === segmentId ? { ...s, name: trimmed } : s));
}

export function deleteSegment(song: Song, segmentId: string): Song {
  return { ...song, segments: song.segments.filter((s) => s.id !== segmentId) };
}

export function moveSegment(song: Song, segmentId: string, direction: -1 | 1): Song {
  const index = song.segments.findIndex((s) => s.id === segmentId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= song.segments.length) return song;
  const segments = [...song.segments];
  [segments[index], segments[target]] = [segments[target]!, segments[index]!];
  return { ...song, segments };
}

/** Unabhängige Kopie direkt hinter dem Original; verweist auf dieselben Patterns. */
export function duplicateSegment(song: Song, segmentId: string, deps?: Deps): Song {
  const index = song.segments.findIndex((s) => s.id === segmentId);
  if (index < 0) return song;
  const original = song.segments[index]!;
  const copy: Segment = {
    id: newId(deps),
    name: `${original.name} (Kopie)`,
    blocks: original.blocks.map((block) => ({
      id: newId(deps),
      bars: block.bars.map((bar) => ({ ...bar, id: newId(deps), accents: bar.accents.map((a) => ({ ...a })) })),
    })),
  };
  const segments = [...song.segments];
  segments.splice(index + 1, 0, copy);
  return { ...song, segments };
}

// --- Blöcke und Takte -----------------------------------------------------------

export function appendBlock(song: Song, segmentId: string, input: BlockInput, deps?: Deps): Song {
  assertPattern(song, input.grooveId, 'groove');
  const block: Block = { id: newId(deps), bars: makeBars(input.bars, input.beats ?? 4, input.grooveId ?? null, deps) };
  return mapSegments(song, (s) => (s.id === segmentId ? { ...s, blocks: [...s.blocks, block] } : s));
}

export function deleteBlock(song: Song, blockId: string): Song {
  return mapSegments(song, (s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== blockId) }));
}

/** Neuer Takt mit Länge und Groove des Vorbilds, ohne Fill und Akzente. */
const barLike = (model: Bar | undefined, deps?: Deps): Bar => ({
  id: newId(deps),
  beats: model?.beats ?? 4,
  grooveId: model?.grooveId ?? null,
  fillId: null,
  accents: [],
});

export function appendBar(song: Song, blockId: string, deps?: Deps): Song {
  return mapBlocks(song, (b) => (b.id === blockId ? { ...b, bars: [...b.bars, barLike(b.bars.at(-1), deps)] } : b));
}

export function insertBarAfter(song: Song, barId: string, deps?: Deps): Song {
  return mapBlocks(song, (block) => {
    const index = block.bars.findIndex((bar) => bar.id === barId);
    if (index < 0) return block;
    const bars = [...block.bars];
    bars.splice(index + 1, 0, barLike(block.bars[index], deps));
    return { ...block, bars };
  });
}

export function deleteBar(song: Song, barId: string): Song {
  return dropEmptyBlocks(mapBlocks(song, (b) => ({ ...b, bars: b.bars.filter((bar) => bar.id !== barId) })));
}

export interface BarProps {
  beats?: number;
  grooveId?: string | null;
  fillId?: string | null;
}

/** Setzt Eigenschaften für alle ausgewählten Takte; Akzente außerhalb einer gekürzten Länge entfallen. */
export function setBarProps(song: Song, barIds: readonly string[], props: BarProps): Song {
  if (props.beats !== undefined) assertRange(props.beats, MAX_BAR_BEATS, 'Die Taktlänge');
  assertPattern(song, props.grooveId, 'groove');
  assertPattern(song, props.fillId, 'fill');
  const selected = new Set(barIds);
  return mapBars(song, (bar) => {
    if (!selected.has(bar.id)) return bar;
    const next = { ...bar, ...props };
    return props.beats !== undefined ? { ...next, accents: bar.accents.filter((a) => a.beat < props.beats!) } : next;
  });
}

// --- Platzhalter und Akzente --------------------------------------------------------

/** Neues, leeres Pattern aus der Struktur heraus: Groove mit 4 Beats, Fill mit angegebener Länge. */
export function addPlaceholder(
  song: Song,
  input: { kind: PatternKind; name: string; length?: number },
  deps?: Deps,
): { song: Song; pattern: Pattern } {
  if (input.kind === 'fill' && input.length === undefined) {
    throw new ValidationError('Für einen neuen Fill muss die Länge angegeben werden.');
  }
  return addPattern(song, { kind: input.kind, name: input.name, length: input.kind === 'groove' ? 4 : input.length }, deps);
}

const sameAccent = (a: Accent, b: Accent) => a.instrument === b.instrument && a.beat === b.beat && a.position === b.position;

export function addAccent(song: Song, barId: string, accent: Accent): Song {
  return mapBars(song, (bar) => {
    if (bar.id !== barId) return bar;
    if (!Number.isInteger(accent.beat) || accent.beat < 0 || accent.beat >= bar.beats) {
      throw new ValidationError(`Der Akzent muss innerhalb des Takts (Beat 1 bis ${bar.beats}) liegen.`);
    }
    if (bar.accents.some((a) => sameAccent(a, accent))) return bar;
    return { ...bar, accents: [...bar.accents, { ...accent }] };
  });
}

export function removeAccent(song: Song, barId: string, accent: Accent): Song {
  return mapBars(song, (bar) =>
    bar.id === barId ? { ...bar, accents: bar.accents.filter((a) => !sameAccent(a, accent)) } : bar,
  );
}
