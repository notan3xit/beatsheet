import { z } from 'zod';
import { INSTRUMENTS, MAX_LENGTH, MIN_LENGTH, SUBDIVISIONS, type Pattern } from '../domain/types';

export const FORMAT_ID = 'drumstuff.library';
export const SCHEMA_VERSION = 1;

const positions = z.array(z.number().int().nonnegative());

const beatSchema = z
  .object({
    subdivision: z.union(SUBDIVISIONS.map((s) => z.literal(s))),
    hits: z.partialRecord(z.enum(INSTRUMENTS), positions),
  })
  .strict()
  .superRefine((beat, ctx) => {
    for (const [instrument, list] of Object.entries(beat.hits)) {
      if (list?.some((p) => p >= beat.subdivision)) {
        ctx.addIssue({ code: 'custom', message: `${instrument}: Position außerhalb des Rasters` });
      }
    }
    if (beat.hits.hihat?.some((p) => beat.hits.hihatOpen?.includes(p))) {
      ctx.addIssue({ code: 'custom', message: 'offene und geschlossene Hi-Hat an derselben Position' });
    }
  });

const patternSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['groove', 'fill']),
    name: z.string().refine((name) => name.trim().length > 0, 'leerer Name'),
    beats: z.array(beatSchema).min(MIN_LENGTH).max(MAX_LENGTH),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    revision: z.number().int().positive(),
  })
  .strict();

const fileSchema = z.object({
  format: z.literal(FORMAT_ID),
  schemaVersion: z.literal(SCHEMA_VERSION),
  exportedAt: z.iso.datetime(),
  patterns: z.array(patternSchema),
});

export type ParseResult = { ok: true; patterns: Pattern[] } | { ok: false; error: string };

export function serializeLibrary(patterns: readonly Pattern[], now: Date): string {
  return JSON.stringify(
    { format: FORMAT_ID, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), patterns },
    null,
    2,
  );
}

export function exportFileName(now: Date): string {
  return `drumstuff-${now.toISOString().slice(0, 10)}.drumbook.json`;
}

/** Prüft eine Importdatei vollständig; bei jedem Fehler wird nichts übernommen. */
export function parseLibraryFile(text: string): ParseResult {
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

  const parsed = fileSchema.safeParse(data);
  if (!parsed.success) {
    const [, index, field] = parsed.error.issues[0]!.path;
    const where =
      typeof index === 'number'
        ? `Pattern ${index + 1} ist ungültig${field ? ` (Feld „${String(field)}“)` : ''}`
        : 'der Dateikopf ist ungültig';
    return { ok: false, error: `Die Datei ist beschädigt: ${where}. Es wurde nichts importiert.` };
  }
  return { ok: true, patterns: parsed.data.patterns as Pattern[] };
}
