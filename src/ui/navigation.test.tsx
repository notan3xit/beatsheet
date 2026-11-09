import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import type { Song } from '../domain/types';
import { createNotebookStore } from '../state/notebookStore';
import { songWith } from '../test/songs';
import { App } from './App';

function setup(songs: Song[], open?: { song: number; pattern?: number }) {
  const store = createNotebookStore(songs);
  if (open) {
    store.openSong(songs[open.song]!.id);
    store.setLocked(false);
    if (open.pattern !== undefined) store.openPattern(songs[open.song]!.patterns[open.pattern]!.id);
  }
  const user = userEvent.setup();
  render(<App store={store} />);
  return { store, user };
}

const heading = (name: string) => screen.getByRole('heading', { level: 2, name });
const songWithGroove = (title: string, groove: string) =>
  songWith({ title, patterns: [createPattern([], { kind: 'groove', name: groove })] });

describe('Spec navigation › Editierbare Überschrift', () => {
  it('Songtitel ändern', async () => {
    const { store, user } = setup([songWith({ title: 'Neuer Song' })], { song: 0 });
    await user.click(heading('Neuer Song'));
    const input = screen.getByLabelText('Songtitel');
    expect(input).toHaveValue('Neuer Song');
    await user.clear(input);
    await user.type(input, 'Uprising{Enter}');
    expect(heading('Uprising')).toBeInTheDocument();
    expect(screen.queryByLabelText('Songtitel')).not.toBeInTheDocument();
    expect(store.getState().songs[0]!.title).toBe('Uprising');
  });

  it('Patternname beim Verlassen übernehmen', async () => {
    const { store, user } = setup([songWithGroove('Hysteria', 'Groove 1')], { song: 0, pattern: 0 });
    await user.click(heading('Groove 1'));
    const input = screen.getByLabelText('Name');
    await user.clear(input);
    await user.type(input, 'Verse');
    await user.tab();
    expect(heading('Verse')).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(store.getState().songs[0]!.patterns[0]!.name).toBe('Verse');
  });

  it('Escape verwirft', async () => {
    const song = songWith({ title: 'Hysteria' });
    const { store, user } = setup([song], { song: 0 });
    await user.click(heading('Hysteria'));
    await user.clear(screen.getByLabelText('Songtitel'));
    await user.type(screen.getByLabelText('Songtitel'), 'Xyz{Escape}');
    expect(heading('Hysteria')).toBeInTheDocument();
    expect(screen.queryByLabelText('Songtitel')).not.toBeInTheDocument();
    expect(store.getState().songs[0]).toEqual(song);
  });

  it('Leerer Name', async () => {
    const { store, user } = setup([songWith({ title: 'Hysteria' })], { song: 0 });
    await user.click(heading('Hysteria'));
    await user.clear(screen.getByLabelText('Songtitel'));
    await user.keyboard('{Enter}');
    expect(heading('Hysteria')).toBeInTheDocument();
    expect(store.getState().songs[0]!.title).toBe('Hysteria');
  });
});

describe('Spec navigation › Breadcrumbs', () => {
  it('Song-Liste ohne Überschrift', () => {
    setup([songWith({ title: 'Hysteria' })]);
    const list = screen.getByRole('main', { name: 'Songs' });
    expect(within(list).getAllByRole('heading')[0]).toHaveTextContent('Meine Songs');
    expect(within(list).getAllByRole('heading')[0]!.tagName).toBe('H2');
    expect(within(list).queryByRole('heading', { name: /^Songs$/ })).not.toBeInTheDocument();
  });

  const path = () => screen.getByRole('navigation', { name: 'Pfad' });

  it('Pfad im Pattern-Editor', () => {
    setup([songWithGroove('Hysteria', 'Verse')], { song: 0, pattern: 0 });
    expect(within(path()).getAllByRole('button').map((b) => b.textContent)).toEqual(['Songs', 'Hysteria']);
    expect(heading('Verse')).toBeInTheDocument();
  });

  it('Zur Doppelseite', async () => {
    const { user } = setup([songWithGroove('Hysteria', 'Verse')], { song: 0, pattern: 0 });
    await user.click(within(path()).getByRole('button', { name: 'Hysteria' }));
    expect(screen.getByRole('region', { name: 'Struktur' })).toBeInTheDocument();
    expect(heading('Hysteria')).toBeInTheDocument();
  });

  it('Zur Song-Liste aus dem Pattern-Editor', async () => {
    const { user } = setup([songWithGroove('Hysteria', 'Verse')], { song: 0, pattern: 0 });
    await user.click(within(path()).getByRole('button', { name: 'Songs' }));
    expect(screen.getByRole('main', { name: 'Songs' })).toBeInTheDocument();
    expect(heading('Meine Songs')).toBeInTheDocument();
  });

  it('Pfad auf der Doppelseite', () => {
    setup([songWith({ title: 'Hysteria' })], { song: 0 });
    expect(within(path()).getAllByRole('button').map((b) => b.textContent)).toEqual(['Songs']);
    expect(heading('Hysteria')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Alle Songs' })).not.toBeInTheDocument();
  });
});

describe('Spec navigation › Breadcrumbs (Verlauf)', () => {
  it('Pfad im Verlauf', async () => {
    const { store, user } = setup([songWith({ title: 'Hysteria' })], { song: 0 });
    act(() => store.openHistory());
    const path = screen.getByRole('navigation', { name: 'Pfad' });
    expect(within(path).getByRole('button', { name: 'Songs' })).toBeInTheDocument();
    await user.click(within(path).getByRole('button', { name: 'Hysteria' }));
    expect(store.getState().view).toEqual({ kind: 'book' });
  });
});

describe('Spec navigation › Umbruch der Kopfzeile', () => {
  /** Gruppe am rechten Rand: letztes Element der Kopfzeile, mit den Namen ihrer Knöpfe. */
  function end(header: string) {
    const row = document.querySelector(header)!;
    const group = row.querySelector('.header-end');
    expect(group).not.toBeNull();
    expect(row.lastElementChild).toBe(group);
    return [...group!.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') ?? b.textContent);
  }
  const songWithGrooveOpen = () => setup([songWithGroove('Hysteria', 'Verse')], { song: 0, pattern: 0 });

  it('Pattern-Editor in mittlerer Breite', () => {
    songWithGrooveOpen();
    expect(end('.editor-header')).toEqual(['Rückgängig', 'Wiederherstellen', 'Duplizieren', 'Löschen', 'Song sperren']);
  });

  it('Doppelseite in mittlerer Breite', () => {
    setup([songWith({ title: 'Hysteria' })], { song: 0 });
    expect(end('.songbook-header .page-title')).toEqual(['Song löschen', 'Verlauf', 'Struktur ausklappen', 'Song sperren']);
  });

  it('Gesperrt', () => {
    const { store } = songWithGrooveOpen();
    act(() => store.setLocked(true));
    expect(end('.editor-header')).toEqual(['Song entsperren']);
    act(() => store.openSong(store.getState().songs[0]!.id));
    expect(end('.songbook-header .page-title').at(-1)).toBe('Song entsperren');
    expect(end('.songbook-header .page-title')).not.toContain('Song löschen');
  });
});
