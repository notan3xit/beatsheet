import { describe, expect, it } from 'vitest';
import type { Deps } from '../domain/pattern';
import { appendSegment } from '../domain/structure';
import type { Song } from '../domain/types';
import { songWith } from '../test/songs';
import { applyImport, planImport, type ImportEntry } from './merge';

const NOW = new Date('2026-11-03T12:00:00.000Z');
const deps = (ids: string[] = ['kopie-1', 'kopie-2', 'kopie-3']): Deps => ({ now: () => NOW, newId: () => ids.shift()! });

function version(base: Song, revision: number, updatedAt = '2026-11-01T10:00:00.000Z', title = base.title): Song {
  return { ...base, revision, updatedAt, title };
}

const choices = (plan: ImportEntry[]) => plan.map((e) => e.choice);

/** Wählt für den Eintrag an Position `index`. */
function choose(plan: ImportEntry[], index: number, choice: ImportEntry['choice']): ImportEntry[] {
  return plan.map((e, i) => (i === index ? ({ ...e, choice } as ImportEntry) : e));
}

describe('Spec library-persistence › Import einer Bibliothek', () => {
  it('Neue Patterns importieren', () => {
    const local = [songWith({ title: 'Lokal' })];
    const incoming = [songWith({ title: 'A', groove: true }), songWith({ title: 'B', groove: true })];
    const plan = planImport(local, incoming, { fromNewerVersion: false });
    expect(plan.map((e) => e.kind)).toEqual(['new', 'new']);
    expect(choices(plan)).toEqual(['add', 'add']);
    const { songs, summary } = applyImport(plan, deps());
    expect(songs).toEqual(incoming);
    expect(summary).toEqual({ added: 2, replaced: 0, copied: 0, skipped: 0 });
  });

  it('Neuere Fassung gewinnt', () => {
    const base = songWith({ title: 'Hysteria', groove: true });
    const local = version(base, 2);
    const incoming = version(appendSegment(base, { name: 'Verse', bars: 8 }), 5, undefined, 'Importiert');
    const plan = planImport([local], [incoming], { fromNewerVersion: false });
    expect(plan[0]).toMatchObject({ kind: 'existing', existing: local, newer: 'file', choice: 'replace' });
    const { songs, summary } = applyImport(plan, deps());
    expect(songs).toEqual([incoming]);
    expect(summary).toEqual({ added: 0, replaced: 1, copied: 0, skipped: 0 });
  });

  it('Ältere Fassung wird ignoriert', () => {
    const base = songWith({ title: 'Hysteria' });
    const plan = planImport([version(base, 5)], [version(base, 2, undefined, 'Alt')], { fromNewerVersion: false });
    expect(plan[0]).toMatchObject({ newer: 'local', choice: 'skip' });
    const { songs, summary } = applyImport(plan, deps());
    expect(songs).toEqual([]);
    expect(summary).toEqual({ added: 0, replaced: 0, copied: 0, skipped: 1 });
  });
});

describe('Spec library-persistence › Import aus einer neueren Version', () => {
  it('Vorhandener Song aus neuerer Version', () => {
    const base = songWith({ title: 'Hysteria' });
    const fresh = songWith({ title: 'Neu' });
    const plan = planImport([version(base, 2)], [version(base, 5), fresh], { fromNewerVersion: true });
    expect(choices(plan)).toEqual(['copy', 'add']);
    expect(plan[0]).toMatchObject({ newer: 'file' });
  });
});

describe('Spec library-persistence › Auswahl im Import-Dialog', () => {
  it('Vorbelegung nach Revision', () => {
    const a = songWith({ title: 'A' });
    const b = songWith({ title: 'B' });
    const plan = planImport([version(a, 2), version(b, 5)], [version(a, 3), version(b, 4)], { fromNewerVersion: false });
    expect(choices(plan)).toEqual(['replace', 'skip']);
  });

  it('Gleiche Revision', () => {
    const base = songWith({});
    const older = version(base, 3, '2026-11-01T10:00:00.000Z', 'Älter');
    const newer = version(base, 3, '2026-11-01T11:00:00.000Z', 'Neuer');
    expect(planImport([older], [newer], { fromNewerVersion: false })[0]).toMatchObject({ newer: 'file', choice: 'replace' });
    expect(planImport([newer], [older], { fromNewerVersion: false })[0]).toMatchObject({ newer: 'local', choice: 'skip' });
  });

  it('Ältere Fassung ersetzen', () => {
    const base = songWith({ title: 'Hysteria', groove: true });
    const old = version(appendSegment(base, { name: 'Intro', bars: 2 }), 2, undefined, 'Alt');
    const plan = choose(planImport([version(base, 5)], [old], { fromNewerVersion: false }), 0, 'replace');
    const { songs, summary } = applyImport(plan, deps());
    expect(songs).toHaveLength(1);
    const [song] = songs;
    expect(song!.id).toBe(base.id);
    expect(song!.title).toBe('Alt');
    expect(song!.segments).toEqual(old.segments);
    expect(song!.patterns).toEqual(old.patterns);
    expect(song!.revision).toBe(6);
    expect(song!.updatedAt).toBe(NOW.toISOString());
    expect(summary).toEqual({ added: 0, replaced: 1, copied: 0, skipped: 0 });
  });

  it('Neuen Song überspringen', () => {
    const incoming = [songWith({ title: 'A' }), songWith({ title: 'B' })];
    const plan = choose(planImport([], incoming, { fromNewerVersion: false }), 0, 'skip');
    const { songs, summary } = applyImport(plan, deps());
    expect(songs).toEqual([incoming[1]]);
    expect(summary).toEqual({ added: 1, replaced: 0, copied: 0, skipped: 1 });
  });

  it('Gemischte Auswahl', () => {
    const [a, b, c] = [songWith({ title: 'A' }), songWith({ title: 'B' }), songWith({ title: 'C' })];
    const fresh = songWith({ title: 'Neu' });
    let plan = planImport([a, b, c], [fresh, version(a!, 2), version(b!, 2), version(c!, 2)], { fromNewerVersion: false });
    plan = choose(choose(choose(plan, 1, 'replace'), 2, 'copy'), 3, 'skip');
    const { songs, summary } = applyImport(plan, deps());
    expect(songs.map((s) => s.title)).toEqual(['Neu', 'A', 'B (Kopie)']);
    expect(summary).toEqual({ added: 1, replaced: 1, copied: 1, skipped: 1 });
  });
});

describe('Spec library-persistence › Import als Kopie', () => {
  it('Kopie neben dem Original', () => {
    const base = songWith({ title: 'Intro', groove: true });
    const incoming = version(appendSegment(base, { name: 'Verse', bars: 4 }), 7);
    const plan = choose(planImport([base], [incoming], { fromNewerVersion: false }), 0, 'copy');
    const { songs, summary } = applyImport(plan, deps());
    expect(songs).toEqual([
      {
        ...incoming,
        id: 'kopie-1',
        title: 'Intro (Kopie)',
        revision: 1,
        createdAt: NOW.toISOString(),
        updatedAt: NOW.toISOString(),
      },
    ]);
    expect(summary).toEqual({ added: 0, replaced: 0, copied: 1, skipped: 0 });
  });
});
