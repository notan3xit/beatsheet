import * as A from '@automerge/automerge/slim';
import { automergeWasmBase64 } from '@automerge/automerge/automerge.wasm.base64';
import { normalizeSong } from '../domain/normalize';
import {
  ARTICULATED,
  INSTRUMENTS,
  type Accent,
  type Articulation,
  type Beat,
  type Instrument,
  type PatternColor,
  type PatternKind,
  type Song,
  type Subdivision,
} from '../domain/types';

let ready: Promise<void> | undefined;

/** Lädt das WebAssembly-Modul von Automerge einmalig (design.md D1); vor dem ersten Dokumentzugriff abwarten. */
export function initAutomerge(): Promise<void> {
  ready ??= A.initializeBase64Wasm(automergeWasmBase64);
  return ready;
}

// --- Dokumentform (design.md D3) ----------------------------------------------------

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

/** Gespeicherte Form eines Songs; Zeichenketten werden im Dokument zu `ImmutableString`, `revision` zum `Counter`. */
export interface SongDocShape {
  v: 1;
  id: string;
  title: string;
  tempo: number;
  patterns: PatternDocShape[];
  segments: { id: string; name: string; blocks: { id: string; bars: BarDocShape[] }[] }[];
  createdAt: string;
  updatedAt: string;
  revision: number;
}

interface PatternDocShape {
  id: string;
  kind: PatternKind;
  name: string;
  color: PatternColor;
  beats: BeatDocShape[];
  createdAt: string;
  updatedAt: string;
  revision: number;
}

/** Feste Container: ein Eintrag je Instrument bzw. artikulierbarem Instrument, Positionen als Schlüssel. */
interface BeatDocShape {
  subdivision: Subdivision;
  hits: Record<Instrument, Record<string, true>>;
  articulations: Record<string, Record<string, Articulation>>;
}

interface BarDocShape {
  id: string;
  beats: number;
  grooveId: string | null;
  fillId: string | null;
  /** Schlüssel `<instrument>:<beat>:<position>`. */
  accents: Record<string, true>;
}

/** Automerge-Dokument eines Songs. */
export type SongDocument = A.Doc<{ v: number }>;

const accentKey = (a: Accent) => `${a.instrument}:${a.beat}:${a.position}`;
const asKeys = (positions: readonly number[] = []) => Object.fromEntries(positions.map((p) => [String(p), true as const]));

function beatToDoc(beat: Beat): BeatDocShape {
  const hits = Object.fromEntries(INSTRUMENTS.map((i) => [i, asKeys(beat.hits[i])])) as BeatDocShape['hits'];
  const articulations = Object.fromEntries(
    ARTICULATED.map((i) => [i, Object.fromEntries(Object.entries(beat.articulations?.[i] ?? {}))]),
  ) as BeatDocShape['articulations'];
  return { subdivision: beat.subdivision, hits, articulations };
}

export function toDocShape(song: Song): SongDocShape {
  return {
    v: 1,
    id: song.id,
    title: song.title,
    tempo: song.tempo,
    patterns: song.patterns.map((p) => ({
      id: p.id,
      kind: p.kind,
      name: p.name,
      color: p.color,
      beats: p.beats.map(beatToDoc),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      revision: p.revision,
    })),
    segments: song.segments.map((s) => ({
      id: s.id,
      name: s.name,
      blocks: s.blocks.map((b) => ({
        id: b.id,
        bars: b.bars.map((bar) => ({
          id: bar.id,
          beats: bar.beats,
          grooveId: bar.grooveId,
          fillId: bar.fillId,
          accents: Object.fromEntries(bar.accents.map((a) => [accentKey(a), true as const])),
        })),
      })),
    })),
    createdAt: song.createdAt,
    updatedAt: song.updatedAt,
    revision: song.revision,
  };
}

const positionsOf = (keys: Record<string, unknown> | undefined) => Object.keys(keys ?? {}).map(Number).sort((a, b) => a - b);

function beatFromDoc(beat: BeatDocShape): Beat {
  const hits: Beat['hits'] = {};
  for (const instrument of INSTRUMENTS) {
    const positions = positionsOf(beat.hits?.[instrument]);
    if (positions.length > 0) hits[instrument] = positions;
  }
  const articulations: NonNullable<Beat['articulations']> = {};
  for (const [instrument, byPosition] of Object.entries(beat.articulations ?? {})) {
    if (Object.keys(byPosition).length > 0) articulations[instrument as Instrument] = { ...byPosition };
  }
  return Object.keys(articulations).length > 0 ? { subdivision: beat.subdivision, hits, articulations } : { subdivision: beat.subdivision, hits };
}

function accentFromKey(key: string): Accent {
  const [instrument, beat, position] = key.split(':');
  return { instrument: instrument as Instrument, beat: Number(beat), position: Number(position) as Accent['position'] };
}

const byAccentOrder = (a: Accent, b: Accent) =>
  a.beat - b.beat || a.position - b.position || INSTRUMENTS.indexOf(a.instrument) - INSTRUMENTS.indexOf(b.instrument);

export function fromDocShape(doc: SongDocShape): Song {
  return {
    id: doc.id,
    title: doc.title,
    tempo: doc.tempo,
    patterns: doc.patterns.map((p) => ({
      id: p.id,
      kind: p.kind,
      name: p.name,
      color: p.color,
      beats: p.beats.map(beatFromDoc),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      revision: p.revision,
    })),
    segments: doc.segments.map((s) => ({
      id: s.id,
      name: s.name,
      blocks: s.blocks.map((b) => ({
        id: b.id,
        bars: b.bars.map((bar) => ({
          id: bar.id,
          beats: bar.beats,
          grooveId: bar.grooveId,
          fillId: bar.fillId,
          accents: Object.keys(bar.accents ?? {}).map(accentFromKey).sort(byAccentOrder),
        })),
      })),
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    revision: doc.revision,
  };
}

// --- Brücke (design.md D4, D5) -----------------------------------------------------------

/** Listen, deren Elemente über `id` abgeglichen werden; alle anderen nach Index. */
const ID_LISTS = new Set(['patterns', 'segments', 'blocks', 'bars']);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !A.isImmutableString(value) && !A.isCounter(value);

/** Wert für das Dokument: Zeichenketten als Ganzes, `revision` als Zähler. */
function toAutomerge(value: Json, key?: string): unknown {
  if (typeof value === 'string') return new A.ImmutableString(value);
  if (key === 'revision' && typeof value === 'number') return new A.Counter(value);
  if (Array.isArray(value)) return value.map((item) => toAutomerge(item));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toAutomerge(v, k)]));
  }
  return value;
}

/** Dokumentinhalt als reines JSON. */
function plain(value: unknown): Json {
  if (A.isImmutableString(value)) return value.toString();
  if (A.isCounter(value)) return value.value;
  if (Array.isArray(value)) return value.map(plain);
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  return value as Json;
}

const idOf = (item: unknown) => (isObject(item) ? String(item.id) : undefined);

function syncList(list: A.List<unknown>, target: Json[], byId: boolean) {
  if (!byId) {
    const common = Math.min(list.length, target.length);
    for (let i = 0; i < common; i++) syncValue(list as unknown as Record<number, unknown>, i, target[i]!);
    if (list.length > target.length) list.deleteAt(target.length, list.length - target.length);
    for (let i = list.length; i < target.length; i++) list.insertAt(i, toAutomerge(target[i]!));
    return;
  }
  const wanted = new Set(target.map(idOf));
  for (let i = list.length - 1; i >= 0; i--) if (!wanted.has(idOf(list[i]))) list.deleteAt(i);
  target.forEach((item, i) => {
    const id = idOf(item);
    if (i < list.length && idOf(list[i]) === id) {
      syncMap(list[i] as Record<string, unknown>, item as JsonObject);
      return;
    }
    // Verschoben: an der alten Stelle löschen und neu einfügen (Automerge kennt kein Verschieben)
    for (let j = i + 1; j < list.length; j++) {
      if (idOf(list[j]) === id) {
        list.deleteAt(j);
        break;
      }
    }
    list.insertAt(i, toAutomerge(item));
  });
}

function syncValue(parent: Record<string | number, unknown>, key: string | number, target: Json) {
  const current = parent[key];
  if (key === 'revision' && A.isCounter(current) && typeof target === 'number') {
    const delta = target - current.value;
    if (delta !== 0) current.increment(delta);
  } else if (Array.isArray(target) && Array.isArray(current)) {
    syncList(current as A.List<unknown>, target, ID_LISTS.has(String(key)));
  } else if (isObject(target) && isObject(current)) {
    syncMap(current, target as JsonObject);
  } else if (plain(current) !== target || current === undefined) {
    parent[key] = toAutomerge(target, String(key));
  }
}

function syncMap(current: Record<string, unknown>, target: JsonObject) {
  for (const key of Object.keys(current)) if (!(key in target)) delete current[key];
  for (const [key, value] of Object.entries(target)) syncValue(current, key, value);
}

/** Neues Dokument für einen Song. */
export function createSongDoc(song: Song): SongDocument {
  return A.from(toAutomerge(toDocShape(song) as unknown as JsonObject) as { v: number });
}

/** Überträgt einen Song als minimale Änderung ins Dokument; ein unveränderter Song erzeugt keine Änderung. */
export function applySong(doc: SongDocument, song: Song): SongDocument {
  const target = toDocShape(song) as unknown as JsonObject;
  return A.change(doc, (d) => syncMap(d as unknown as Record<string, unknown>, target));
}

/** Der Song eines Dokuments, fachlich normalisiert (design.md D6). */
export function songOf(doc: SongDocument): Song {
  return normalizeSong(fromDocShape(plain(doc) as unknown as SongDocShape));
}

/** Führt zwei Fassungen zusammen, ohne eine davon zu verändern (design.md D7). */
export function mergeSongDocs(a: SongDocument, b: SongDocument): SongDocument {
  return A.merge(A.clone(a), b);
}
