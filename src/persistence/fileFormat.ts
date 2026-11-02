import { z } from 'zod';
import { nextColor, type Deps } from '../domain/pattern';
import {
  ARTICULATED,
  ARTICULATIONS,
  INSTRUMENTS,
  MAX_BAR_BEATS,
  MAX_LENGTH,
  MIN_LENGTH,
  PATTERN_COLORS,
  SUBDIVISIONS,
  type Pattern,
  type Song,
} from '../domain/types';

export const FORMAT_ID = 'drumstuff.library';
export const SCHEMA_VERSION = 3;
export const IMPORTED_SONG_TITLE = 'Importierte Patterns';

const nonEmpty = (what: string) => z.string().refine((value) => value.trim().length > 0, `leerer ${what}`);
const positions = z.array(z.number().int().nonnegative());

const beatSchema = z
  .object({
    subdivision: z.union(SUBDIVISIONS.map((s) => z.literal(s))),
    hits: z.partialRecord(z.enum(INSTRUMENTS), positions),
    /** Seit Schemaversion 3: Spielweise je Instrument und Position (Schlüssel = Position als Ziffernfolge). */
    articulations: z
      .partialRecord(z.enum(ARTICULATED as [string, ...string[]]), z.record(z.string().regex(/^\d+$/), z.enum(ARTICULATIONS)))
      .optional(),
  })
  .strict()
  .superRefine((beat, ctx) => {
    for (const [instrument, byPosition] of Object.entries(beat.articulations ?? {})) {
      const set = beat.hits[instrument as keyof typeof beat.hits] ?? [];
      if (Object.keys(byPosition ?? {}).some((p) => !set.includes(Number(p)))) {
        ctx.addIssue({ code: 'custom', message: `${instrument}: Spielweise ohne Schlag` });
      }
    }
    for (const [instrument, list] of Object.entries(beat.hits)) {
      if (list?.some((p) => p >= beat.subdivision)) {
        ctx.addIssue({ code: 'custom', message: `${instrument}: Position außerhalb des Rasters` });
      }
    }
    if (beat.hits.hihat?.some((p) => beat.hits.hihatOpen?.includes(p))) {
      ctx.addIssue({ code: 'custom', message: 'offene und geschlossene Hi-Hat an derselben Position' });
    }
  });

const patternFields = {
  id: z.string().min(1),
  kind: z.enum(['groove', 'fill']),
  name: nonEmpty('Name'),
  beats: z.array(beatSchema).min(MIN_LENGTH).max(MAX_LENGTH),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  revision: z.number().int().positive(),
};

const patternSchema = z.object({ ...patternFields, color: z.enum(PATTERN_COLORS) }).strict();
/** Schemaversion 1: Patterns ohne Farbe. */
const patternV1Schema = z.object(patternFields).strict();

const accentSchema = z
  .object({
    instrument: z.enum(INSTRUMENTS),
    beat: z.number().int().nonnegative(),
    position: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  })
  .strict();

const barSchema = z
  .object({
    id: z.string().min(1),
    beats: z.number().int().min(1).max(MAX_BAR_BEATS),
    grooveId: z.string().nullable(),
    fillId: z.string().nullable(),
    accents: z.array(accentSchema),
  })
  .strict()
  .refine((bar) => bar.accents.every((a) => a.beat < bar.beats), 'Akzent außerhalb des Takts');

const songSchema = z
  .object({
    id: z.string().min(1),
    title: nonEmpty('Titel'),
    patterns: z.array(patternSchema),
    segments: z.array(
      z
        .object({
          id: z.string().min(1),
          name: nonEmpty('Name'),
          blocks: z.array(z.object({ id: z.string().min(1), bars: z.array(barSchema).min(1) }).strict()),
        })
        .strict(),
    ),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    revision: z.number().int().positive(),
  })
  .strict()
  .superRefine((song, ctx) => {
    const kinds = new Map(song.patterns.map((p) => [p.id, p.kind]));
    for (const bar of song.segments.flatMap((s) => s.blocks.flatMap((b) => b.bars))) {
      if (bar.grooveId !== null && kinds.get(bar.grooveId) !== 'groove') {
        ctx.addIssue({ code: 'custom', message: 'Groove-Verweis auf ein fremdes oder falsches Pattern' });
      }
      if (bar.fillId !== null && kinds.get(bar.fillId) !== 'fill') {
        ctx.addIssue({ code: 'custom', message: 'Fill-Verweis auf ein fremdes oder falsches Pattern' });
      }
    }
  });

/** Schemaversion 2 und 3 teilen die Form; Version 2 enthält nur keine Spielweisen. */
const fileSchemaV2 = z.object({
  format: z.literal(FORMAT_ID),
  schemaVersion: z.union([z.literal(2), z.literal(3)]),
  exportedAt: z.iso.datetime(),
  songs: z.array(songSchema),
});

const fileSchemaV1 = z.object({
  format: z.literal(FORMAT_ID),
  schemaVersion: z.literal(1),
  exportedAt: z.iso.datetime(),
  patterns: z.array(patternV1Schema),
});

export type ParseResult = { ok: true; songs: Song[] } | { ok: false; error: string };

export function serializeNotebook(songs: readonly Song[], now: Date): string {
  return JSON.stringify(
    { format: FORMAT_ID, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), songs },
    null,
    2,
  );
}

export function exportFileName(now: Date): string {
  return `drumstuff-${now.toISOString().slice(0, 10)}.drumbook.json`;
}

/** Patterns der Vorversion (ohne Farbe) in einen neuen Song „Importierte Patterns“ packen. */
export function songFromV1Patterns(patterns: readonly Omit<Pattern, 'color'>[], deps?: Deps): Song {
  const colored: Pattern[] = [];
  for (const pattern of patterns) colored.push({ ...pattern, color: nextColor(colored) });
  const timestamp = (deps?.now() ?? new Date()).toISOString();
  return {
    id: deps?.newId() ?? crypto.randomUUID(),
    title: IMPORTED_SONG_TITLE,
    patterns: colored,
    segments: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    revision: 1,
  };
}

function describeIssue(path: PropertyKey[], what: 'Song' | 'Pattern'): string {
  const [, index, field] = path;
  if (typeof index !== 'number') return 'der Dateikopf ist ungültig';
  return `${what} ${index + 1} ist ungültig${field ? ` (Feld „${String(field)}“)` : ''}`;
}

/** Prüft eine Importdatei vollständig; bei jedem Fehler wird nichts übernommen. */
export function parseNotebookFile(text: string, deps?: Deps): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist kein gültiges JSON.' };
  }

  const header = z.object({ format: z.string(), schemaVersion: z.number() }).safeParse(data);
  if (!header.success || header.data.format !== FORMAT_ID) {
    return { ok: false, error: 'Die Datei ist keine Drumstuff-Bibliothek.' };
  }
  if (header.data.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Die Datei wurde mit einer neueren Version von Drumstuff erstellt (Schemaversion ${header.data.schemaVersion}) und kann nicht importiert werden.`,
    };
  }

  if (header.data.schemaVersion === 1) {
    const v1 = fileSchemaV1.safeParse(data);
    if (!v1.success) {
      return { ok: false, error: `Die Datei ist beschädigt: ${describeIssue(v1.error.issues[0]!.path, 'Pattern')}. Es wurde nichts importiert.` };
    }
    return { ok: true, songs: [songFromV1Patterns(v1.data.patterns as Omit<Pattern, 'color'>[], deps)] };
  }

  const parsed = fileSchemaV2.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: `Die Datei ist beschädigt: ${describeIssue(parsed.error.issues[0]!.path, 'Song')}. Es wurde nichts importiert.` };
  }
  return { ok: true, songs: parsed.data.songs as Song[] };
}
