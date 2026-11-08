import { describe, expect, it } from 'vitest';
import { songWith } from '../test/songs';
import {
  compareHits,
  editDiff,
  groupEdits,
  hitKey,
  patternSubject,
  restoreConsequences,
  restoreTarget,
  structureChanges,
  type HistoryInput,
  type Step,
  type Subject,
} from './history';
import { createPattern, duplicatePattern, renamePattern, resizePattern } from './pattern';
import { changeSubdivision, cycleArticulation, toggleHit } from './sequencer';
import { addPattern, removePattern } from './songPatterns';
import { appendSegment, deleteBar, moveSegment, renameSegment, setBarProps } from './structure';
import type { Pattern, Song } from './types';

const DAY = 86_400;
/** Gegenstand: das im Schritt neu entstandene Pattern. */
const newPattern = (before: Song, after: Song) => patternSubject(after.patterns.find((p) => !before.patterns.some((q) => q.id === p.id))!.id);

/** Montag, 2. November 2026, 12:00 UTC; Mittag, damit Zeitzonen den Tag nicht verschieben. */
const MONDAY = Date.UTC(2026, 10, 2, 12) / 1000;

const ARTJOM = 'artjom@example.com';
const MAX = 'max@example.org';

/** Baut eine Historie Schritt für Schritt; jeder Schritt nennt seinen Gegenstand selbst. */
function historyOf(start: Song) {
  const songs: Song[] = [start];
  const steps: Step[] = [{ time: MONDAY, author: ARTJOM, subject: 'song' }];
  const api = {
    get song() {
      return songs.at(-1)!;
    },
    /** `subject` als Funktion, wenn er erst im neuen Stand feststeht (etwa die ID eines neuen Patterns). */
    step(
      change: (song: Song) => Song,
      subject: Subject | ((before: Song, after: Song) => Subject),
      { author = ARTJOM, time = steps.at(-1)!.time + 10 }: { author?: string | null; time?: number } = {},
    ) {
      const before = songs.at(-1)!;
      const after = change(before);
      songs.push(after);
      steps.push({ time, author, subject: typeof subject === 'function' ? subject(before, after) : subject });
      return api;
    },
    patternStep(name: string, change: (pattern: Pattern) => Pattern, options?: { author?: string | null; time?: number }) {
      const id = api.pattern(name).id;
      return api.step((s) => ({ ...s, patterns: s.patterns.map((p) => (p.id === id ? change(p) : p)) }), patternSubject(id), options);
    },
    pattern(name: string) {
      return songs.at(-1)!.patterns.find((p) => p.name === name)!;
    },
    get input(): HistoryInput {
      return { steps, songAt: (i) => songs[i] ?? null };
    },
  };
  return api;
}

/** Song mit „Verse“ (ein Ride-Schlag im letzten Beat, also keine leere Neuanlage) und „Chorus“, Segment „Intro“ mit 4 Takten. */
function start(): Song {
  const verse = toggleHit(createPattern([], { kind: 'groove', name: 'Verse' }), 3, 'ride', 0);
  const chorus = createPattern([verse], { kind: 'groove', name: 'Chorus' });
  return appendSegment(songWith({ patterns: [verse, chorus] }), { name: 'Intro', bars: 4 });
}

const hit = (position: number, beat = 0) => (p: Pattern) => toggleHit(p, beat, 'kick', position);
const subjects = (h: ReturnType<typeof historyOf>) => groupEdits(h.input).map((e) => e.subject);
const bars = (song: Song) => song.segments.flatMap((s) => s.blocks.flatMap((b) => b.bars));

describe('Spec song-history › Bearbeitungen', () => {
  it('Viele Klicks', () => {
    const h = historyOf(start());
    for (let i = 0; i < 40; i++) h.patternStep('Verse', hit(i % 4, Math.floor(i / 4) % 4));
    const edits = groupEdits(h.input);
    expect(edits).toHaveLength(2);
    expect(edits[1]).toMatchObject({ subject: patternSubject(h.pattern('Verse').id), first: 1, last: 40, from: 0 });
  });

  it('Unterbrechung', () => {
    const h = historyOf(start());
    const verse = h.pattern('Verse').id;
    h.patternStep('Verse', hit(0))
      .step((s) => setBarProps(s, [bars(s)[0]!.id], { grooveId: verse }), 'structure')
      .patternStep('Verse', hit(1));
    expect(subjects(h)).toEqual(['song', patternSubject(verse), 'structure', patternSubject(verse)]);
  });

  it('Neuer Tag', () => {
    const h = historyOf(start());
    h.patternStep('Verse', hit(0)).patternStep('Verse', hit(1), { time: MONDAY + DAY });
    expect(groupEdits(h.input)).toHaveLength(3);
  });

  it('Anderer Autor beginnt eine neue Bearbeitung', () => {
    const h = historyOf(start());
    h.patternStep('Verse', hit(0)).patternStep('Verse', hit(1), { author: MAX });
    expect(groupEdits(h.input).map((e) => e.author)).toEqual([ARTJOM, ARTJOM, MAX]);
  });
});

describe('Spec song-history › Leere Neuanlage', () => {
  it('Fill anlegen, zuweisen, ausarbeiten', () => {
    const h = historyOf(start());
    h.step((s) => addPattern(s, { kind: 'fill', name: 'Fill 1' }).song, newPattern);
    const fillId = h.pattern('Fill 1').id;
    h.patternStep('Fill 1', (p) => renamePattern(p, 'Intro Fill'))
      .step((s) => setBarProps(s, [bars(s)[3]!.id], { fillId }), 'structure')
      .patternStep('Intro Fill', hit(2));

    const edits = groupEdits(h.input);
    expect(edits.map((e) => e.subject)).toEqual(['song', 'structure', patternSubject(fillId)]);
    const created = edits[2]!;
    expect(created).toMatchObject({ created: true, from: 0 });
    const diff = editDiff(created, h.input);
    expect(diff).toMatchObject({ kind: 'pattern', status: 'added' });
  });

  it('Aus der Struktur angelegt', () => {
    const h = historyOf(start());
    h.step((s) => {
      const { song, pattern } = addPattern(s, { kind: 'fill', name: 'Fill 1' });
      return setBarProps(song, [bars(song)[3]!.id], { fillId: pattern.id });
    }, 'structure');
    const fillId = h.pattern('Fill 1').id;
    h.patternStep('Fill 1', hit(2));
    const edits = groupEdits(h.input);
    expect(edits.map((e) => e.subject)).toEqual(['song', 'structure', patternSubject(fillId)]);
    expect(edits[2]).toMatchObject({ created: true, from: 0 });
  });

  it('Kopie', () => {
    const h = historyOf(start());
    h.patternStep('Verse', hit(0));
    const copy = duplicatePattern(h.pattern('Verse'), h.song.patterns);
    h.step((s) => ({ ...s, patterns: [...s.patterns, copy] }), patternSubject(copy.id))
      .patternStep(copy.name, hit(1))
      .step((s) => setBarProps(s, [bars(s)[0]!.id], { grooveId: copy.id }), 'structure')
      .patternStep(copy.name, (p) => renamePattern(p, 'Verse 2'));

    const edits = groupEdits(h.input);
    expect(edits.map((e) => e.subject)).toEqual(['song', patternSubject(h.pattern('Verse').id), patternSubject(copy.id), 'structure', patternSubject(copy.id)]);
    expect(editDiff(edits[2]!, h.input)).toMatchObject({ status: 'added', copyOf: h.pattern('Verse').id });
    expect(editDiff(edits[4]!, h.input)).toMatchObject({ status: 'changed', name: { from: copy.name, to: 'Verse 2' } });
  });

  it('Ein Pattern mit Schlägen wird nicht über eine Unterbrechung zusammengefasst', () => {
    const h = historyOf(start());
    h.step((s) => {
      const { song, pattern } = addPattern(s, { kind: 'groove', name: 'Groove 3' });
      return { ...song, patterns: song.patterns.map((p) => (p.id === pattern.id ? toggleHit(p, 0, 'kick', 0) : p)) };
    }, newPattern);
    const id = h.pattern('Groove 3').id;
    h.step((s) => setBarProps(s, [bars(s)[0]!.id], { grooveId: id }), 'structure').patternStep('Groove 3', hit(1));
    expect(groupEdits(h.input).map((e) => e.subject)).toEqual(['song', patternSubject(id), 'structure', patternSubject(id)]);
  });
});

describe('Spec song-history › Liste der Bearbeitungen', () => {
  it('Zusammenfassung', () => {
    const h = historyOf(start());
    // Vorher zwei Schläge im dritten Beat, dann eine andere Bearbeitung
    h.patternStep('Verse', hit(0, 2)).patternStep('Verse', hit(1, 2)).step((s) => ({ ...s, tempo: 100 }), 'song');
    // Sechs setzen (einen davon zwischendurch wieder entfernt und neu gesetzt), die zwei alten entfernen
    for (const p of [0, 1, 2, 3]) h.patternStep('Verse', hit(p));
    h.patternStep('Verse', hit(3)).patternStep('Verse', hit(3));
    for (const p of [0, 1]) h.patternStep('Verse', hit(p, 1));
    for (const p of [0, 1]) h.patternStep('Verse', hit(p, 2));
    const diff = editDiff(groupEdits(h.input).at(-1)!, h.input);
    expect(diff).toMatchObject({ kind: 'pattern', status: 'changed', hits: { added: 6, removed: 2, changed: 0 } });
  });

  it('Hin und zurück', () => {
    const h = historyOf(start());
    h.patternStep('Verse', hit(0)).patternStep('Verse', hit(0));
    expect(editDiff(groupEdits(h.input)[1]!, h.input)).toMatchObject({ status: 'unchanged' });
  });
});

describe('Spec song-history › Vergleich eines Patterns', () => {
  const diffOf = (change: (p: Pattern) => Pattern, prepare?: (p: Pattern) => Pattern) => {
    const h = historyOf(start());
    if (prepare) h.patternStep('Verse', prepare).step((s) => s, 'song');
    h.patternStep('Verse', change);
    return editDiff(groupEdits(h.input).at(-1)!, h.input);
  };

  it('Umbenannt, Länge, Farbe, Taktart', () => {
    expect(diffOf((p) => renamePattern(p, 'Strophe'))).toMatchObject({ name: { from: 'Verse', to: 'Strophe' } });
    expect(diffOf((p) => resizePattern(p, 6))).toMatchObject({ length: { from: 4, to: 6 } });
    expect(diffOf((p) => ({ ...p, color: 'mauve' }))).toMatchObject({ color: { to: 'mauve' } });
    expect(diffOf((p) => ({ ...p, meter: 3 }))).toMatchObject({ meter: { from: null, to: 3 } });
  });

  it('Schläge neu, geändert, entfernt', () => {
    const diff = diffOf(
      (p) => toggleHit(cycleArticulation(toggleHit(p, 0, 'kick', 0), 0, 'snare', 1), 1, 'kick', 2),
      (p) => toggleHit(toggleHit(p, 0, 'kick', 0), 0, 'snare', 1),
    );
    expect(diff).toMatchObject({ hits: { added: 1, removed: 1, changed: 1 } });
  });

  it('Unterteilung gewechselt', () => {
    const diff = diffOf(
      (p) => changeSubdivision(p, 0, 8).pattern,
      (p) => toggleHit(toggleHit(p, 0, 'snare', 1), 0, 'kick', 2),
    );
    expect(diff).toMatchObject({ hits: { added: 0, removed: 0, changed: 0 } });
  });

  it('Gelöscht', () => {
    const h = historyOf(start());
    const id = h.pattern('Chorus').id;
    h.step((s) => removePattern(s, id), patternSubject(id));
    expect(editDiff(groupEdits(h.input).at(-1)!, h.input)).toMatchObject({ kind: 'pattern', status: 'removed' });
  });
});

describe('Spec song-history › Markierungen im Vergleichs-Sequencer', () => {
  it('Spielweise geändert und Lage im Beat', () => {
    const verse = createPattern([], { kind: 'groove', name: 'Verse' });
    const before = cycleArticulation(toggleHit(verse, 0, 'snare', 1), 0, 'snare', 1); // Flam
    const after = cycleArticulation(before, 0, 'snare', 1); // Drag
    const marks = compareHits(before, after);
    expect(marks.get(hitKey(0, 4, 1, 'snare'))).toBe('changed');
    // 32tel-Raster: Position 2 liegt dort, wo im 16tel-Raster Position 1 lag
    expect(hitKey(0, 8, 2, 'snare')).toBe(hitKey(0, 4, 1, 'snare'));
    expect(compareHits(undefined, toggleHit(verse, 0, 'kick', 0)).get(hitKey(0, 4, 0, 'kick'))).toBe('added');
    expect(compareHits(toggleHit(verse, 0, 'kick', 0), verse).get(hitKey(0, 4, 0, 'kick'))).toBe('removed');
  });
});

describe('Spec song-history › Vergleich der Struktur', () => {
  const twoSegments = () => appendSegment(start(), { name: 'Refrain', bars: 2 });

  it('Takte gekürzt', () => {
    const before = twoSegments();
    const removed = bars(before).slice(2, 4).map((b) => b.id);
    const after = removed.reduce(deleteBar, before);
    const marks = structureChanges(before, after);
    expect([...marks.before.bars].sort()).toEqual([...removed].sort());
    expect(marks.after.bars.size).toBe(0);
    expect(editDiffOfStructure(before, after)).toMatchObject({ kind: 'structure', segments: [{ type: 'bars', from: 4, to: 2 }] });
  });

  it('Segment neu, entfernt, umbenannt, verschoben und Takte umbelegt', () => {
    const before = twoSegments();
    const [intro, refrain] = before.segments;
    const added = appendSegment(before, { name: 'Outro', bars: 1 });
    const outro = added.segments[2]!;
    expect(structureChanges(before, added).after.segments.get(outro.id)).toBe('added');

    const renamed = renameSegment(before, refrain!.id, 'Refrain 2');
    expect(structureChanges(before, renamed).after.segments.get(refrain!.id)).toBe('renamed');
    expect(editDiffOfStructure(before, renamed).segments).toEqual([{ type: 'renamed', segmentId: refrain!.id, from: 'Refrain', to: 'Refrain 2' }]);

    const moved = moveSegment(before, refrain!.id, -1);
    expect(structureChanges(before, moved).after.segments.get(refrain!.id)).toBe('moved');

    const removed = { ...before, segments: [intro!] };
    expect(structureChanges(before, removed).before.segments.get(refrain!.id)).toBe('removed');

    const verse = before.patterns[0]!.id;
    const assigned = setBarProps(before, [bars(before)[1]!.id], { grooveId: verse });
    expect([...structureChanges(before, assigned).after.bars]).toEqual([bars(before)[1]!.id]);
    expect(editDiffOfStructure(before, assigned).segments).toEqual([{ type: 'reassigned', segmentId: intro!.id, name: 'Intro', count: 1 }]);
  });
});

describe('Spec song-history › Vergleich der Song-Daten', () => {
  it('Tempo geändert', () => {
    const h = historyOf(start());
    h.step((s) => ({ ...s, tempo: 40 }), 'song', { time: MONDAY + DAY }).step((s) => ({ ...s, tempo: 117 }), 'song');
    expect(editDiff(groupEdits(h.input).at(-1)!, h.input)).toEqual({ kind: 'song', tempo: { from: 120, to: 117 } });
  });
});

/** Unterschied einer Struktur-Bearbeitung zwischen zwei Ständen. */
function editDiffOfStructure(before: Song, after: Song) {
  const steps: Step[] = [
    { time: MONDAY, author: ARTJOM, subject: 'song' },
    { time: MONDAY + 10, author: ARTJOM, subject: 'structure' },
  ];
  const songs = [before, after];
  const input: HistoryInput = { steps, songAt: (i) => songs[i] ?? null };
  const diff = editDiff(groupEdits(input)[1]!, input);
  if (diff.kind !== 'structure') throw new Error('kein Struktur-Unterschied');
  return diff;
}

describe('Spec song-history › Wiederherstellen', () => {
  const NOW = new Date('2026-11-08T12:00:00.000Z');
  const withVerseHits = () => {
    const song = start();
    return { ...song, patterns: song.patterns.map((p) => (p.name === 'Verse' ? toggleHit(p, 0, 'kick', 0) : p)) };
  };
  const verseOf = (song: Song) => song.patterns.find((p) => p.name === 'Verse');
  const used = (song: Song, id: string) => bars(song).filter((b) => b.grooveId === id || b.fillId === id).length;

  it('Pattern auf diesen Stand: nur das Pattern ändert sich, seine Revision steigt', () => {
    const target = withVerseHits();
    const verse = verseOf(target)!;
    const current = {
      ...target,
      tempo: 90,
      patterns: target.patterns.map((p) => toggleHit({ ...p, revision: p.revision + 3 }, 1, 'snare', 1)),
    };
    const restored = restoreTarget(current, target, patternSubject(verse.id), 'subject', NOW);
    expect(verseOf(restored)!.beats).toEqual(verse.beats);
    expect(verseOf(restored)!.revision).toBe(verse.revision + 4);
    expect(restored.tempo).toBe(90);
    expect(restored.patterns.find((p) => p.name === 'Chorus')).toEqual(current.patterns.find((p) => p.name === 'Chorus'));
  });

  it('Gelöschten Groove zurückholen', () => {
    const target = withVerseHits();
    const verse = verseOf(target)!;
    const withBar = setBarProps(target, [bars(target)[0]!.id], { grooveId: verse.id });
    const current = removePattern(withBar, verse.id);
    const restored = restoreTarget(current, withBar, patternSubject(verse.id), 'subject', NOW);
    expect(verseOf(restored)).toMatchObject({ id: verse.id, beats: verse.beats });
    expect(used(restored, verse.id)).toBe(0);
  });

  it('Pattern im Ziel nicht vorhanden: es wird gelöscht, samt Zuordnungen', () => {
    const target = start();
    const { song, pattern } = addPattern(target, { kind: 'fill', name: 'Intro Fill' });
    const current = setBarProps(song, [bars(song)[3]!.id], { fillId: pattern.id });
    const restored = restoreTarget(current, target, patternSubject(pattern.id), 'subject', NOW);
    expect(restored.patterns.some((p) => p.id === pattern.id)).toBe(false);
    expect(used(restored, pattern.id)).toBe(0);
  });

  it('Gelöschter Groove in der Struktur', () => {
    const base = withVerseHits();
    const verse = verseOf(base)!;
    const target = setBarProps(base, [bars(base)[0]!.id, bars(base)[1]!.id], { grooveId: verse.id });
    const current = { ...removePattern(target, verse.id), tempo: 90 };
    const restored = restoreTarget(current, target, 'structure', 'subject', NOW);
    expect(used(restored, verse.id)).toBe(2);
    expect(verseOf(restored)).toMatchObject({ id: verse.id, beats: verse.beats });
    expect(restored.tempo).toBe(90);
  });

  it('Song-Daten auf diesen Stand', () => {
    const target = start();
    const current = { ...renameSegment(target, target.segments[0]!.id, 'Strophe'), title: 'Neu', tempo: 90, meter: 3 };
    const restored = restoreTarget(current, target, 'song', 'subject', NOW);
    expect(restored).toMatchObject({ title: target.title, tempo: target.tempo });
    expect(restored.meter ?? 4).toBe(4);
    expect(restored.segments[0]!.name).toBe('Strophe');
  });

  it('Ganzer Song', () => {
    const target = withVerseHits();
    const { song } = addPattern(target, { kind: 'fill', name: 'Intro Fill' });
    const current = { ...appendSegment(song, { name: 'Outro', bars: 2 }), tempo: 90 };
    const restored = restoreTarget(current, target, 'song', 'song', NOW);
    expect(restored.patterns.map((p) => p.id)).toEqual(target.patterns.map((p) => p.id));
    expect(restored.segments).toEqual(target.segments);
    expect(restored.tempo).toBe(target.tempo);
    expect(restored.id).toBe(current.id);
  });

  it('Folgen: zurückgesetzt, wieder angelegt, gelöscht und Song-Daten', () => {
    const target = withVerseHits();
    const verse = verseOf(target)!;
    const chorus = target.patterns.find((p) => p.name === 'Chorus')!;
    const { song, pattern } = addPattern(removePattern(target, chorus.id), { kind: 'fill', name: 'Intro Fill' });
    const current = { ...song, tempo: 90, patterns: song.patterns.map((p) => (p.id === verse.id ? toggleHit(p, 0, 'kick', 0) : p)) };

    expect(restoreConsequences(current, target, patternSubject(verse.id), 'subject', [], ARTJOM)).toEqual({
      items: [{ type: 'reset', patternId: verse.id }],
      others: [],
    });
    expect(restoreConsequences(current, target, patternSubject(chorus.id), 'subject', [], ARTJOM).items).toEqual([{ type: 're-added', patternId: chorus.id }]);
    expect(restoreConsequences(current, target, patternSubject(pattern.id), 'subject', [], ARTJOM).items).toEqual([{ type: 'deleted', patternId: pattern.id }]);
    expect(restoreConsequences(current, target, 'song', 'subject', [], ARTJOM).items).toEqual([{ type: 'song', tempo: { from: 90, to: 120 } }]);
    const whole = restoreConsequences(current, target, 'song', 'song', [], ARTJOM).items;
    expect(whole).toEqual(
      expect.arrayContaining([
        { type: 'song', tempo: { from: 90, to: 120 } },
        { type: 'reset', patternId: verse.id },
        { type: 're-added', patternId: chorus.id },
        { type: 'deleted', patternId: pattern.id },
      ]),
    );
  });

  it('Folgen der Struktur nennen wieder angelegte Patterns', () => {
    const base = withVerseHits();
    const verse = verseOf(base)!;
    const target = setBarProps(base, [bars(base)[0]!.id], { grooveId: verse.id });
    const current = removePattern(target, verse.id);
    expect(restoreConsequences(current, target, 'structure', 'subject', [], ARTJOM).items).toEqual([
      { type: 'structure' },
      { type: 're-added', patternId: verse.id },
    ]);
  });

  it('Änderungen anderer', () => {
    const target = withVerseHits();
    const verse = verseOf(target)!;
    const current = { ...target, patterns: target.patterns.map((p) => (p.id === verse.id ? toggleHit(p, 1, 'kick', 0) : p)) };
    const later: Step[] = [
      { time: MONDAY, author: MAX, subject: patternSubject(verse.id) },
      { time: MONDAY, author: 'anna@example.com', subject: 'structure' },
      { time: MONDAY, author: ARTJOM, subject: patternSubject(verse.id) },
      { time: MONDAY, author: null, subject: patternSubject(verse.id) },
    ];
    expect(restoreConsequences(current, target, patternSubject(verse.id), 'subject', later, ARTJOM).others).toEqual([MAX]);
    expect(restoreConsequences(current, target, 'song', 'song', later, ARTJOM).others).toEqual([MAX, 'anna@example.com']);
  });

  it('Nichts zu tun', () => {
    const target = withVerseHits();
    expect(restoreConsequences(target, target, patternSubject(verseOf(target)!.id), 'subject', [], ARTJOM).items).toEqual([]);
    expect(restoreConsequences(target, target, 'structure', 'subject', [], ARTJOM).items).toEqual([]);
    expect(restoreConsequences(target, target, 'song', 'song', [], ARTJOM).items).toEqual([]);
  });
});
