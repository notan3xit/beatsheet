import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import { appendSegment, setBarProps } from '../domain/structure';
import type { Pattern } from '../domain/types';
import { notebookWith } from '../test/notebook';
import { App } from './App';

function seed(...specs: { kind: 'groove' | 'fill'; name: string; length?: number }[]): Pattern[] {
  const result: Pattern[] = [];
  for (const spec of specs) result.push(createPattern(result, spec));
  return result;
}

function setup(patterns: Pattern[]) {
  const notebook = notebookWith(patterns, 'book');
  const user = userEvent.setup();
  render(<App store={notebook.store} />);
  return { ...notebook, user };
}

const structurePage = () => screen.getByRole('region', { name: 'Struktur' });
const patternPage = () => screen.getByRole('region', { name: 'Patterns' });
const patternCards = () => within(patternPage()).getAllByRole('article');

describe('Spec songbook-view › Doppelseite', () => {
  it('Song öffnen', () => {
    const patterns = seed({ kind: 'groove', name: 'Verse-Beat' }, { kind: 'fill', name: 'Tom-Run' });
    const { store } = setup(patterns);
    act(() => store.updateSong((song) => appendSegment(appendSegment(song, { name: 'Intro', bars: 2, grooveId: patterns[0]!.id }), { name: 'Verse', bars: 4 })));
    expect(within(structurePage()).getAllByRole('heading').map((h) => h.textContent)).toEqual(['Intro', 'Verse']);
    expect(patternCards().map((c) => within(c).getByRole('heading').textContent)).toEqual(['Verse-Beat', 'Tom-Run']);
  });

  it('Pattern bearbeiten', async () => {
    const { user } = setup(seed({ kind: 'groove', name: 'Verse-Beat' }));
    expect(within(patternCards()[0]!).getByText('noch leer')).toBeInTheDocument();
    await user.click(within(patternPage()).getByRole('button', { name: 'Verse-Beat bearbeiten' }));
    await user.click(screen.getByRole('button', { name: 'Snare, Beat 1, Position 1' }));
    await user.click(screen.getByRole('button', { name: 'Zurück zum Song' }));
    const card = patternCards()[0]!;
    expect(within(card).queryByText('noch leer')).not.toBeInTheDocument();
    expect(within(card).getByRole('img', { name: 'Noten: Verse-Beat' })).toBeInTheDocument();
  });
});

describe('Spec songbook-view › Patternseite (UI)', () => {
  it('Reihenfolge', () => {
    const [a, b, c, f] = seed(
      { kind: 'groove', name: 'A' },
      { kind: 'groove', name: 'B' },
      { kind: 'groove', name: 'C' },
      { kind: 'fill', name: 'F' },
    );
    const { store } = setup([a!, b!, c!, f!]);
    act(() => store.updateSong((song) => appendSegment(appendSegment(song, { name: 'V', bars: 1, grooveId: b!.id }), { name: 'C', bars: 1, grooveId: a!.id })));
    expect(patternCards().map((card) => within(card).getByRole('heading').textContent)).toEqual(['B', 'A', 'C', 'F']);
  });

  it('Leerer Platzhalter', () => {
    setup(seed({ kind: 'groove', name: 'Verse-Beat' }));
    const card = patternCards()[0]!;
    expect(within(card).getByRole('heading')).toHaveTextContent('Verse-Beat');
    expect(within(card).getByText('noch leer')).toBeInTheDocument();
    expect(within(card).getByText('4 Beats')).toBeInTheDocument();
  });
});

describe('Spec songbook-view › Struktur-Darstellung (UI)', () => {
  it('Takte, Groove-Namen, Fill-Block und Akzent erscheinen', () => {
    const patterns = seed({ kind: 'groove', name: 'A' }, { kind: 'fill', name: 'f1', length: 1 });
    const { store } = setup(patterns);
    act(() => store.updateSong((song) => {
      const withSegment = appendSegment(song, { name: 'Verse', bars: 4, grooveId: patterns[0]!.id });
      const last = withSegment.segments[0]!.blocks[0]!.bars[3]!;
      return setBarProps(withSegment, [last.id], { fillId: patterns[1]!.id });
    }));
    const page = structurePage();
    expect(within(page).getAllByRole('button', { name: /^Takt \d+/ })).toHaveLength(4);
    expect(within(page).getAllByText('A')).toHaveLength(4);
    expect(within(page).getByText('f1')).toBeInTheDocument();
  });
});

describe('Spec songbook-view › Fill-Blöcke (UI)', () => {
  it('Kurzer Fill', async () => {
    const patterns = seed({ kind: 'groove', name: 'A' }, { kind: 'fill', name: 'f1', length: 1 });
    const { store, user } = setup(patterns);
    // Fill mit Schlägen, damit sichtbar wird, dass trotzdem keine Noten erscheinen
    await user.click(within(patternPage()).getByRole('button', { name: 'f1 bearbeiten' }));
    await user.click(screen.getByRole('button', { name: 'Snare, Beat 1, Position 1' }));
    await user.click(screen.getByRole('button', { name: 'Zurück zum Song' }));
    act(() => store.updateSong((song) => {
      const withSegment = appendSegment(song, { name: 'Verse', bars: 4, grooveId: patterns[0]!.id });
      const last = withSegment.segments[0]!.blocks[0]!.bars[3]!;
      return setBarProps(withSegment, [last.id], { fillId: patterns[1]!.id });
    }));
    expect(within(structurePage()).getByText('f1')).toBeInTheDocument();
    expect(within(structurePage()).queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('Spec songbook-view › Kompakte Zeilen (UI)', () => {
  it('Langer Groove-Name', () => {
    const patterns = seed({ kind: 'groove', name: 'Verse-Beat mit Ghost Notes' });
    const { store } = setup(patterns);
    act(() => store.updateSong((song) => appendSegment(song, { name: 'Verse', bars: 1, beats: 2, grooveId: patterns[0]!.id })));
    expect(within(structurePage()).getByTitle('Verse-Beat mit Ghost Notes')).toHaveTextContent('Verse-Beat mit Ghost Notes');
  });
});

describe('Spec songbook-view › Leseansicht ohne Bedienelemente', () => {
  it('Song mit Struktur ohne Auswahl', () => {
    const { store } = setup(seed({ kind: 'groove', name: 'A' }));
    act(() => store.updateSong((song) => appendSegment(appendSegment(song, { name: 'Intro', bars: 2 }), { name: 'Verse', bars: 3 })));
    const page = structurePage();
    for (const role of ['textbox', 'combobox', 'spinbutton', 'checkbox', 'dialog'] as const) {
      expect(within(page).queryAllByRole(role)).toEqual([]);
    }
    const buttons = within(page).getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent);
    expect(buttons).toEqual(['Intro', 'Takt 1', 'Takt 2', 'Verse', 'Takt 3', 'Takt 4', 'Takt 5']);
  });

  it('Leerer Song', () => {
    setup([]);
    const buttons = within(structurePage()).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Erstes Segment anlegen']);
    expect(within(structurePage()).queryAllByRole('textbox')).toEqual([]);
    expect(within(structurePage()).queryAllByRole('combobox')).toEqual([]);
  });
});
