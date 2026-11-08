import * as A from '@automerge/automerge/slim';

/** Gesehene Stände je Adresse und Song (song-activity, design.md D1). */
export type WorkbookDocument = A.Doc<{ v: number }>;

type Entries = Record<string, A.Heads>;

const HEADS = /^[0-9a-f]{64}(,[0-9a-f]{64})*$/;
const VERSION = 1;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown) => (A.isImmutableString(value) ? value.toString() : undefined);
const joined = (heads: A.Heads) => [...heads].sort().join(',');

/** Nur der Server legt es an, damit alle Fassungen eine Herkunft haben (design.md D2). */
export function createWorkbookDoc(): WorkbookDocument {
  return A.change(A.init<{ v: number }>(), (d) => {
    Object.assign(d, { v: VERSION, seen: {} });
  });
}

/** Gesehene Stände einer Adresse; `null`, solange sie keinen Eintrag hat. */
export function seenOf(doc: WorkbookDocument, email: string): Entries | null {
  const seen = (doc as unknown as { seen?: Record<string, unknown> }).seen;
  const own = seen?.[email];
  if (!isObject(own)) return null;
  const entries: Entries = {};
  for (const [id, value] of Object.entries(own)) {
    const heads = text(value);
    if (heads) entries[id] = heads.split(',');
  }
  return entries;
}

/** Setzt eigene Einträge; ändert sich nichts, bleibt das Dokument dasselbe. */
export function markSeen(doc: WorkbookDocument, email: string, entries: Entries): WorkbookDocument {
  const current = seenOf(doc, email);
  const changed = Object.entries(entries).filter(([id, heads]) => !current?.[id] || joined(current[id]!) !== joined(heads));
  if (current && changed.length === 0) return doc;
  return A.change(doc, (d) => {
    const seen = (d as unknown as { seen: Record<string, Record<string, unknown>> }).seen;
    seen[email] ??= {};
    for (const [id, heads] of changed) seen[email]![id] = new A.ImmutableString(joined(heads));
  });
}

/** Form nach design.md D1, ohne fehlende Abhängigkeiten. */
export function isValidWorkbookDoc(doc: WorkbookDocument): boolean {
  try {
    if (A.getMissingDeps(doc, []).length > 0) return false;
    const { v, seen } = doc as unknown as Record<string, unknown>;
    if (v !== VERSION || !isObject(seen)) return false;
    return Object.values(seen).every((own) => isObject(own) && Object.values(own).every((value) => HEADS.test(text(value) ?? '')));
  } catch {
    return false;
  }
}

/** Berühren die Changes zwischen `before` und `after` nur Einträge von `email`? (design.md D3) */
export function changesOnlyOwn(doc: WorkbookDocument, before: A.Heads, after: A.Heads, email: string): boolean {
  return A.diff(doc, before, after).every(({ path }) => path[0] === 'seen' && path[1] === email && path.length >= 2);
}
