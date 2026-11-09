import * as A from '@automerge/automerge/slim';
import type { Positions } from '../domain/songOrder';

/** Gesehene Stände je Adresse und Song (song-activity, design.md D1) und Positionen je Song (sort-songs, design.md D1). */
export type WorkbookDocument = A.Doc<{ v: number }>;

type Entries = Record<string, A.Heads>;

const HEADS = /^[0-9a-f]{64}(,[0-9a-f]{64})*$/;
const POSITION = /^[0-9A-Za-z]{1,200}$/;
const VERSION = 1;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown) => (A.isImmutableString(value) ? value.toString() : undefined);
const joined = (heads: A.Heads) => [...heads].sort().join(',');
const fields = (doc: WorkbookDocument) => doc as unknown as Record<string, unknown>;

/** Nur der Server legt es an, damit alle Fassungen eine Herkunft haben (design.md D2). */
export function createWorkbookDoc(): WorkbookDocument {
  return A.change(A.init<{ v: number }>(), (d) => {
    Object.assign(d, { v: VERSION, seen: {}, order: {} });
  });
}

/** Ergänzt die Reihenfolge in einem älteren Dokument; nur der Server (sort-songs, design.md D2). */
export function withOrder(doc: WorkbookDocument): WorkbookDocument {
  if (isObject(fields(doc).order)) return doc;
  return A.change(doc, (d) => {
    Object.assign(d, { order: {} });
  });
}

/** Gesehene Stände einer Adresse; `null`, solange sie keinen Eintrag hat. */
export function seenOf(doc: WorkbookDocument, email: string): Entries | null {
  const seen = fields(doc).seen as Record<string, unknown> | undefined;
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

/** Positionen der Songs; `null`, solange das Dokument keine Reihenfolge hat (sort-songs, design.md D2). */
export function orderOf(doc: WorkbookDocument): Positions | null {
  const order = fields(doc).order;
  if (!isObject(order)) return null;
  const positions: Positions = {};
  for (const [id, value] of Object.entries(order)) {
    const position = text(value);
    if (position) positions[id] = position;
  }
  return positions;
}

/** Setzt Positionen als Einzelwerte; ohne Reihenfolge oder ohne Änderung bleibt das Dokument dasselbe. */
export function setPositions(doc: WorkbookDocument, entries: Positions): WorkbookDocument {
  const current = orderOf(doc);
  if (!current) return doc;
  const changed = Object.entries(entries).filter(([id, position]) => current[id] !== position);
  if (changed.length === 0) return doc;
  return A.change(doc, (d) => {
    const order = (d as unknown as { order: Record<string, unknown> }).order;
    for (const [id, position] of changed) order[id] = new A.ImmutableString(position);
  });
}

/** Form nach design.md D1, ohne fehlende Abhängigkeiten. */
export function isValidWorkbookDoc(doc: WorkbookDocument): boolean {
  try {
    if (A.getMissingDeps(doc, []).length > 0) return false;
    const { v, seen, order } = fields(doc);
    if (v !== VERSION || !isObject(seen)) return false;
    if (order !== undefined && !(isObject(order) && Object.values(order).every((value) => POSITION.test(text(value) ?? '')))) return false;
    return Object.values(seen).every((own) => isObject(own) && Object.values(own).every((value) => HEADS.test(text(value) ?? '')));
  } catch {
    return false;
  }
}

/**
 * Berühren die Changes zwischen `before` und `after` nur Erlaubtes? Positionen darf jedes Mitglied ändern,
 * gesehene Stände nur die eigenen und nur in gemeinsamen Workbooks (sort-songs, design.md D4).
 */
export function changesAllowed(doc: WorkbookDocument, before: A.Heads, after: A.Heads, email: string, personal: boolean): boolean {
  return A.diff(doc, before, after).every(
    ({ path }) => (path[0] === 'order' && path.length >= 2) || (!personal && path[0] === 'seen' && path[1] === email && path.length >= 2),
  );
}
