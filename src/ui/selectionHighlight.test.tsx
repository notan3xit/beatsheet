import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import { allBars } from '../domain/songPatterns';
import { appendSegment, setBarProps } from '../domain/structure';
import type { Pattern, Song } from '../domain/types';
import { notebookWith } from '../test/notebook';
import { App } from './App';

function seed(...specs: { kind: 'groove' | 'fill'; name: string; length?: number }[]): Pattern[] {
  const result: Pattern[] = [];
  for (const spec of specs) result.push(createPattern(result, spec));
  return result;
}

let hitTarget: Element | null = null;

function setup(patterns: Pattern[], structure: (song: Song) => Song) {
  hitTarget = null;
  const notebook = notebookWith(patterns, 'book');
  act(() => notebook.store.updateSong(structure));
  const user = userEvent.setup();
  render(<App store={notebook.store} hitTest={() => hitTarget} />);
  return { ...notebook, user, bars: () => allBars(notebook.currentSong()) };
}

const structure = () => screen.getByRole('region', { name: 'Struktur' });
const bar = (n: number) => within(structure()).getByRole('button', { name: `Takt ${n}` });
/** Hervorgehobene Balken als [Art, Takt-ID bzw. Fill-Name]. */
const highlighted = () =>
  [...structure().querySelectorAll('.item.highlighted')].map((el) => [
    el.classList.contains('fill') ? 'fill' : 'groove',
    el.classList.contains('fill') ? el.getAttribute('title') : el.getAttribute('data-bar-id'),
  ]);

describe('Spec songbook-view › Hervorhebung von Auswahl und Ablegeziel', () => {
  it('Ausgewählte Takte', async () => {
    const [a] = seed({ kind: 'groove', name: 'A' });
    const { user, bars } = setup([a!], (s) => appendSegment(s, { name: 'V', bars: 4, grooveId: a!.id }));
    await user.click(bar(2));
    await user.keyboard('{Shift>}');
    await user.click(bar(3));
    await user.keyboard('{/Shift}');
    expect(highlighted()).toEqual([
      ['groove', bars()[1]!.id],
      ['groove', bars()[2]!.id],
    ]);
    expect(structure().querySelectorAll('.item.ghost')).toHaveLength(0);
  });

  it('Fill im ausgewählten Takt', async () => {
    const [a, f] = seed({ kind: 'groove', name: 'A' }, { kind: 'fill', name: 'f1', length: 1 });
    const { user, bars } = setup([a!, f!], (s) => {
      const song = appendSegment(s, { name: 'V', bars: 4, grooveId: a!.id });
      return setBarProps(song, [song.segments[0]!.blocks[0]!.bars[3]!.id], { fillId: f!.id });
    });
    await user.click(bar(4));
    expect(highlighted()).toEqual([
      ['groove', bars()[3]!.id],
      ['fill', 'f1'],
    ]);
  });

  it('Leerer Takt', async () => {
    const { user, bars } = setup([], (s) => appendSegment(s, { name: 'V', bars: 3 }));
    await user.click(bar(2));
    const ghosts = [...structure().querySelectorAll('.item.ghost')].map((el) => el.getAttribute('data-bar-id'));
    expect(ghosts).toEqual([bars()[1]!.id]);
  });

  it('Ablegeziel beim Ziehen', () => {
    const [a, b] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const { bars } = setup([a!, b!], (s) => appendSegment(s, { name: 'V', bars: 8, grooveId: a!.id }));
    const handle = within(screen.getByRole('region', { name: 'Patterns' }))
      .getByRole('article', { name: 'B' })
      .querySelector('header') as HTMLElement;
    const mouse = { pointerType: 'mouse', button: 0, pointerId: 1 };
    fireEvent.pointerDown(handle, { ...mouse, clientX: 10, clientY: 10 });
    hitTarget = bar(6);
    fireEvent.pointerMove(document, { ...mouse, clientX: 40, clientY: 30 });
    expect(highlighted()).toEqual([['groove', bars()[5]!.id]]);
    fireEvent.keyDown(document, { key: 'Escape' });
  });
});

describe('Spec songbook-view › Pattern-Chips (Haken)', () => {
  it('Gewählter Chip mit Haken', async () => {
    const [a, b] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const { user } = setup([a!, b!], (s) => appendSegment(s, { name: 'V', bars: 2, grooveId: a!.id }));
    await user.click(bar(1));
    const chips = within(screen.getByRole('group', { name: 'Groove' }));
    expect(chips.getByRole('button', { name: 'A' }).querySelector('.chip-check')).not.toBeNull();
    expect(chips.getByRole('button', { name: 'B' }).querySelector('.chip-check')).toBeNull();
  });
});

describe('Spec songbook-view › Hervorhebung der Patterns ausgewählter Takte', () => {
  const cards = () =>
    [...document.querySelectorAll('.pattern-card.highlighted')].map((card) => card.querySelector('.pattern-name')!.textContent);
  const selectBoth = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(bar(1));
    await user.keyboard('{Shift>}');
    await user.click(bar(2));
    await user.keyboard('{/Shift}');
  };

  /** Groove A über alle Takte, B ungenutzt, Fill im letzten Takt. */
  const grooveAndFill = (bars: number, length: number) => {
    const [a, b, f] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' }, { kind: 'fill', name: 'f1', length });
    return setup([a!, b!, f!], (s) => {
      const song = appendSegment(s, { name: 'V', bars, grooveId: a!.id });
      return setBarProps(song, [song.segments[0]!.blocks[0]!.bars[bars - 1]!.id], { fillId: f!.id });
    });
  };

  it('Takt mit Groove und Fill', async () => {
    const { user } = grooveAndFill(1, 1);
    expect(cards()).toEqual([]);
    await user.click(bar(1));
    expect(cards()).toEqual(['A', 'f1']);
  });

  it('Mehrere Takte mit verschiedenen Grooves', async () => {
    const [a, b] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const { user } = setup([a!, b!], (s) => {
      const song = appendSegment(s, { name: 'V', bars: 2, grooveId: a!.id });
      return setBarProps(song, [song.segments[0]!.blocks[0]!.bars[1]!.id], { grooveId: b!.id });
    });
    await selectBoth(user);
    expect(cards()).toEqual(['A', 'B']);
  });

  it('Von einem Fill überdeckter Takt', async () => {
    const { user } = grooveAndFill(2, 8);
    await user.click(bar(1));
    expect(cards()).toEqual(['A', 'f1']);
  });

  it('Auswahl aufheben', async () => {
    const { user } = grooveAndFill(1, 1);
    await user.click(bar(1));
    await user.keyboard('{Escape}');
    expect(cards()).toEqual([]);
  });

  it('Segment auswählen', async () => {
    const { user } = grooveAndFill(1, 1);
    await user.click(within(structure()).getByRole('button', { name: 'V' }));
    expect(cards()).toEqual([]);
  });
});
