import { describe, expect, it } from 'vitest';
import type { Pattern } from '../domain/types';
import { emptyBeats, patternOf } from '../test/patterns';
import { mergeImport } from './merge';

function version(base: Pattern, revision: number, updatedAt = '2026-11-01T10:00:00.000Z', name = base.name): Pattern {
  return { ...base, revision, updatedAt, name };
}

describe('Spec library-persistence › Import einer Bibliothek', () => {
  it('Neue Patterns importieren', () => {
    const local = [patternOf(emptyBeats(4))];
    const incoming = [patternOf(emptyBeats(4)), patternOf(emptyBeats(1), 'fill')];
    const { patterns, changed, summary } = mergeImport(local, incoming);
    expect(patterns.map((p) => p.id)).toEqual([local[0]!.id, incoming[0]!.id, incoming[1]!.id]);
    expect(changed).toEqual(incoming);
    expect(summary).toEqual({ added: 2, updated: 0, unchanged: 0 });
  });

  it('Neuere Fassung gewinnt', () => {
    const base = patternOf(emptyBeats(4));
    const local = version(base, 2, undefined, 'Lokal');
    const incoming = version(base, 5, undefined, 'Importiert');
    const { patterns, summary } = mergeImport([local], [incoming]);
    expect(patterns).toEqual([incoming]);
    expect(summary).toEqual({ added: 0, updated: 1, unchanged: 0 });
  });

  it('Ältere Fassung wird ignoriert', () => {
    const base = patternOf(emptyBeats(4));
    const local = version(base, 5, undefined, 'Lokal');
    const { patterns, changed, summary } = mergeImport([local], [version(base, 2, undefined, 'Importiert')]);
    expect(patterns).toEqual([local]);
    expect(changed).toEqual([]);
    expect(summary).toEqual({ added: 0, updated: 0, unchanged: 1 });
  });

  it('Gleiche Revision: späterer Änderungszeitpunkt gewinnt', () => {
    const base = patternOf(emptyBeats(4));
    const local = version(base, 3, '2026-11-01T10:00:00.000Z', 'Lokal');
    const newer = version(base, 3, '2026-11-01T11:00:00.000Z', 'Importiert');
    expect(mergeImport([local], [newer]).patterns).toEqual([newer]);
    expect(mergeImport([newer], [local]).patterns).toEqual([newer]);
  });

  it('Identische Fassung zählt als unverändert', () => {
    const local = patternOf(emptyBeats(4));
    expect(mergeImport([local], [structuredClone(local)]).summary).toEqual({ added: 0, updated: 0, unchanged: 1 });
  });
});
