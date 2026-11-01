import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Song } from '../domain/types';
import { serializeNotebook } from '../persistence/fileFormat';
import { createNotebookStore } from '../state/notebookStore';
import { emptyBeats, patternOf } from '../test/patterns';
import { songWith } from '../test/songs';
import { App } from './App';
import * as download from './download';

function setup(songs: Song[] = [], storagePersisted = true) {
  const store = createNotebookStore(songs);
  const user = userEvent.setup();
  render(<App store={store} storagePersisted={storagePersisted} />);
  return { store, user };
}

const fileOf = (content: string) => new File([content], 'backup.drumbook.json', { type: 'application/json' });

describe('Spec library-persistence › Dauerhaften Speicher anfordern (UI)', () => {
  it('Speicher nicht dauerhaft', () => {
    setup([], false);
    const hint = screen.getByRole('note');
    expect(hint).toHaveTextContent(/gelöscht/);
    expect(hint).toHaveTextContent(/Export/);
  });

  it('Kein Hinweis bei dauerhaftem Speicher', () => {
    setup([], true);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});

describe('Spec library-persistence › Export der Bibliothek (UI)', () => {
  it('Export herunterladen', async () => {
    const save = vi.spyOn(download, 'downloadFile').mockImplementation(() => {});
    const songs = [songWith({ title: 'A', groove: true }), songWith({ title: 'B' })];
    const { user } = setup(songs);
    await user.click(screen.getByRole('button', { name: 'Exportieren' }));
    expect(save).toHaveBeenCalledTimes(1);
    const [name, content] = save.mock.calls[0]!;
    expect(name).toMatch(/\.drumbook\.json$/);
    expect(JSON.parse(content).songs.map((s: Song) => s.id)).toEqual(songs.map((s) => s.id));
    save.mockRestore();
  });
});

describe('Spec library-persistence › Import einer Bibliothek (UI)', () => {
  it('Neue Patterns importieren', async () => {
    const { store, user } = setup([songWith({ title: 'Lokal' })]);
    const incoming = [songWith({ title: 'A', groove: true }), songWith({ title: 'B', groove: true })];
    await user.upload(screen.getByLabelText('Importieren'), fileOf(serializeNotebook(incoming, new Date())));
    expect(await screen.findByRole('status')).toHaveTextContent('2 hinzugefügt, 0 aktualisiert, 0 unverändert');
    expect(store.getState().songs.map((s) => s.title)).toEqual(['Lokal', 'A', 'B']);
  });
});

describe('Spec library-persistence › Import von Dateien der Schemaversion 1 (UI)', () => {
  it('Alte Exportdatei importieren', async () => {
    const { store, user } = setup();
    const patterns = [patternOf(emptyBeats(4)), patternOf(emptyBeats(4)), patternOf(emptyBeats(1), 'fill')];
    const v1 = JSON.stringify({
      format: 'drumstuff.library',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      patterns: patterns.map(({ color: _color, ...rest }) => rest),
    });
    await user.upload(screen.getByLabelText('Importieren'), fileOf(v1));
    expect(await screen.findByRole('status')).toHaveTextContent('1 hinzugefügt, 0 aktualisiert, 0 unverändert');
    expect(store.getState().songs.map((s) => [s.title, s.patterns.length])).toEqual([['Importierte Patterns', 3]]);
  });
});

describe('Spec library-persistence › Ungültige Importdateien (UI)', () => {
  it('Neuere Schemaversion', async () => {
    const local = [songWith({ title: 'Lokal' })];
    const { store, user } = setup(local);
    const file = JSON.stringify({ ...JSON.parse(serializeNotebook([], new Date())), schemaVersion: 3 });
    await user.upload(screen.getByLabelText('Importieren'), fileOf(file));
    expect(await screen.findByRole('alert')).toHaveTextContent(/neueren Version/);
    expect(store.getState().songs).toEqual(local);
  });

  it('Beschädigte Datei', async () => {
    const { store, user } = setup();
    const valid = songWith({ title: 'Gut', groove: true });
    const broken = songWith({ title: 'Kaputt', groove: true });
    broken.patterns[0]!.beats = [];
    await user.upload(screen.getByLabelText('Importieren'), fileOf(serializeNotebook([valid, broken], new Date())));
    expect(await screen.findByRole('alert')).toHaveTextContent(/beschädigt/);
    expect(store.getState().songs).toEqual([]);
  });
});
