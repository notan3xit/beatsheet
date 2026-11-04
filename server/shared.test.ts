import { beforeAll, expect, test } from 'vitest';
import { parseNotebookFile, serializeNotebook } from '../src/persistence/fileFormat.ts';
import { createSongDoc, initAutomerge, songOf } from '../src/persistence/songDoc.ts';
import type { Song } from '../src/domain/types.ts';

beforeAll(() => initAutomerge());

const song: Song = {
  id: 'intro',
  title: 'Intro',
  tempo: 120,
  patterns: [],
  segments: [],
  createdAt: '2026-11-04T10:00:00.000Z',
  updatedAt: '2026-11-04T10:00:00.000Z',
  revision: 1,
};

test('der Server nutzt Dokumentform und Formatprüfung aus src/persistence', () => {
  const read = songOf(createSongDoc(song));
  expect(read.id).toBe('intro');
  expect(parseNotebookFile(serializeNotebook([read], new Date()))).toMatchObject({ ok: true });
});
