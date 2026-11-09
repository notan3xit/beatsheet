import * as A from '@automerge/automerge/slim';
import { beforeAll, describe, expect, it } from 'vitest';
import { initAutomerge } from './songDoc';
import { changesAllowed, createWorkbookDoc, isValidWorkbookDoc, markSeen, orderOf, setPositions, withOrder, type WorkbookDocument } from './workbookDoc';

const ME = 'ich@example.com';
const MAX = 'max@example.com';
const HEADS = ['a'.repeat(64)];

beforeAll(initAutomerge);

/** Ein Dokument in der Form vor sort-songs. */
const withoutOrder = (): WorkbookDocument =>
  A.change(A.init<{ v: number }>(), (d) => {
    Object.assign(d, { v: 1, seen: {} });
  });

const allowed = (doc: WorkbookDocument, next: WorkbookDocument, email: string, personal = false) =>
  changesAllowed(next, A.getHeads(doc), A.getHeads(next), email, personal);

describe('Spec workbook-sync › Reihenfolge im Workbook-Dokument', () => {
  it('legt die Reihenfolge mit dem Dokument an', () => {
    expect(orderOf(createWorkbookDoc())).toEqual({});
  });

  it('kennt ohne Feld keine Reihenfolge und ergänzt sie', () => {
    const old = withoutOrder();
    expect(orderOf(old)).toBeNull();
    const migrated = withOrder(old);
    expect(orderOf(migrated)).toEqual({});
    expect(withOrder(migrated)).toBe(migrated);
  });

  it('setzt und liest Positionen', () => {
    const doc = setPositions(createWorkbookDoc(), { intro: 'a0', outro: 'a1' });
    expect(orderOf(doc)).toEqual({ intro: 'a0', outro: 'a1' });
    expect(orderOf(setPositions(doc, { intro: 'a2' }))).toEqual({ intro: 'a2', outro: 'a1' });
  });

  it('lässt ein Dokument ohne Reihenfolge und unveränderte Positionen unverändert', () => {
    const old = withoutOrder();
    expect(setPositions(old, { intro: 'a0' })).toBe(old);
    const doc = setPositions(createWorkbookDoc(), { intro: 'a0' });
    expect(setPositions(doc, { intro: 'a0' })).toBe(doc);
  });

  it('prüft die Form der Positionen', () => {
    const doc = setPositions(createWorkbookDoc(), { intro: 'a0' });
    expect(isValidWorkbookDoc(doc)).toBe(true);
    expect(isValidWorkbookDoc(withoutOrder())).toBe(true);
    const broken = [
      A.change(A.clone(doc), (d: Record<string, unknown>) => void ((d.order as Record<string, unknown>).intro = 'a-0')),
      A.change(A.clone(doc), (d: Record<string, unknown>) => void ((d.order as Record<string, unknown>).intro = new A.ImmutableString(''))),
      A.change(A.clone(doc), (d: Record<string, unknown>) => void ((d.order as Record<string, unknown>).intro = new A.ImmutableString('a'.repeat(201)))),
      A.change(A.clone(doc), (d: Record<string, unknown>) => void ((d.order as Record<string, unknown>).intro = 7)),
      A.change(A.clone(doc), (d: Record<string, unknown>) => void (d.order = 'kaputt')),
    ];
    for (const next of broken) expect(isValidWorkbookDoc(next)).toBe(false);
  });

  it('erlaubt jedem Mitglied Positionen, auch fremd gesetzte', () => {
    const doc = setPositions(createWorkbookDoc(), { intro: 'a0' });
    expect(allowed(doc, setPositions(A.clone(doc), { intro: 'a1', outro: 'a2' }), MAX)).toBe(true);
    expect(allowed(doc, setPositions(A.clone(doc), { intro: 'a1' }), ME, true)).toBe(true);
  });

  it('erlaubt gesehene Stände nur eigene und nur in gemeinsamen Workbooks', () => {
    const doc = createWorkbookDoc();
    const seen = markSeen(A.clone(doc), ME, { intro: HEADS });
    expect(allowed(doc, seen, ME)).toBe(true);
    expect(allowed(doc, seen, MAX)).toBe(false);
    expect(allowed(doc, seen, ME, true)).toBe(false);
  });

  it('führt gleichzeitig gesetzte Positionen desselben Songs zu demselben Wert zusammen', () => {
    const base = setPositions(createWorkbookDoc(), { intro: 'a0' });
    const mine = setPositions(A.clone(base, { actor: '01'.repeat(16) }), { intro: 'Zz' });
    const his = setPositions(A.clone(base, { actor: '02'.repeat(16) }), { intro: 'a5' });
    const left = A.merge(A.clone(mine), his);
    const right = A.merge(A.clone(his), mine);
    expect(orderOf(left)).toEqual(orderOf(right));
    expect(['Zz', 'a5']).toContain(orderOf(left)!.intro);
  });
});
