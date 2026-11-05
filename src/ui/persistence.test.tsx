import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Song } from '../domain/types';
import { appendSegment } from '../domain/structure';
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

const exportOf = (songs: Song[], schemaVersion = 3) =>
  JSON.stringify({ ...JSON.parse(serializeNotebook(songs, new Date())), schemaVersion });

const version = (song: Song, revision: number, title = song.title): Song => ({ ...song, revision, title });

type User = ReturnType<typeof userEvent.setup>;

/** Datei wählen und den Import-Dialog abwarten. */
async function openImport(user: User, content: string) {
  await user.upload(screen.getByLabelText('Importieren'), fileOf(content));
  return screen.findByRole('dialog', { name: 'Songs importieren' });
}

/** Auswahl für den Song mit diesem Titel. */
const group = (dialog: HTMLElement, title: string) => within(dialog).getByRole('group', { name: title });
const option = (dialog: HTMLElement, title: string, label: string) =>
  within(group(dialog, title)).getByRole('radio', { name: label });

async function confirm(user: User, dialog: HTMLElement) {
  await user.click(within(dialog).getByRole('button', { name: 'Importieren' }));
}

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
    await user.click(screen.getByRole('button', { name: 'Menü' }));
    await user.click(screen.getByRole('menuitem', { name: 'Exportieren' }));
    expect(save).toHaveBeenCalledTimes(1);
    const [name, content] = save.mock.calls[0]!;
    expect(name).toMatch(/^beatsheet-\d{4}-\d{2}-\d{2}\.json$/);
    expect(JSON.parse(content).songs.map((s: Song) => s.id)).toEqual(songs.map((s) => s.id));
    save.mockRestore();
  });
});

describe('Spec library-persistence › Import einer Bibliothek (UI)', () => {
  it('Neue Patterns importieren', async () => {
    const { store, user } = setup([songWith({ title: 'Lokal' })]);
    const incoming = [songWith({ title: 'A', groove: true }), songWith({ title: 'B', groove: true })];
    await confirm(user, await openImport(user, serializeNotebook(incoming, new Date())));
    expect(await screen.findByRole('status')).toHaveTextContent('2 hinzugefügt, 0 ersetzt, 0 als Kopie, 0 übersprungen');
    expect(store.getState().songs.map((s) => s.title)).toEqual(['Lokal', 'A', 'B']);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Dialog auch ohne vorhandene Songs', async () => {
    const local = [songWith({ title: 'Lokal' })];
    const { store, user } = setup(local);
    const dialog = await openImport(user, exportOf([songWith({ title: 'A' })]));
    expect(option(dialog, 'A', 'Hinzufügen')).toBeChecked();
    expect(within(group(dialog, 'A')).getByRole('radio', { name: 'Überspringen' })).not.toBeChecked();
    expect(store.getState().songs).toEqual(local);
  });

  it('Neuere Fassung gewinnt', async () => {
    const base = songWith({ title: 'Hysteria', groove: true });
    const { store, user } = setup([version(base, 2)]);
    const incoming = version(appendSegment(base, { name: 'Verse', bars: 8 }), 5);
    const dialog = await openImport(user, exportOf([incoming]));
    expect(option(dialog, 'Hysteria', 'Ersetzen')).toBeChecked();
    expect(group(dialog, 'Hysteria')).toHaveTextContent('Datei neuer');
    await confirm(user, dialog);
    expect(store.getState().songs).toEqual([incoming]);
  });

  it('Ältere Fassung wird ignoriert', async () => {
    const base = songWith({ title: 'Hysteria' });
    const local = [version(base, 5)];
    const { store, user } = setup(local);
    const dialog = await openImport(user, exportOf([version(base, 2)]));
    expect(option(dialog, 'Hysteria', 'Überspringen')).toBeChecked();
    expect(group(dialog, 'Hysteria')).toHaveTextContent('Lokal neuer');
    await confirm(user, dialog);
    expect(store.getState().songs).toEqual(local);
  });
});

describe('Spec library-persistence › Import aus einer neueren Version (UI)', () => {
  it('Warnung vor der Übernahme', async () => {
    const { store, user } = setup();
    const dialog = await openImport(user, exportOf([songWith({ title: 'Zukunft' })], 4));
    expect(dialog).toHaveTextContent(/neueren Version/);
    expect(store.getState().songs).toEqual([]);
    await confirm(user, dialog);
    expect(store.getState().songs.map((s) => s.title)).toEqual(['Zukunft']);
  });

  it('Vorhandener Song aus neuerer Version', async () => {
    const base = songWith({ title: 'Hysteria' });
    const { user } = setup([version(base, 2)]);
    const dialog = await openImport(user, exportOf([version(base, 5)], 4));
    expect(option(dialog, 'Hysteria', 'Als Kopie')).toBeChecked();
  });

  it('Abbrechen nach der Warnung', async () => {
    const local = [songWith({ title: 'Lokal' })];
    const { store, user } = setup(local);
    const dialog = await openImport(user, exportOf([songWith({ title: 'Zukunft' }), version(local[0]!, 9)], 4));
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(store.getState().songs).toEqual(local);
  });
});

describe('Spec library-persistence › Auswahl im Import-Dialog (UI)', () => {
  it('Escape bricht ab, auch ohne Fokus im Dialog', async () => {
    const { store, user } = setup([songWith({ title: 'Lokal' })]);
    await openImport(user, serializeNotebook([songWith({ title: 'Neu' })], new Date()));
    (document.activeElement as HTMLElement).blur();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Songs importieren' })).not.toBeInTheDocument();
    expect(store.getState().songs.map((s) => s.title)).toEqual(['Lokal']);
  });

  it('Neuen Song überspringen', async () => {
    const { store, user } = setup();
    const dialog = await openImport(user, exportOf([songWith({ title: 'A' }), songWith({ title: 'B' })]));
    await user.click(option(dialog, 'A', 'Überspringen'));
    await confirm(user, dialog);
    expect(store.getState().songs.map((s) => s.title)).toEqual(['B']);
    expect(await screen.findByRole('status')).toHaveTextContent('1 hinzugefügt, 0 ersetzt, 0 als Kopie, 1 übersprungen');
  });

  it('Alle auf einmal', async () => {
    const local = [songWith({ title: 'A' }), songWith({ title: 'B' }), songWith({ title: 'C' })];
    const { user } = setup(local);
    const dialog = await openImport(user, exportOf(local.map((s) => version(s, 2))));
    await user.click(within(dialog).getByRole('button', { name: 'Alle als Kopie' }));
    for (const title of ['A', 'B', 'C']) expect(option(dialog, title, 'Als Kopie')).toBeChecked();
    await user.click(within(dialog).getByRole('button', { name: 'Alle überspringen' }));
    for (const title of ['A', 'B', 'C']) expect(option(dialog, title, 'Überspringen')).toBeChecked();
    await user.click(within(dialog).getByRole('button', { name: 'Alle ersetzen' }));
    for (const title of ['A', 'B', 'C']) expect(option(dialog, title, 'Ersetzen')).toBeChecked();
  });

  it('Import abbrechen', async () => {
    const local = [songWith({ title: 'A' })];
    const { store, user } = setup(local);
    const dialog = await openImport(user, exportOf([version(local[0]!, 4), songWith({ title: 'Neu' })]));
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(store.getState().songs).toEqual(local);
  });

  it('Gemischte Auswahl', async () => {
    const local = [songWith({ title: 'A' }), songWith({ title: 'B' }), songWith({ title: 'C' })];
    const { store, user } = setup(local);
    const dialog = await openImport(user, exportOf([songWith({ title: 'Neu' }), ...local.map((s) => version(s, 2))]));
    await user.click(option(dialog, 'A', 'Ersetzen'));
    await user.click(option(dialog, 'B', 'Als Kopie'));
    await user.click(option(dialog, 'C', 'Überspringen'));
    await confirm(user, dialog);
    expect(await screen.findByRole('status')).toHaveTextContent('1 hinzugefügt, 1 ersetzt, 1 als Kopie, 1 übersprungen');
    expect(store.getState().songs.map((s) => s.title)).toEqual(['A', 'B', 'C', 'Neu', 'B (Kopie)']);
  });
});

describe('Spec library-persistence › Import als Kopie (UI)', () => {
  it('Kopie ist eigenständig', async () => {
    const original = songWith({ title: 'Intro', groove: true });
    const { store, user } = setup([original]);
    const dialog = await openImport(user, exportOf([version(original, 3)]));
    await user.click(option(dialog, 'Intro', 'Als Kopie'));
    await confirm(user, dialog);
    const copy = store.getState().songs.find((s) => s.title === 'Intro (Kopie)')!;
    expect(copy.id).not.toBe(original.id);
    store.openSong(copy.id);
    store.updateSong((song) => appendSegment(song, { name: 'Verse', bars: 2 }));
    store.update(copy.patterns[0]!.id, (p) => ({ ...p, name: 'Geändert' }));
    expect(store.getState().songs.find((s) => s.id === original.id)).toEqual(original);
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
    await confirm(user, await openImport(user, v1));
    expect(await screen.findByRole('status')).toHaveTextContent('1 hinzugefügt, 0 ersetzt, 0 als Kopie, 0 übersprungen');
    expect(store.getState().songs.map((s) => [s.title, s.patterns.length])).toEqual([['Importierte Patterns', 3]]);
  });
});

describe('Spec library-persistence › Ungültige Importdateien (UI)', () => {
  it('Neuere Schemaversion', async () => {
    const { user } = setup();
    const dialog = await openImport(user, exportOf([songWith({ title: 'Zukunft' })], 4));
    expect(dialog).toHaveTextContent(/neueren Version/);
    expect(screen.queryByText(/Import fehlgeschlagen/)).not.toBeInTheDocument();
  });

  it('Keine erkennbaren Songs', async () => {
    const local = [songWith({ title: 'Lokal' })];
    const { store, user } = setup(local);
    await user.upload(screen.getByLabelText('Importieren'), fileOf('{"format":"drumstuff.library"}'));
    expect(await screen.findByRole('alert')).toHaveTextContent('keine importierbaren Songs');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
