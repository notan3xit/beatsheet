import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
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

const mine = () => screen.getByRole('region', { name: 'Meine Songs' });
/** Titel der Kacheln in der Reihenfolge der Anzeige. */
const tileTitles = (area: HTMLElement) => within(area).queryAllByRole('article').map((t) => within(t).getByRole('heading').textContent);
/** Beschriftungen der Kacheln zum Anlegen in der Reihenfolge der Anzeige. */
const addTiles = () => [...mine().querySelectorAll('.tile-add')].map((t) => t.textContent);
const backToList =(user: ReturnType<typeof userEvent.setup>) =>
  user.click(within(screen.getByRole('navigation', { name: 'Pfad' })).getByRole('button', { name: 'Songs' }));

describe('Spec song-library › Song anlegen (UI)', () => {
  it('Song mit Titel anlegen', async () => {
    const { store, user } = setup();
    await user.click(within(mine()).getByRole('button', { name: '+ Song' }));
    await user.click(screen.getByRole('heading', { level: 2, name: 'Neuer Song' }));
    const input = screen.getByLabelText('Songtitel');
    await user.clear(input);
    await user.type(input, 'Hysteria{Enter}');
    expect(store.getState().songs.map((s) => s.title)).toEqual(['Hysteria']);
    expect(store.getState().songs[0]!.segments).toEqual([]);
  });

  it('Song ohne Titel anlegen', async () => {
    const { store, user } = setup();
    await user.click(within(mine()).getByRole('button', { name: '+ Song' }));
    expect(store.getState().songs.map((s) => s.title)).toEqual(['Neuer Song']);
  });
});

describe('Spec song-library › Song-Liste (UI)', () => {
  it('Sortierte Liste', () => {
    const uprising = appendSegment(songWith({ title: 'Uprising', tempo: 128 }), { name: 'V', bars: 32 });
    setup([uprising, songWith({ title: 'Hysteria' })]);
    expect(tileTitles(mine())).toEqual(['Hysteria', 'Uprising']);
    const [hysteria, up] = within(mine()).getAllByRole('article');
    expect(hysteria).toHaveTextContent('0 Takte');
    expect(hysteria).toHaveTextContent('♩ = 120');
    expect(up).toHaveTextContent('32 Takte');
    expect(up).toHaveTextContent('♩ = 128');
    expect(within(mine()).queryByRole('table')).not.toBeInTheDocument();
  });

  it('Abgemeldet nach Titel, auch wenn Positionen bekannt sind (song-order)', () => {
    const uprising = songWith({ title: 'Uprising' });
    const store = createNotebookStore([uprising, songWith({ title: 'Hysteria' })]);
    const activity = { lastChange: () => null, isNew: () => false, order: () => ({ [uprising.id]: 'a0' }), subscribe: () => () => {}, getVersion: () => 0 };
    render(<App store={store} activity={activity} />);
    expect(tileTitles(mine())).toEqual(['Hysteria', 'Uprising']);
  });

  it('Leere Liste', () => {
    setup();
    expect(addTiles()).toEqual(['+ Beispiel-Song', '+ Song']);
    expect(mine().querySelector('p')).not.toBeInTheDocument();
  });

  it('Neuer Song landet in „Meine Songs“', async () => {
    const { user } = setup();
    await user.click(within(mine()).getByRole('button', { name: '+ Song' }));
    await backToList(user);
    expect(tileTitles(mine())).toEqual(['Neuer Song']);
  });

  it('Song öffnen', async () => {
    const { user } = setup([songWith({ title: 'Hysteria' })]);
    await user.click(within(songList()).getByText('Hysteria'));
    expect(screen.getByRole('region', { name: 'Struktur' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Patterns' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Hysteria' })).toBeInTheDocument();
  });

  it('Song öffnen über die Fläche der Kachel', async () => {
    const { user } = setup([songWith({ title: 'Hysteria' })]);
    await user.click(within(mine()).getByRole('article').querySelector('.motif')!);
    expect(screen.getByRole('heading', { level: 2, name: 'Hysteria' })).toBeInTheDocument();
  });

  it('Song per Tastatur öffnen', async () => {
    const { user } = setup([songWith({ title: 'Hysteria' })]);
    within(mine()).getByRole('button', { name: 'Hysteria' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { level: 2, name: 'Hysteria' })).toBeInTheDocument();
  });
});

describe('Spec song-library › Song kopieren (UI)', () => {
  it('Ohne Anmeldung', async () => {
    const { user } = setup([songWith({ title: 'Skizze' })]);
    await user.click(within(mine()).getByRole('button', { name: 'Kopieren' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Kopieren' }));
    expect(tileTitles(mine())).toEqual(['Skizze', 'Skizze (Kopie)']);
  });
});

describe('Spec song-library › Song über die Kachel „+ Song“ anlegen (UI)', () => {
  it('Doppelseite des neuen Songs', async () => {
    const { user } = setup([songWith({ title: 'Alt' })]);
    const tiles = within(mine()).getAllByRole('button', { name: /^(Alt|\+ Song)$/ });
    expect(tiles.at(-1)).toHaveAccessibleName('+ Song');
    await user.click(tiles.at(-1)!);
    expect(screen.getByRole('heading', { level: 2, name: 'Neuer Song' })).toBeInTheDocument();
  });
});

describe('Spec song-library › Beispiel-Song anlegen (UI)', () => {
  it('Beispiel-Song anlegen', async () => {
    const { store, user } = setup();
    await user.click(within(mine()).getByRole('button', { name: '+ Beispiel-Song' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Beispiel-Song' })).toBeInTheDocument();
    expect(store.getState().songs[0]!.segments.length).toBeGreaterThan(0);
    expect(store.getState().songs[0]!.patterns.length).toBeGreaterThan(0);
    await backToList(user);
    expect(tileTitles(mine())).toEqual(['Beispiel-Song']);
    expect(addTiles()).toEqual(['+ Song']);
  });

  it('Kachel fehlt bei vorhandenem Song', () => {
    setup([songWith({ title: 'Skizze' })]);
    expect(addTiles()).toEqual(['+ Song']);
  });

  it('Kachel nach dem Löschen des letzten Songs', async () => {
    const { user } = setup();
    await user.click(within(mine()).getByRole('button', { name: '+ Beispiel-Song' }));
    await user.click(screen.getByRole('button', { name: 'Song entsperren' }));
    await user.click(screen.getByRole('button', { name: 'Song löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(addTiles()).toEqual(['+ Beispiel-Song', '+ Song']);
  });
});

describe('Spec song-motif › Darstellung des Motivs (UI)', () => {
  const verse = createPattern([], { kind: 'groove', name: 'Verse' });
  const roll = createPattern([verse], { kind: 'fill', name: 'Roll', length: 2 });

  it('Striche in Pattern-Farben, ohne Taktstriche und Beschriftung', () => {
    const song = appendSegment(songWith({ title: 'Uprising', patterns: [verse, roll] }), { name: 'V', bars: 4 });
    const bars = song.segments[0]!.blocks[0]!.bars.map((b, i) => ({ ...b, grooveId: verse.id, fillId: i === 3 ? roll.id : null }));
    setup([{ ...song, segments: [{ ...song.segments[0]!, blocks: [{ ...song.segments[0]!.blocks[0]!, bars }] }] }]);
    const motif = within(mine()).getByRole('article').querySelector<HTMLElement>('.motif')!;
    expect(motif).toHaveAttribute('aria-hidden', 'true');
    const strokes = [...motif.querySelectorAll<HTMLElement>('.motif-stroke')];
    expect(strokes.map((s) => s.style.getPropertyValue('--pc'))).toEqual([`var(--ctp-${verse.color})`, `var(--ctp-${roll.color})`]);
    expect(strokes.map((s) => s.classList.contains('fill'))).toEqual([false, true]);
    expect(motif.textContent).toBe('');
    expect(motif.querySelectorAll('.motif-dot')).toHaveLength(0);
  });

  it('Langer Song: die ersten 12 Reihen in fester Größe', () => {
    setup([appendSegment(appendSegment(songWith({ title: 'Lang' }), { name: 'A', bars: 64 }), { name: 'B', bars: 56 })]);
    const motif = within(mine()).getByRole('article').querySelector<HTMLElement>('.motif')!;
    expect(motif.querySelectorAll('.motif-row')).toHaveLength(12);
    expect(motif.style.getPropertyValue('--motif-rows')).toBe('');
    const css = readFileSync(resolve(process.cwd(), 'src/ui/styles.css'), 'utf8');
    expect(css).toMatch(/\.motif \{[^}]*--motif-row:\s*5px;/);
  });

  it('Neuer Song', () => {
    setup([songWith({ title: 'Leer' })]);
    const motif = within(mine()).getByRole('article').querySelector<HTMLElement>('.motif')!;
    expect(motif.querySelectorAll('.motif-stroke')).toHaveLength(0);
    expect(motif.querySelectorAll('.motif-dot').length).toBeGreaterThan(0);
  });
});

describe('Spec song-library › Song umbenennen (UI)', () => {
  it('Titel ändern', async () => {
    const { store, user } = setup([songWith({ title: 'Neuer Song' })]);
    await user.click(within(songList()).getByText('Neuer Song'));
    await user.click(screen.getByRole('heading', { level: 2, name: 'Neuer Song' }));
    const input = screen.getByLabelText('Songtitel');
    await user.clear(input);
    await user.type(input, 'Uprising');
    await user.tab();
    await user.click(within(screen.getByRole('navigation', { name: 'Pfad' })).getByRole('button', { name: 'Songs' }));
    expect(within(songList()).getByText('Uprising')).toBeInTheDocument();
    expect(store.getState().songs[0]!.title).toBe('Uprising');
  });

  it('Leerer Titel', async () => {
    const { store, user } = setup([songWith({ title: 'Hysteria' })]);
    await user.click(within(songList()).getByText('Hysteria'));
    await user.click(screen.getByRole('heading', { level: 2, name: 'Hysteria' }));
    const input = screen.getByLabelText('Songtitel');
    await user.clear(input);
    await user.tab();
    expect(store.getState().songs[0]!.title).toBe('Hysteria');
    expect(screen.getByRole('heading', { level: 2, name: 'Hysteria' })).toBeInTheDocument();
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
  });

  it('Löschen abgebrochen', async () => {
    const { store, user } = setup([songWith({ title: 'Hysteria' })]);
    await user.click(within(songList()).getByText('Hysteria'));
    await user.click(screen.getByRole('button', { name: 'Song löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    expect(store.getState().songs).toHaveLength(1);
  });
});
