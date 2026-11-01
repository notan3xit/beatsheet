/** Alles, was nach Revision zusammengeführt wird (heute: Songs). */
export interface Versioned {
  id: string;
  revision: number;
  updatedAt: string;
}

export interface ImportSummary {
  added: number;
  updated: number;
  unchanged: number;
}

export interface MergeResult<T extends Versioned> {
  /** Bestand nach dem Import. */
  items: T[];
  /** Hinzugefügte und aktualisierte Einträge. */
  changed: T[];
  summary: ImportSummary;
}

const isNewer = (candidate: Versioned, current: Versioned) =>
  candidate.revision !== current.revision
    ? candidate.revision > current.revision
    : candidate.updatedAt > current.updatedAt;

/** Höhere Revision gewinnt, bei Gleichstand der spätere Änderungszeitpunkt. */
export function mergeImport<T extends Versioned>(local: readonly T[], incoming: readonly T[]): MergeResult<T> {
  const byId = new Map(local.map((item) => [item.id, item]));
  const changed: T[] = [];
  const summary: ImportSummary = { added: 0, updated: 0, unchanged: 0 };

  for (const item of incoming) {
    const current = byId.get(item.id);
    if (!current) {
      summary.added++;
    } else if (isNewer(item, current)) {
      summary.updated++;
    } else {
      summary.unchanged++;
      continue;
    }
    byId.set(item.id, item);
    changed.push(item);
  }

  return { items: [...byId.values()], changed, summary };
}
