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
    const before = within(patternCards()[0]!).getByRole('img', { name: 'Noten: Verse-Beat' }).innerHTML;
    await user.click(within(patternPage()).getByRole('button', { name: 'Verse-Beat bearbeiten' }));
    await user.click(screen.getByRole('button', { name: 'Snare, Beat 1, Position 1' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Pfad' })).getAllByRole('button').at(-1)!);
    const card = patternCards()[0]!;
    expect(within(card).getByRole('img', { name: 'Noten: Verse-Beat' }).innerHTML).not.toBe(before);
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
    expect(within(card).getByText('4 Beats')).toBeInTheDocument();
    expect(within(card).queryByText('noch leer')).not.toBeInTheDocument();
    const notes = within(card).getByRole('img', { name: 'Noten: Verse-Beat' });
    // Leeres System mit einer Ganzen Pause
    expect(notes.querySelectorAll('.vf-stave')).toHaveLength(1);
    expect(notes.querySelectorAll('.vf-stavenote')).toHaveLength(1);
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
    // Name nur am ersten Takt des Segments (Groove-Kennzeichnung: Name nur bei Wechsel)
    expect(within(page).getAllByText('A')).toHaveLength(1);
    expect(within(page).queryByText('f1')).not.toBeInTheDocument();
    expect(page.querySelector('.item.fill')).toHaveAttribute('title', 'f1');
  });

  it('Folgetakt mit Tooltip', () => {
    const patterns = seed({ kind: 'groove', name: 'A' });
    const { store } = setup(patterns);
    act(() => store.updateSong((song) => appendSegment(song, { name: 'Verse', bars: 2, grooveId: patterns[0]!.id })));
    const grooves = [...structurePage().querySelectorAll('.item.groove')];
    expect(grooves.map((g) => [g.getAttribute('title'), g.textContent])).toEqual([
      ['A', 'A'],
      ['A', ''],
    ]);
  });
});

describe('Spec songbook-view › Fill-Blöcke (UI)', () => {
  it('Kurzer Fill', async () => {
    const patterns = seed({ kind: 'groove', name: 'A' }, { kind: 'fill', name: 'f1', length: 1 });
    const { store, user } = setup(patterns);
    // Fill mit Schlägen, damit sichtbar wird, dass trotzdem keine Noten erscheinen
    await user.click(within(patternPage()).getByRole('button', { name: 'f1 bearbeiten' }));
    await user.click(screen.getByRole('button', { name: 'Snare, Beat 1, Position 1' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Pfad' })).getAllByRole('button').at(-1)!);
    act(() => store.updateSong((song) => {
      const withSegment = appendSegment(song, { name: 'Verse', bars: 4, grooveId: patterns[0]!.id });
      const last = withSegment.segments[0]!.blocks[0]!.bars[3]!;
      return setBarProps(withSegment, [last.id], { fillId: patterns[1]!.id });
    }));
    const block = structurePage().querySelector('.item.fill')!;
    expect(block).toHaveAttribute('title', 'f1');
    expect(within(structurePage()).queryByText('f1')).not.toBeInTheDocument();
    // Kurzschrift statt Noten: Snare auf Position 1 -> „s“
    expect([...block.querySelectorAll('.mark')].map((m) => m.textContent)).toEqual(['s']);
    expect(within(structurePage()).queryByRole('img')).not.toBeInTheDocument();
  });

  it('Fill über Zeilenumbruch', async () => {
    const patterns = seed({ kind: 'groove', name: 'A' }, { kind: 'fill', name: 'Build', length: 8 });
    const { store, user } = setup(patterns);
    await user.click(within(patternPage()).getByRole('button', { name: 'Build bearbeiten' }));
    for (const beat of [1, 8]) await user.click(screen.getByRole('button', { name: `Snare, Beat ${beat}, Position 1` }));
    await user.click(within(screen.getByRole('navigation', { name: 'Pfad' })).getAllByRole('button').at(-1)!);
    act(() => store.updateSong((song) => {
      const withSegment = appendSegment(song, { name: 'Verse', bars: 5, grooveId: patterns[0]!.id });
      const last = withSegment.segments[0]!.blocks[0]!.bars[4]!;
      return setBarProps(withSegment, [last.id], { fillId: patterns[1]!.id });
    }));
    const parts = [...structurePage().querySelectorAll('.item.fill')];
    expect(parts.map((p) => [...p.querySelectorAll('.mark')].map((m) => m.textContent))).toEqual([['s'], ['s']]);
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

describe('Spec songbook-view › Flache Zeilen (UI)', () => {
  const rowOf = (n: number) => within(structurePage()).getByRole('button', { name: `Takt ${n}` }).closest('.structure-row')!;
  const isFlat = (n: number) => rowOf(n).classList.contains('flat');
  const barButton = (n: number) => within(structurePage()).getByRole('button', { name: `Takt ${n}` });

  /** Zwei Segmente „Verse“ und „Chorus“ mit je vier Takten Groove A, der letzte mit Fill f1; Chorus ohne Fill, wenn `same` falsch ist. */
  function twoVerses(same = true) {
    const patterns = seed({ kind: 'groove', name: 'A' }, { kind: 'fill', name: 'f1', length: 1 });
    const [a, f1] = patterns;
    const ctx = setup(patterns);
    act(() =>
      ctx.store.updateSong((song) => {
        const s = appendSegment(appendSegment(song, { name: 'Verse', bars: 4, grooveId: a!.id }), { name: 'Chorus', bars: 4, grooveId: a!.id });
        const lasts = s.segments.map((seg) => seg.blocks[0]!.bars[3]!.id);
        return setBarProps(s, same ? lasts : lasts.slice(0, 1), { fillId: f1!.id });
      }),
    );
    return { ...ctx, a: a!, f1: f1! };
  }

  it('Darstellung', () => {
    twoVerses();
    expect([1, 5].map(isFlat)).toEqual([false, true]);
    const flat = rowOf(5);
    expect(flat.querySelectorAll('.item.groove')).toHaveLength(4);
    expect(flat.querySelectorAll('.item.fill')).toHaveLength(1);
    expect(flat.querySelector('.item.fill')).toHaveAttribute('title', 'f1');
  });

  it('Zeilennummern', () => {
    twoVerses();
    // Chorus (Takte 5–8) ist flach; vier 4/4-Takte stehen in einer Zeile
    expect(rowOf(5).querySelector('.row-number')).toHaveTextContent('5');
  });

  it('Takt in flacher Zeile auswählen', async () => {
    const { user } = twoVerses();
    await user.click(barButton(6));
    expect(barButton(6)).toHaveAttribute('aria-pressed', 'true');
    expect(rowOf(6).querySelector('.item.groove.highlighted[data-bar-id]')).not.toBeNull();
    expect(screen.getByRole('dialog', { name: 'Takt-Auswahl' })).toBeInTheDocument();
  });

  it('Bereich über flache Zeilen', async () => {
    const { user } = twoVerses();
    await user.click(barButton(1));
    await user.keyboard('{Shift>}');
    await user.click(barButton(6));
    await user.keyboard('{/Shift}');
    expect([1, 2, 3, 4, 5, 6, 7].map((n) => barButton(n).getAttribute('aria-pressed'))).toEqual([
      ...Array(6).fill('true'),
      'false',
    ]);
  });

  it('Original ändert sich', async () => {
    const { user, store } = twoVerses();
    await user.click(barButton(4));
    act(() => store.updateSong((song) => setBarProps(song, [song.segments[0]!.blocks[0]!.bars[3]!.id], { fillId: null })));
    expect(isFlat(5)).toBe(false);
    expect(barButton(4)).toHaveAttribute('aria-pressed', 'true');
  });

  it('Wiederholung entsteht', async () => {
    const { user, store, f1 } = twoVerses(false);
    expect(isFlat(5)).toBe(false);
    await user.click(barButton(8));
    act(() => store.updateSong((song) => setBarProps(song, [song.segments[1]!.blocks[0]!.bars[3]!.id], { fillId: f1.id })));
    expect(isFlat(5)).toBe(true);
    expect(barButton(8)).toHaveAttribute('aria-pressed', 'true');
    expect(rowOf(8).querySelector('.item.fill.highlighted')).not.toBeNull();
  });

  it('Leeres Intro und Entsperren', async () => {
    const patterns = seed({ kind: 'groove', name: 'A' });
    const { store, user } = setup(patterns);
    act(() => store.updateSong((song) => appendSegment(appendSegment(song, { name: 'Intro', bars: 4 }), { name: 'Verse', bars: 4, grooveId: patterns[0]!.id })));
    expect(isFlat(1)).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Song sperren' }));
    expect([1, 5].map(isFlat)).toEqual([true, false]);
    await user.click(screen.getByRole('button', { name: 'Song entsperren' }));
    expect(isFlat(1)).toBe(false);
  });

  it('Zeilen behalten beim Umschalten ihr Element', async () => {
    const patterns = seed({ kind: 'groove', name: 'A' });
    const { store, user } = setup(patterns);
    act(() => store.updateSong((song) => appendSegment(song, { name: 'Intro', bars: 4 })));
    const before = rowOf(1);
    await user.click(screen.getByRole('button', { name: 'Song sperren' }));
    expect(rowOf(1)).toBe(before);
  });
});

describe('Spec songbook-view › Segmentnamen neben der Struktur (UI)', () => {
  it('Langer Name', () => {
    const { store } = setup([]);
    const name = 'Refrain mit doppelten Fills und Breaks am Ende';
    act(() => store.updateSong((song) => appendSegment(song, { name, bars: 1 })));
    expect(within(structurePage()).getByRole('button', { name })).toHaveAttribute('title', name);
  });

  it('Segment auswählen', async () => {
    const { store, user } = setup([]);
    act(() => store.updateSong((song) => appendSegment(appendSegment(song, { name: 'Intro', bars: 1 }), { name: 'Verse', bars: 1 })));
    await user.click(within(structurePage()).getByRole('button', { name: 'Verse' }));
    expect(screen.getByRole('dialog', { name: 'Segment Verse' })).toBeInTheDocument();
  });

  it('Segment, das mit einer flachen Zeile beginnt, ist gekennzeichnet', () => {
    const patterns = seed({ kind: 'groove', name: 'A' });
    const { store } = setup(patterns);
    act(() => store.updateSong((song) => ['Verse', 'Solo'].reduce((s, name) => appendSegment(s, { name, bars: 2, grooveId: patterns[0]!.id }), song)));
    const segments = [...structurePage().querySelectorAll('.segment')];
    expect(segments.map((s) => s.classList.contains('starts-flat'))).toEqual([false, true]);
  });
});

describe('Spec songbook-view › Struktur ausklappen', () => {
  const toggle = (name: 'Struktur ausklappen' | 'Struktur einklappen') => screen.getByRole('button', { name });
  const flatRows = () => structurePage().querySelectorAll('.structure-row.flat').length;

  /** Verse und Refrain mit Groove A, dann der gleiche Refrain noch einmal. */
  function withRepeat() {
    const patterns = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const ctx = setup(patterns);
    act(() =>
      ctx.store.updateSong((song) =>
        appendSegment(appendSegment(appendSegment(song, { name: 'Verse', bars: 4, grooveId: patterns[0]!.id }), { name: 'Refrain', bars: 4, grooveId: patterns[1]!.id }), {
          name: 'Refrain',
          bars: 4,
          grooveId: patterns[1]!.id,
        }),
      ),
    );
    return ctx;
  }

  it('Ausklappen', async () => {
    const { user } = withRepeat();
    expect(flatRows()).toBe(1);
    expect(toggle('Struktur ausklappen')).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle('Struktur ausklappen'));
    expect(flatRows()).toBe(0);
    expect(toggle('Struktur einklappen')).toHaveAttribute('aria-pressed', 'true');
  });

  it('Einklappen', async () => {
    const { user } = withRepeat();
    await user.click(toggle('Struktur ausklappen'));
    await user.click(toggle('Struktur einklappen'));
    expect(flatRows()).toBe(1);
  });

  it('Gesperrter Song', async () => {
    const patterns = seed({ kind: 'groove', name: 'A' });
    const { store, user } = setup(patterns);
    act(() => store.updateSong((song) => appendSegment(appendSegment(song, { name: 'Intro', bars: 4 }), { name: 'Verse', bars: 4, grooveId: patterns[0]!.id })));
    await user.click(screen.getByRole('button', { name: 'Song sperren' }));
    expect(flatRows()).toBe(1);
    await user.click(toggle('Struktur ausklappen'));
    expect(flatRows()).toBe(0);
    expect(screen.getByRole('button', { name: 'Song entsperren' })).toBeInTheDocument();
  });

  it('Erneutes Öffnen', async () => {
    const { user, store, song } = withRepeat();
    await user.click(toggle('Struktur ausklappen'));
    act(() => store.backToList());
    act(() => store.openSong(song.id));
    expect(toggle('Struktur ausklappen')).toHaveAttribute('aria-pressed', 'false');
    expect(flatRows()).toBe(1);
  });

  it('Lage in der Kopfzeile', () => {
    withRepeat();
    const buttons = [...document.querySelector('.songbook-header .page-title')!.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') ?? b.textContent);
    // „Song löschen“ links vom Schalter (dazwischen „Verlauf“, song-history), der Schalter direkt links vom Schloss
    expect(buttons.slice(-2)).toEqual(['Struktur ausklappen', 'Song sperren']);
    expect(buttons.indexOf('Song löschen')).toBeLessThan(buttons.indexOf('Struktur ausklappen'));
  });

  it('Pattern-Editor', () => {
    const { store, patternsNow } = withRepeat();
    act(() => store.openPattern(patternsNow()[0]!.id));
    expect(screen.queryByRole('button', { name: /^Struktur (aus|ein)klappen$/ })).not.toBeInTheDocument();
  });
});
