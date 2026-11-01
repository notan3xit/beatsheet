import type { Pattern } from '../domain/types';

export interface ImportSummary {
  added: number;
  updated: number;
  unchanged: number;
}

export interface MergeResult {
  /** Bibliothek nach dem Import. */
  patterns: Pattern[];
  /** Hinzugefügte und aktualisierte Patterns. */
  changed: Pattern[];
  summary: ImportSummary;
}

const isNewer = (candidate: Pattern, current: Pattern) =>
  candidate.revision !== current.revision
    ? candidate.revision > current.revision
    : candidate.updatedAt > current.updatedAt;

/** Höhere Revision gewinnt, bei Gleichstand der spätere Änderungszeitpunkt. */
export function mergeImport(local: readonly Pattern[], incoming: readonly Pattern[]): MergeResult {
  const byId = new Map(local.map((p) => [p.id, p]));
  const changed: Pattern[] = [];
  const summary: ImportSummary = { added: 0, updated: 0, unchanged: 0 };

  for (const pattern of incoming) {
    const current = byId.get(pattern.id);
    if (!current) {
      summary.added++;
    } else if (isNewer(pattern, current)) {
      summary.updated++;
    } else {
      summary.unchanged++;
      continue;
    }
    byId.set(pattern.id, pattern);
    changed.push(pattern);
  }

  return { patterns: [...byId.values()], changed, summary };
}
