import { newId } from './id';
import {
  DEFAULT_SUBDIVISION,
  MAX_LENGTH,
  MIN_LENGTH,
  PATTERN_COLORS,
  type Beat,
  type Pattern,
  type PatternColor,
  type PatternKind,
} from './types';

export interface Deps {
  now: () => Date;
  newId: () => string;
}

const defaultDeps: Deps = {
  now: () => new Date(),
  newId,
};

export class ValidationError extends Error {}

const KIND_LABELS: Record<PatternKind, string> = { groove: 'Groove', fill: 'Fill' };
const DEFAULT_LENGTH: Record<PatternKind, number> = { groove: 4, fill: 1 };

/** Erste noch freie Farbe der Reihenfolge; sind alle vergeben, zyklisch weiter. */
export function nextColor(existing: readonly Pattern[]): PatternColor {
  const used = new Set(existing.map((p) => p.color));
  return PATTERN_COLORS.find((c) => !used.has(c)) ?? PATTERN_COLORS[existing.length % PATTERN_COLORS.length]!;
}

export function emptyBeat(): Beat {
  return { subdivision: DEFAULT_SUBDIVISION, hits: {} };
}

export function beatHasHits(beat: Beat): boolean {
  return Object.values(beat.hits).some((positions) => positions && positions.length > 0);
}

function assertLength(length: number): void {
  if (!Number.isInteger(length) || length < MIN_LENGTH || length > MAX_LENGTH) {
    throw new ValidationError(`Die Länge muss eine ganze Zahl von ${MIN_LENGTH} bis ${MAX_LENGTH} Beats sein.`);
  }
}

export function createPattern(
  existing: readonly Pattern[],
  input: { kind: PatternKind; name?: string; length?: number },
  deps: Deps = defaultDeps,
): Pattern {
  const length = input.length ?? DEFAULT_LENGTH[input.kind];
  assertLength(length);
  const name = input.name?.trim()
    ? input.name.trim()
    : `${KIND_LABELS[input.kind]} ${existing.filter((p) => p.kind === input.kind).length + 1}`;
  const timestamp = deps.now().toISOString();
  return {
    id: deps.newId(),
    kind: input.kind,
    name,
    color: nextColor(existing),
    beats: Array.from({ length }, emptyBeat),
    createdAt: timestamp,
    updatedAt: timestamp,
    revision: 1,
  };
}

export function renamePattern(pattern: Pattern, name: string): Pattern {
  const trimmed = name.trim();
  if (!trimmed || trimmed === pattern.name) return pattern;
  return { ...pattern, name: trimmed };
}

export function resizeWouldRemoveHits(pattern: Pattern, length: number): boolean {
  return pattern.beats.slice(length).some(beatHasHits);
}

export function resizePattern(pattern: Pattern, length: number): Pattern {
  assertLength(length);
  if (length === pattern.beats.length) return pattern;
  const beats =
    length < pattern.beats.length
      ? pattern.beats.slice(0, length)
      : [...pattern.beats, ...Array.from({ length: length - pattern.beats.length }, emptyBeat)];
  return { ...pattern, beats };
}

export function duplicatePattern(pattern: Pattern, existing: readonly Pattern[], deps: Deps = defaultDeps): Pattern {
  const timestamp = deps.now().toISOString();
  return {
    ...structuredClone(pattern),
    id: deps.newId(),
    name: `${pattern.name} (Kopie)`,
    color: nextColor(existing),
    createdAt: timestamp,
    updatedAt: timestamp,
    revision: 1,
  };
}

/** Markiert eine Änderung: Revision +1 und neuer Änderungszeitpunkt. */
export function touch(pattern: Pattern, now: Date = new Date()): Pattern {
  return { ...pattern, revision: pattern.revision + 1, updatedAt: now.toISOString() };
}

const byName = (a: Pattern, b: Pattern) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });

export function groupLibrary(patterns: readonly Pattern[]): { grooves: Pattern[]; fills: Pattern[] } {
  return {
    grooves: patterns.filter((p) => p.kind === 'groove').sort(byName),
    fills: patterns.filter((p) => p.kind === 'fill').sort(byName),
  };
}
