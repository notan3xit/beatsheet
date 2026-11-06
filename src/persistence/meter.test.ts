import * as A from '@automerge/automerge/slim';
import { beforeAll, describe, expect, it } from 'vitest';
import { setPatternMeter, songMeter } from '../domain/meter';
import { createPattern } from '../domain/pattern';
import type { Song } from '../domain/types';
import { songWith } from '../test/songs';
import { parseNotebookFile, serializeNotebook } from './fileFormat';
import { applySong, createSongDoc, initAutomerge, sameSong, songOf, toDocShape } from './songDoc';

const NOW = new Date('2026-11-06T12:00:00.000Z');

function metered(): Song {
  const verse = createPattern([], { kind: 'groove', name: 'Verse' });
  const bridge = setPatternMeter(createPattern([verse], { kind: 'groove', name: 'Bridge' }), 7);
  return { ...songWith({ patterns: [verse, bridge] }), meter: 3 };
}

beforeAll(() => initAutomerge());

describe('Spec song-meter › Taktart in Kopien und Dateien', () => {
  it('Export und Import', () => {
    const result = parseNotebookFile(serializeNotebook([metered()], NOW));
    expect(result.ok && result.songs[0]!.meter).toBe(3);
    expect(result.ok && result.songs[0]!.patterns[1]!.meter).toBe(7);
    expect(result.ok && result.songs[0]!.patterns[0]).not.toHaveProperty('meter');
  });

  it('Datei ohne Angaben', () => {
    const groove = createPattern([], { kind: 'groove', name: 'Verse' });
    const result = parseNotebookFile(serializeNotebook([songWith({ patterns: [groove] })], NOW));
    expect(result.ok).toBe(true);
    expect(result.ok && songMeter(result.songs[0]!)).toBe(4);
    expect(result.ok && result.songs[0]!.patterns[0]).not.toHaveProperty('meter');
  });

  it('Ungültiger Wert am Song', () => {
    const file = JSON.parse(serializeNotebook([metered()], NOW));
    file.songs[0].meter = 8;
    const result = parseNotebookFile(JSON.stringify(file));
    expect(!result.ok && result.error).toMatch(/beschädigt/);
  });

  it('Ungültiger Wert am Pattern', () => {
    const file = JSON.parse(serializeNotebook([metered()], NOW));
    file.songs[0].patterns[0].meter = 2;
    const result = parseNotebookFile(JSON.stringify(file));
    expect(!result.ok && result.error).toMatch(/beschädigt/);
  });

  it('Älterer Song', () => {
    const song = { ...songWith({}), revision: 6 };
    const loaded = songOf(createSongDoc(song));
    expect(songMeter(loaded)).toBe(4);
    expect(loaded.revision).toBe(6);
  });
});

describe('song-meter design.md D2: Dokument', () => {
  it('Song-Takt und eigene Taktart bleiben im Dokument erhalten', () => {
    const loaded = songOf(createSongDoc(metered()));
    expect(loaded.meter).toBe(3);
    expect(loaded.patterns[1]!.meter).toBe(7);
    expect(loaded.patterns[0]).not.toHaveProperty('meter');
  });

  it('4/4 steht nicht im Dokument, fehlendes Feld und 4/4 sind derselbe Song', () => {
    const song = songWith({});
    expect(toDocShape({ ...song, meter: 4 })).not.toHaveProperty('meter');
    expect(sameSong(song, { ...song, meter: 4 })).toBe(true);
    expect(sameSong(song, { ...song, meter: 3 })).toBe(false);
  });

  it('Eine eigene Taktart 4/4 am Pattern bleibt erhalten', () => {
    const own = setPatternMeter(createPattern([], { kind: 'groove', name: 'A' }), 4);
    expect(songOf(createSongDoc(songWith({ patterns: [own] }))).patterns[0]!.meter).toBe(4);
  });

  it('Ein alter Song erzeugt beim Abgleich keine Änderung', () => {
    const song = songWith({});
    const doc = createSongDoc(song);
    expect(A.getHeads(applySong(doc, song))).toEqual(A.getHeads(doc));
    expect(A.getHeads(applySong(doc, { ...song, meter: 4 }))).toEqual(A.getHeads(doc));
  });

  it('Zurückstellen entfernt die Felder aus dem Dokument', () => {
    const song = metered();
    let doc = createSongDoc(song);
    doc = applySong(doc, { ...song, meter: 4, patterns: song.patterns.map((p) => setPatternMeter(p, undefined)) });
    const loaded = songOf(doc);
    expect(loaded).not.toHaveProperty('meter');
    expect(loaded.patterns[1]).not.toHaveProperty('meter');
  });
});
