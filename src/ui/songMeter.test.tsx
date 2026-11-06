import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import type { Pattern, Song } from '../domain/types';
import { createNotebookStore } from '../state/notebookStore';
import { songWith } from '../test/songs';
import { App } from './App';

const groove = (meter?: number, length = 4, name = 'Verse'): Pattern => ({
  ...createPattern([], { kind: 'groove', name, length }),
  ...(meter === undefined ? {} : { meter }),
});

function setup(song: Song, view: 'book' | 'pattern', locked: boolean) {
  const store = createNotebookStore([song]);
  store.openSong(song.id);
  store.setLocked(locked);
  if (view === 'pattern') store.openPattern(song.patterns[0]!.id);
  const user = userEvent.setup();
  render(<App store={store} hitTest={() => null} />);
  return { store, user, current: () => store.getState().songs[0]!, pattern: () => store.getState().songs[0]!.patterns[0]! };
}

const songIn = (meter: number | undefined, ...patterns: Pattern[]): Song => ({
  ...songWith({ title: 'Toxicity', patterns }),
  ...(meter === undefined ? {} : { meter }),
});

const header = () => document.querySelector('.songbook-header') as HTMLElement;
const editor = () => document.querySelector('.editor-header') as HTMLElement;
const songSelect = () => within(header()).getByRole('combobox', { name: 'Standard-Takt' });
const toggle = () => within(editor()).getByRole('button', { name: 'Eigene Taktart' });
const meterSelect = () => within(editor()).queryByRole('combobox', { name: 'Taktart' });
const meterValue = () => editor().querySelector('.value-meter') as HTMLElement;

describe('Spec song-meter › Standard-Takt auf der Doppelseite', () => {
  it('Angabe im Kopf', () => {
    setup(songIn(3), 'book', true);
    const mark = within(header()).getByRole('img', { name: 'Standard-Takt: 3/4' });
    expect(mark).toHaveTextContent('3/4');
    expect(mark.querySelector('svg')).toBeInTheDocument();
    const tempo = within(header()).getByRole('img', { name: 'Song-Tempo: 120 BPM' });
    expect(tempo.nextElementSibling).toBe(mark);
  });

  it('Auswahl', () => {
    setup(songIn(undefined), 'book', false);
    expect(songSelect()).toHaveDisplayValue('4/4');
    expect(within(songSelect()).getAllByRole('option').map((o) => o.textContent)).toEqual(['3/4', '4/4', '5/4', '6/4', '7/4']);
  });

  it('Auswahl steht hinter dem Tempo und ändert den Standard-Takt', async () => {
    const { user, current } = setup({ ...songIn(undefined), revision: 4 }, 'book', false);
    const tempo = within(header()).getByRole('button', { name: 'Song-Tempo: 120 BPM' });
    expect(tempo.nextElementSibling).toContainElement(songSelect());
    expect(tempo.nextElementSibling!.querySelector('svg')).toBeInTheDocument();
    await user.selectOptions(songSelect(), '3/4');
    expect(current().meter).toBe(3);
    expect(current().revision).toBe(5);
    expect(songSelect()).toHaveDisplayValue('3/4');
  });
});

describe('Spec song-lock › Gesperrte Doppelseite (Standard-Takt)', () => {
  it('Kopf der Doppelseite', () => {
    setup(songIn(undefined), 'book', true);
    expect(within(header()).getByText('4/4')).toBeInTheDocument();
    expect(within(header()).queryByRole('combobox')).not.toBeInTheDocument();
  });
});

describe('Spec song-lock › Gleiche Anordnung beim Entsperren (Standard-Takt)', () => {
  it('Standard-Takt', async () => {
    const { user } = setup(songIn(3), 'book', true);
    expect(within(header()).getByText('3/4')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Song entsperren' }));
    expect(songSelect()).toHaveDisplayValue('3/4');
  });
});

describe('Spec song-meter › Eigene Taktart im Pattern-Editor', () => {
  it('Pattern folgt dem Song', () => {
    setup(songIn(undefined, groove()), 'pattern', false);
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(meterValue()).toHaveTextContent('4/4');
    expect(meterSelect()).not.toBeInTheDocument();
  });

  it('Der Song-Wert steht im Pattern ohne eigene Taktart', () => {
    setup(songIn(5, groove()), 'pattern', false);
    expect(meterValue()).toHaveTextContent('5/4');
  });

  it('Eigene Taktart einschalten', async () => {
    const { user, pattern } = setup(songIn(undefined, groove()), 'pattern', false);
    await user.click(toggle());
    expect(pattern().meter).toBe(4);
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(meterSelect()).toHaveDisplayValue('4/4');
  });

  it('Keine Option „Wie Song“', async () => {
    const { user } = setup(songIn(undefined, groove()), 'pattern', false);
    await user.click(toggle());
    expect(within(meterSelect()!).getAllByRole('option').map((o) => o.textContent)).toEqual(['3/4', '4/4', '5/4', '6/4', '7/4']);
  });

  it('Eigenen Wert wählen', async () => {
    const { user, pattern } = setup(songIn(undefined, groove(4)), 'pattern', false);
    await user.selectOptions(meterSelect()!, '7/4');
    expect(pattern().meter).toBe(7);
  });

  it('Eigene Taktart ausschalten', async () => {
    const { user, pattern } = setup(songIn(undefined, groove(7)), 'pattern', false);
    await user.click(toggle());
    expect(pattern()).not.toHaveProperty('meter');
    expect(meterSelect()).not.toBeInTheDocument();
    expect(meterValue()).toHaveTextContent('4/4');
  });

  it('Rückgängig', async () => {
    const { user, pattern } = setup(songIn(undefined, groove(5)), 'pattern', false);
    await user.selectOptions(meterSelect()!, '7/4');
    await user.click(within(editor()).getByRole('button', { name: 'Rückgängig' }));
    expect(pattern().meter).toBe(5);
    expect(meterSelect()).toHaveDisplayValue('5/4');
  });

  it('Ein- und Ausschalten lässt Länge und Schläge unverändert', async () => {
    const { user, pattern } = setup(songIn(undefined, groove(undefined, 6)), 'pattern', false);
    const beats = pattern().beats;
    await user.click(toggle());
    await user.selectOptions(meterSelect()!, '3/4');
    await user.click(toggle());
    expect(pattern().beats).toEqual(beats);
  });
});

describe('Spec song-lock › Gesperrter Pattern-Editor (Taktart)', () => {
  it('Werte als Text', () => {
    setup(songIn(undefined, groove()), 'pattern', true);
    expect(meterValue()).toHaveTextContent('4/4');
    expect(meterSelect()).not.toBeInTheDocument();
  });

  it('Eigene Taktart gekennzeichnet', () => {
    setup(songIn(undefined, groove(7)), 'pattern', true);
    expect(meterValue()).toHaveTextContent('7/4');
    expect(within(editor()).getByRole('img', { name: 'Eigene Taktart' })).toBeInTheDocument();
    expect(within(editor()).queryByRole('button', { name: 'Eigene Taktart' })).not.toBeInTheDocument();
  });

  it('Taktart, die dem Song folgt', () => {
    setup(songIn(undefined, groove()), 'pattern', true);
    expect(within(editor()).queryByRole('img', { name: 'Eigene Taktart' })).not.toBeInTheDocument();
    expect(editor().querySelector('.meter-own svg')).toBeInTheDocument();
    expect(editor().querySelector('.meter-own')).not.toHaveClass('vacant');
    expect(meterValue()).toHaveClass('follows');
  });

  it('Das Symbol bleibt gesperrt gedämpft, nur der Text der eigenen Taktart nicht', () => {
    setup(songIn(undefined, groove(7)), 'pattern', true);
    expect(editor().querySelector('.meter-own')).not.toHaveClass('on');
    expect(meterValue()).not.toHaveClass('follows');
  });
});

describe('Spec song-lock › Gleiche Anordnung beim Entsperren (Taktart des Patterns)', () => {
  const unlock = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button', { name: 'Song entsperren' }));

  it('Taktart eines Patterns, das dem Song folgt', async () => {
    const { user } = setup(songIn(undefined, groove()), 'pattern', true);
    expect(meterValue()).toHaveTextContent('4/4');
    expect(meterValue()).toHaveClass('follows');
    await unlock(user);
    expect(meterValue()).toHaveTextContent('4/4');
    expect(meterValue()).toHaveClass('follows');
    expect(meterValue().tagName).toBe('SPAN');
  });

  it('Eigene Taktart', async () => {
    const { user } = setup(songIn(undefined, groove(7)), 'pattern', true);
    expect(meterValue().tagName).toBe('SPAN');
    expect(meterValue()).toHaveTextContent('7/4');
    await unlock(user);
    expect(meterValue().tagName).toBe('SELECT');
    expect(meterSelect()).toHaveDisplayValue('7/4');
  });

  it('Der Platz des Umschalters bleibt auch gesperrt erhalten', () => {
    setup(songIn(undefined, groove()), 'pattern', true);
    expect(editor().querySelector('.meter-own')).toBeInTheDocument();
  });
});

describe('Spec songbook-view › Kompakte Pattern-Karten (Taktart)', () => {
  const meta = (name: string) => {
    const card = within(screen.getByRole('region', { name: 'Patterns' }))
      .getAllByRole('article')
      .find((c) => within(c).getByRole('heading').textContent === name)!;
    return card.querySelector('.pattern-meta')!.textContent;
  };

  it('Kopfzeile', () => {
    setup(songIn(undefined, groove()), 'book', true);
    expect(meta('Verse')).toBe('4 Beats');
  });

  it('Abweichende Taktart', () => {
    setup(songIn(undefined, groove(7, 7, 'Bridge')), 'book', true);
    expect(meta('Bridge')).toBe('7 Beats · 7/4');
  });

  it('Eigene Taktart gleich dem Standard-Takt', () => {
    setup(songIn(undefined, groove(4)), 'book', true);
    expect(meta('Verse')).toBe('4 Beats');
  });

  it('Eigene 4/4 weicht von einem anderen Standard-Takt ab', () => {
    setup(songIn(3, groove(4)), 'book', true);
    expect(meta('Verse')).toBe('4 Beats · 4/4');
  });
});
