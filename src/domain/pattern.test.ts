import { describe, expect, it } from 'vitest';
import {
  createPattern,
  duplicatePattern,
  groupLibrary,
  renamePattern,
  resizePattern,
  resizeWouldRemoveHits,
} from './pattern';
import type { Pattern } from './types';

const deps = (ids: string[] = ['id-1', 'id-2', 'id-3', 'id-4']) => {
  const queue = [...ids];
  return { now: () => new Date('2026-11-01T10:00:00.000Z'), newId: () => queue.shift()! };
};

function groove(name: string, existing: Pattern[] = []): Pattern {
  return createPattern(existing, { kind: 'groove', name }, deps([crypto.randomUUID()]));
}

describe('Spec pattern-library › Pattern anlegen', () => {
  it('Groove mit Standardwerten anlegen', () => {
    const p = createPattern([], { kind: 'groove' }, deps());
    expect(p.kind).toBe('groove');
    expect(p.beats).toHaveLength(4);
    expect(p.id).toBe('id-1');
    for (const beat of p.beats) {
      expect(beat.subdivision).toBe(4);
      expect(beat.hits).toEqual({});
    }
  });

  it('Groove mit Standardwerten anlegen: IDs sind eindeutig', () => {
    const a = createPattern([], { kind: 'groove' });
    const b = createPattern([a], { kind: 'groove' });
    expect(a.id).not.toBe(b.id);
  });

  it('Fill mit Standardwerten anlegen', () => {
    const p = createPattern([], { kind: 'fill' }, deps());
    expect(p.kind).toBe('fill');
    expect(p.beats).toHaveLength(1);
  });

  it.each([0, 17])('Ungültige Länge (%i)', (length) => {
    expect(() => createPattern([], { kind: 'groove', length }, deps())).toThrow(/1 bis 16/);
  });
});

describe('Spec pattern-library › Pattern-Namen', () => {
  it('Automatischer Name', () => {
    const g1 = createPattern([], { kind: 'groove' }, deps(['a']));
    const f1 = createPattern([g1], { kind: 'fill' }, deps(['b']));
    const g2 = createPattern([g1, f1], { kind: 'groove' }, deps(['c']));
    const g3 = createPattern([g1, f1, g2], { kind: 'groove' }, deps(['d']));
    expect(g1.name).toBe('Groove 1');
    expect(f1.name).toBe('Fill 1');
    expect(g3.name).toBe('Groove 3');
  });

  it('Leerer Name wird abgelehnt', () => {
    const p = groove('Verse');
    expect(renamePattern(p, '').name).toBe('Verse');
    expect(renamePattern(p, '   ').name).toBe('Verse');
    expect(renamePattern(p, 'Chorus').name).toBe('Chorus');
  });

  it('Doppelte Namen sind zulässig', () => {
    const a = groove('Verse');
    const b = groove('Verse', [a]);
    expect(b.name).toBe('Verse');
  });
});

describe('Spec pattern-library › Länge eines Patterns ändern', () => {
  it('Verlängern', () => {
    const p = groove('Verse');
    p.beats[0] = { subdivision: 4, hits: { kick: [0] } };
    const longer = resizePattern(p, 8);
    expect(longer.beats).toHaveLength(8);
    expect(longer.beats.slice(0, 4)).toEqual(p.beats);
    for (const beat of longer.beats.slice(4)) {
      expect(beat).toEqual({ subdivision: 4, hits: {} });
    }
  });

  it('Kürzen mit Inhalt: Bestätigung nötig', () => {
    const p = groove('Verse');
    p.beats[2] = { subdivision: 4, hits: { snare: [0] } };
    expect(resizeWouldRemoveHits(p, 2)).toBe(true);
  });

  it('Kürzen ohne Inhalt: keine Nachfrage', () => {
    const p = groove('Verse');
    p.beats[0] = { subdivision: 4, hits: { kick: [0] } };
    expect(resizeWouldRemoveHits(p, 2)).toBe(false);
    expect(resizePattern(p, 2).beats).toEqual(p.beats.slice(0, 2));
  });

  it('Ungültige Länge beim Ändern', () => {
    const p = groove('Verse');
    expect(() => resizePattern(p, 0)).toThrow(/1 bis 16/);
    expect(() => resizePattern(p, 17)).toThrow(/1 bis 16/);
  });
});

describe('Spec pattern-library › Pattern duplizieren', () => {
  it('Groove duplizieren', () => {
    const original = groove('Verse');
    original.beats[0] = { subdivision: 4, hits: { kick: [0], hihat: [0, 2] } };
    const copy = duplicatePattern(original, [original], deps(['copy-id']));
    expect(copy.name).toBe('Verse (Kopie)');
    expect(copy.id).toBe('copy-id');
    expect(copy.kind).toBe('groove');
    expect(copy.beats).toEqual(original.beats);

    copy.beats[0]!.hits.kick!.push(2);
    copy.beats[1] = { subdivision: 2, hits: {} };
    expect(original.beats[0]!.hits.kick).toEqual([0]);
    expect(original.beats[1]).toEqual({ subdivision: 4, hits: {} });
  });
});

describe('Spec pattern-library › Bibliotheksübersicht', () => {
  it('Gruppierte Übersicht', () => {
    const verse = groove('Verse');
    const chorus = groove('Chorus');
    const fill = createPattern([], { kind: 'fill', name: 'Tom-Run' });
    const { grooves, fills } = groupLibrary([verse, fill, chorus]);
    expect(grooves.map((p) => p.name)).toEqual(['Chorus', 'Verse']);
    expect(fills.map((p) => p.name)).toEqual(['Tom-Run']);
  });
});
