import * as A from '@automerge/automerge/slim';
import { describe, expect, it } from 'vitest';
import { createPattern, touch } from '../domain/pattern';
import { toggleHit } from '../domain/sequencer';
import { addPattern, removePattern } from '../domain/songPatterns';
import { setBarProps } from '../domain/structure';
import type { Song } from '../domain/types';
import { songWith } from '../test/songs';
import { createNotebookStore } from '../state/notebookStore';
import { readHistory } from './history';
import { connectStore, openRepository } from './repository';
import { applySong, changeMessage, createSongDoc, mergeSongDocs, songOf, type SongDocument } from './songDoc';

/** Song mit Groove „Verse“ und einem Segment aus zwei Takten ohne Groove. */
function baseSong(): Song {
  const verse = createPattern([], { kind: 'groove', name: 'Verse' });
  return songWith({ patterns: [verse], bars: 2 });
}

const edit = (doc: SongDocument, change: (song: Song) => Song, by?: string) => {
  const song = songOf(doc);
  return applySong(doc, { ...change(song), revision: song.revision + 1 }, changeMessage({ by }));
};

const setHit = (position: number) => (song: Song) => ({
  ...song,
  patterns: song.patterns.map((p) => (p.name === 'Verse' ? touch(toggleHit(p, 0, 'kick', position)) : p)),
});

describe('persistence/history › Historie eines Dokuments', () => {
  it('liefert jede Änderung mit Zeit, Autor und Stand danach', () => {
    let doc = createSongDoc(baseSong());
    doc = edit(doc, setHit(0), 'max@example.org');
    doc = edit(doc, (s) => ({ ...s, tempo: 90 }));
    const history = readHistory(doc);

    expect(history.steps).toHaveLength(3);
    expect(history.steps.map((s) => s.author)).toEqual([null, 'max@example.org', null]);
    expect(history.steps.every((s) => typeof s.time === 'number')).toBe(true);
    expect(history.songAt(1)!.patterns[0]!.beats[0]!.hits.kick).toEqual([0]);
    expect(history.songAt(1)!.tempo).toBe(120);
    expect(history.songAt(2)).toEqual(songOf(doc));
    expect(history.songAt(-1)).toBeNull();
  });

  it('Wiederherstellung trägt die Zeit ihres Zielstands', () => {
    const song = baseSong();
    const doc = applySong(createSongDoc(song), { ...song, tempo: 90 }, changeMessage({ by: 'max@example.org', restore: 1762559580 }));
    expect(readHistory(doc).steps[1]).toMatchObject({ author: 'max@example.org', restore: 1762559580 });
  });

  it('kausale Reihenfolge und Heads je Position bei nebenläufigen Änderungen', () => {
    const doc = createSongDoc(baseSong());
    const a = edit(A.clone(doc), setHit(0), 'anna@example.com');
    const b = edit(A.clone(doc), (s) => ({ ...s, tempo: 90 }), 'max@example.org');
    const merged = mergeSongDocs(a, b);
    const { steps, songAt } = readHistory(merged);

    expect(steps).toHaveLength(3);
    expect(steps[0]!.heads).toEqual([steps[0]!.hash]);
    // Beide Zweige hängen nur vom ersten Stand ab; danach gelten beide als Heads
    expect([...steps[2]!.heads].sort()).toEqual([...A.getHeads(merged)].sort());
    expect(songAt(2)).toEqual(songOf(merged));
    // Der Stand nach dem ersten Zweig enthält nur dessen Änderung
    const first = songAt(1)!;
    expect(first.tempo === 90).toBe(steps[1]!.author === 'max@example.org');
  });
});

describe('Spec song-history › Gegenstand einer Änderung', () => {
  it('Erste Änderung gehört zu den Song-Daten', () => {
    expect(readHistory(createSongDoc(baseSong())).steps[0]!.subject).toBe('song');
  });

  it('Schlag setzen', () => {
    const doc = edit(createSongDoc(baseSong()), setHit(0));
    const verse = songOf(doc).patterns[0]!;
    expect(readHistory(doc).steps[1]!.subject).toBe(`pattern:${verse.id}`);
  });

  it('Song-Daten und Struktur', () => {
    let doc = edit(createSongDoc(baseSong()), (s) => ({ ...s, title: 'Hysteria' }));
    const bars = songOf(doc).segments[0]!.blocks[0]!.bars;
    const verse = songOf(doc).patterns[0]!;
    doc = edit(doc, (s) => setBarProps(s, [bars[0]!.id], { grooveId: verse.id }));
    expect(readHistory(doc).steps.map((s) => s.subject)).toEqual(['song', 'song', 'structure']);
  });

  it('Pattern aus der Struktur anlegen', () => {
    let doc = createSongDoc(baseSong());
    const bar = songOf(doc).segments[0]!.blocks[0]!.bars[1]!;
    doc = edit(doc, (s) => {
      const { song, pattern } = addPattern(s, { kind: 'fill' });
      return setBarProps(song, [bar.id], { fillId: pattern.id });
    });
    expect(readHistory(doc).steps[1]!.subject).toBe('structure');
  });

  it('Verwendetes Pattern löschen', () => {
    let doc = createSongDoc(baseSong());
    const verse = songOf(doc).patterns[0]!;
    doc = edit(doc, (s) => setBarProps(s, s.segments[0]!.blocks[0]!.bars.map((b) => b.id), { grooveId: verse.id }));
    doc = edit(doc, (s) => removePattern(s, verse.id));
    expect(readHistory(doc).steps[2]!.subject).toBe(`pattern:${verse.id}`);
  });

  it('Pattern löschen und zugleich anders umbelegen gehört zur Struktur', () => {
    let doc = createSongDoc(songWith({ patterns: [createPattern([], { kind: 'groove', name: 'Verse' }), createPattern([], { kind: 'groove', name: 'Chorus' })], bars: 2 }));
    const [verse, chorus] = songOf(doc).patterns;
    const bars = songOf(doc).segments[0]!.blocks[0]!.bars;
    doc = edit(doc, (s) => setBarProps(s, [bars[0]!.id], { grooveId: verse!.id }));
    doc = edit(doc, (s) => setBarProps(removePattern(s, verse!.id), [bars[1]!.id], { grooveId: chorus!.id }));
    expect(readHistory(doc).steps[2]!.subject).toBe('structure');
  });

  it('Änderung ohne sichtbare Wirkung gehört zum Gegenstand der vorigen', () => {
    let doc = edit(createSongDoc(baseSong()), setHit(0));
    // Nur Revision und Änderungszeitpunkt
    doc = edit(doc, (s) => ({ ...s, updatedAt: '2026-11-08T12:00:00.000Z' }));
    const steps = readHistory(doc).steps;
    expect(steps).toHaveLength(3);
    expect(steps[2]!.subject).toBe(steps[1]!.subject);
  });
});

describe('Repository › Historie', () => {
  it('liefert die Historie eines Songs und rechnet sie erst nach einer Änderung neu', async () => {
    const repo = await openRepository(`history-test-${crypto.randomUUID()}`, { author: () => 'max@example.org' });
    const store = createNotebookStore();
    const connection = connectStore(store, repo);
    const song = store.createSong('Hysteria');
    await connection.flush();
    const first = repo.history(song.id);
    expect(repo.history(song.id)).toBe(first);

    store.openSong(song.id);
    store.updateSong((s) => ({ ...s, tempo: 90 }));
    await connection.flush();
    const second = repo.history(song.id);
    expect(second).not.toBe(first);
    expect(second!.steps.at(-1)).toMatchObject({ author: 'max@example.org', subject: 'song' });
  });
});

describe('persistence/history › Laufzeit', () => {
  it('liest 5000 Änderungen eines Songs mit Struktur und acht Patterns in unter 1 s', () => {
    const patterns = Array.from({ length: 8 }, (_, i) => createPattern([], { kind: 'groove', name: `Groove ${i}` }));
    let doc = createSongDoc(songWith({ patterns, bars: 32 }));
    for (let i = 0; i < 5000; i++) {
      // Direkt im Dokument, damit der Aufbau des Tests schnell bleibt
      doc = A.change(doc, (d) => {
        const hits = (d as unknown as { patterns: { beats: { hits: Record<string, Record<string, true>> }[] }[] }).patterns[i % 8]!.beats[i % 4]!.hits.snare!;
        const key = String((i >> 3) % 4);
        if (hits[key]) delete hits[key];
        else hits[key] = true;
      });
    }
    const start = performance.now();
    const history = readHistory(doc);
    const elapsed = performance.now() - start;
    expect(history.steps).toHaveLength(5001);
    expect(elapsed).toBeLessThan(1000);
  }, 60_000);
});
