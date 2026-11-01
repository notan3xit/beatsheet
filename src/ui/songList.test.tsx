import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { appendSegment } from '../domain/structure';
import type { Song } from '../domain/types';
import { createNotebookStore } from '../state/notebookStore';
import { songWith } from '../test/songs';
import { App } from './App';

function setup(songs: Song[] = []) {
  const store = createNotebookStore(songs);
  const user = userEvent.setup();
  render(<App store={store} />);
  return { store, user };
}

const songList = () => screen.getByRole('main', { name: 'Songs' });

describe('Spec song-library › Song anlegen (UI)', () => {
  it('Song mit Titel anlegen', async () => {
    const { store, user } = setup();
    await user.type(screen.getByLabelText('Titel des neuen Songs'), 'Hysteria');
    await user.click(screen.getByRole('button', { name: 'Song anlegen' }));
    expect(store.getState().songs.map((s) => s.title)).toEqual(['Hysteria']);
  });

  it('Song ohne Titel anlegen', async () => {
    const { store, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Song anlegen' }));
    expect(store.getState().songs.map((s) => s.title)).toEqual(['Neuer Song']);
  });
});

describe('Spec song-library › Song-Liste (UI)', () => {
  it('Sortierte Liste', () => {
    const uprising = appendSegment(songWith({ title: 'Uprising' }), { name: 'V', bars: 32 });
    setup([uprising, songWith({ title: 'Hysteria' })]);
    const items = within(songList()).getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(['Hysteria0 Takte', 'Uprising32 Takte']);
  });

  it('Leere Liste', () => {
    setup();
    expect(within(songList()).getByText(/Noch keine Songs/)).toBeInTheDocument();
  });

  it('Song öffnen', async () => {
    const { user } = setup([songWith({ title: 'Hysteria' })]);
    await user.click(within(songList()).getByText('Hysteria'));
    expect(screen.getByRole('region', { name: 'Struktur' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Patterns' })).toBeInTheDocument();
    expect(screen.getByLabelText('Songtitel')).toHaveValue('Hysteria');
  });
});

describe('Spec song-library › Song umbenennen (UI)', () => {
  it('Titel ändern', async () => {
    const { store, user } = setup([songWith({ title: 'Neuer Song' })]);
    await user.click(within(songList()).getByText('Neuer Song'));
    const input = screen.getByLabelText('Songtitel');
    await user.clear(input);
    await user.type(input, 'Uprising');
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Alle Songs' }));
    expect(within(songList()).getByText('Uprising')).toBeInTheDocument();
    expect(store.getState().songs[0]!.title).toBe('Uprising');
  });

  it('Leerer Titel', async () => {
    const { store, user } = setup([songWith({ title: 'Hysteria' })]);
    await user.click(within(songList()).getByText('Hysteria'));
    const input = screen.getByLabelText('Songtitel');
    await user.clear(input);
    await user.tab();
    expect(store.getState().songs[0]!.title).toBe('Hysteria');
    expect(input).toHaveValue('Hysteria');
  });
});

describe('Spec song-library › Song löschen (UI)', () => {
  it('Löschen bestätigt', async () => {
    const { store, user } = setup([songWith({ title: 'Hysteria' })]);
    await user.click(within(songList()).getByText('Hysteria'));
    await user.click(screen.getByRole('button', { name: 'Song löschen' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(/Patterns/);
    expect(dialog).toHaveTextContent(/Struktur/);
    await user.click(within(dialog).getByRole('button', { name: 'Bestätigen' }));
    expect(store.getState().songs).toEqual([]);
    expect(within(songList()).getByText(/Noch keine Songs/)).toBeInTheDocument();
  });

  it('Löschen abgebrochen', async () => {
    const { store, user } = setup([songWith({ title: 'Hysteria' })]);
    await user.click(within(songList()).getByText('Hysteria'));
    await user.click(screen.getByRole('button', { name: 'Song löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    expect(store.getState().songs).toHaveLength(1);
  });
});
