import * as A from '@automerge/automerge/slim';
import { automergeWasmBase64 } from '@automerge/automerge/automerge.wasm.base64';
import { normalizeSong } from '../domain/normalize';
import {
  DEFAULT_METER,
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
  /** Fehlt bei 4/4 (design.md D2 von song-meter), damit ältere Dokumente unverändert bleiben. */
  meter?: number;
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
  meter?: number;
  createdAt: string;
  updatedAt: string;
  revision: number;
}

/** Instrumente mit festem Container für Spielweisen. */
const ARTICULATION_CONTAINERS: readonly Instrument[] = ['snare', 'tom1', 'tom2', 'floorTom'];
const EMPHASIS_PREFIX = 'emphasis:';

/**
 * Feste Container: ein Eintrag je Instrument, Positionen als Schlüssel. Was vorhandene Dokumente noch nicht
 * enthalten, liegt flach, denn gleichzeitig neu angelegte Container verdrängten sich beim Zusammenführen
 * (hit-types, design.md D3): Spielweisen von Ride und Crash als `<instrument>:<position>` in `articulations`,
 * Betonungen als `emphasis:<instrument>:<position>` im Beat.
 */
type BeatDocShape = {
  subdivision: Subdivision;
  hits: Record<Instrument, Record<string, true>>;
  articulations: Record<string, Record<string, Articulation> | Articulation>;
} & { [key: `${typeof EMPHASIS_PREFIX}${string}`]: true };

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
  const articulations: BeatDocShape['articulations'] = Object.fromEntries(
    ARTICULATION_CONTAINERS.map((i) => [i, Object.fromEntries(Object.entries(beat.articulations?.[i] ?? {}))]),
  );
  for (const [instrument, byPosition] of Object.entries(beat.articulations ?? {})) {
    if (ARTICULATION_CONTAINERS.includes(instrument as Instrument)) continue;
    for (const [position, articulation] of Object.entries(byPosition)) articulations[`${instrument}:${position}`] = articulation;
  }
  const emphasis = Object.entries(beat.emphasis ?? {}).flatMap(([instrument, positions]) =>
    positions.map((position) => [`${EMPHASIS_PREFIX}${instrument}:${position}`, true] as const),
  );
  return { subdivision: beat.subdivision, hits, articulations, ...Object.fromEntries(emphasis) };
}

export function toDocShape(song: Song): SongDocShape {
  return {
    v: 1,
    id: song.id,
    title: song.title,
    tempo: song.tempo,
    ...(song.meter !== undefined && song.meter !== DEFAULT_METER ? { meter: song.meter } : {}),
    patterns: song.patterns.map((p) => ({
      id: p.id,
      kind: p.kind,
      name: p.name,
      color: p.color,
      beats: p.beats.map(beatToDoc),
      ...(p.meter !== undefined ? { meter: p.meter } : {}),
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
  for (const [key, value] of Object.entries(beat.articulations ?? {})) {
    if (typeof value === 'string') {
      const [instrument, position] = key.split(':') as [Instrument, string];
      (articulations[instrument] ??= {})[Number(position)] = value;
    } else if (Object.keys(value).length > 0) {
      articulations[key as Instrument] = { ...value };
    }
  }
  const emphasis: NonNullable<Beat['emphasis']> = {};
  for (const key of Object.keys(beat)) {
    if (!key.startsWith(EMPHASIS_PREFIX)) continue;
    const [, instrument, position] = key.split(':') as [string, Instrument, string];
    (emphasis[instrument] ??= []).push(Number(position));
  }
  for (const positions of Object.values(emphasis)) positions.sort((a, b) => a - b);
  return {
    subdivision: beat.subdivision,
    hits,
    ...(Object.keys(articulations).length > 0 ? { articulations } : {}),
    ...(Object.keys(emphasis).length > 0 ? { emphasis } : {}),
  };
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
    ...(doc.meter !== undefined ? { meter: doc.meter } : {}),
    patterns: doc.patterns.map((p) => ({
      id: p.id,
      kind: p.kind,
      name: p.name,
      color: p.color,
      beats: p.beats.map(beatFromDoc),
      ...(p.meter !== undefined ? { meter: p.meter } : {}),
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

/**
 * Welche Schlüssel eines Objekts der Dokumentform diese Version besitzt und wie seine Kinder beschrieben sind
 * (outdated-app, design.md D1). Nur besessene Schlüssel werden gelöscht; Felder neuerer Versionen bleiben stehen.
 * Bei Listen beschreibt `child` die Elemente.
 */
interface Owned {
  owns(key: string): boolean;
  child(key: string): Owned;
}

/** Wörterbuch mit Daten als Schlüsseln, etwa Positionen oder Akzente; auch für Werte ohne Kinder. */
const DATA: Owned = { owns: () => true, child: () => DATA };

/** Objekt mit festen Feldern; `extra` besitzt zusätzlich Datenschlüssel neben den Feldern. */
function fields(children: Record<string, Owned>, extra: (key: string) => boolean = () => false): Owned {
  return { owns: (key) => key in children || extra(key), child: (key) => children[key] ?? DATA };
}

const plainFields = (...keys: string[]) => Object.fromEntries(keys.map((key) => [key, DATA]));
const isInstrument = (value: string) => (INSTRUMENTS as readonly string[]).includes(value);

const BEAT_OWNED = fields(
  {
    subdivision: DATA,
    hits: fields(Object.fromEntries(INSTRUMENTS.map((i) => [i, DATA]))),
    articulations: fields(
      Object.fromEntries(ARTICULATION_CONTAINERS.map((i) => [i, DATA])),
      (key) => key.includes(':') && isInstrument(key.split(':')[0]!),
    ),
  },
  (key) => key.startsWith(EMPHASIS_PREFIX),
);

const SONG_OWNED = fields({
  ...plainFields('v', 'id', 'title', 'tempo', 'meter', 'createdAt', 'updatedAt', 'revision'),
  patterns: fields({ ...plainFields('id', 'kind', 'name', 'color', 'meter', 'createdAt', 'updatedAt', 'revision'), beats: BEAT_OWNED }),
  segments: fields({
    ...plainFields('id', 'name'),
    blocks: fields({ id: DATA, bars: fields({ ...plainFields('id', 'beats', 'grooveId', 'fillId'), accents: DATA }) }),
  }),
});

function syncList(list: A.List<unknown>, target: Json[], byId: boolean, owned: Owned) {
  if (!byId) {
    const common = Math.min(list.length, target.length);
    for (let i = 0; i < common; i++) syncValue(list as unknown as Record<number, unknown>, i, target[i]!, owned);
    if (list.length > target.length) list.deleteAt(target.length, list.length - target.length);
    for (let i = list.length; i < target.length; i++) list.insertAt(i, toAutomerge(target[i]!));
    return;
  }
  const wanted = new Set(target.map(idOf));
  for (let i = list.length - 1; i >= 0; i--) if (!wanted.has(idOf(list[i]))) list.deleteAt(i);
  target.forEach((item, i) => {
    const id = idOf(item);
    if (i < list.length && idOf(list[i]) === id) {
      syncMap(list[i] as Record<string, unknown>, item as JsonObject, owned);
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

/** `owned` beschreibt den Wert unter `key`. */
function syncValue(parent: Record<string | number, unknown>, key: string | number, target: Json, owned: Owned) {
  const current = parent[key];
  if (key === 'revision' && A.isCounter(current) && typeof target === 'number') {
    const delta = target - current.value;
    if (delta !== 0) current.increment(delta);
  } else if (Array.isArray(target) && Array.isArray(current)) {
    syncList(current as A.List<unknown>, target, ID_LISTS.has(String(key)), owned);
  } else if (isObject(target) && isObject(current)) {
    syncMap(current, target as JsonObject, owned);
  } else if (plain(current) !== target || current === undefined) {
    parent[key] = toAutomerge(target, String(key));
  }
}

function syncMap(current: Record<string, unknown>, target: JsonObject, owned: Owned) {
  for (const key of Object.keys(current)) if (owned.owns(key) && !(key in target)) delete current[key];
  for (const [key, value] of Object.entries(target)) syncValue(current, key, value, owned.child(key));
}

/** Neues Dokument für einen Song; mit Nachricht trägt schon das Anlegen den Autor (song-history, design.md D1). */
export function createSongDoc(song: Song, message?: string): SongDocument {
  const shape = toAutomerge(toDocShape(song) as unknown as JsonObject) as Record<string, unknown>;
  if (message === undefined) return A.from(shape as { v: number });
  return A.change(A.init<{ v: number }>(), { message }, (d) => {
    Object.assign(d, shape);
  });
}

/** Überträgt einen Song als minimale Änderung ins Dokument; ein unveränderter Song erzeugt keine Änderung. */
export function applySong(doc: SongDocument, song: Song, message?: string): SongDocument {
  const target = toDocShape(song) as unknown as JsonObject;
  const apply = (d: unknown) => syncMap(d as Record<string, unknown>, target, SONG_OWNED);
  return message === undefined ? A.change(doc, apply) : A.change(doc, { message }, apply);
}

// --- Nachricht einer Änderung (song-history, design.md D1) ---------------------------

/** Autor einer Änderung und, bei einer Wiederherstellung, die Zeit des Zielstands (Unixzeit in Sekunden). */
export interface ChangeMeta {
  by?: string;
  restore?: number;
}

/** Nachricht für `applySong`; ohne Autor keine. */
export function changeMessage(meta: ChangeMeta): string | undefined {
  if (!meta.by) return undefined;
  return JSON.stringify(meta.restore === undefined ? { by: meta.by } : { by: meta.by, restore: meta.restore });
}

/** Liest eine Nachricht; was kein solches JSON ist, gilt als ohne Autor, unbekannte Felder werden ignoriert. */
export function readChangeMessage(message: string | null | undefined): ChangeMeta {
  if (!message) return {};
  let value: unknown;
  try {
    value = JSON.parse(message);
  } catch {
    return {};
  }
  if (!isObject(value) || typeof value.by !== 'string' || !value.by) return {};
  return typeof value.restore === 'number' && Number.isFinite(value.restore) ? { by: value.by, restore: value.restore } : { by: value.by };
}

/** Der Song eines Dokuments, fachlich normalisiert (design.md D6). */
export function songOf(doc: SongDocument): Song {
  return normalizeSong(fromDocShape(plain(doc) as unknown as SongDocShape));
}

/** Fester Vergleichswert: normalisierte Dokumentform mit sortierten Schlüsseln. */
const comparable = (song: Song) =>
  JSON.stringify(toDocShape(normalizeSong(song)), (_key, value: unknown) =>
    isObject(value) ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : value,
  );

/** Gleicher Inhalt, unabhängig von der Feldreihenfolge; die Herkunft des Dokuments zählt nicht. */
export function sameSong(a: Song, b: Song): boolean {
  return comparable(a) === comparable(b);
}

/** Führt zwei Fassungen zusammen, ohne eine davon zu verändern (design.md D7). */
export function mergeSongDocs(a: SongDocument, b: SongDocument): SongDocument {
  return A.merge(A.clone(a), b);
}
