import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createPattern, nextColor } from '../domain/pattern';
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

/** Element, das die Trefferprüfung beim Ziehen liefert (jsdom hat kein elementFromPoint). */
let hitTarget: Element | null = null;

function setup(patterns: Pattern[] = [], structure?: (song: Song) => Song) {
  hitTarget = null;
  const notebook = notebookWith(patterns, 'book');
  if (structure) act(() => notebook.store.updateSong(structure));
  const user = userEvent.setup();
  render(<App store={notebook.store} hitTest={() => hitTarget} />);
  const bars = () => allBars(notebook.currentSong());
  return { ...notebook, user, bars };
}

const structure = () => screen.getByRole('region', { name: 'Struktur' });
const bar = (n: number) => within(structure()).getByRole('button', { name: `Takt ${n}` });
const rowOf = (n: number) => bar(n).closest('.structure-row') as HTMLElement;
const segmentOf = (name: string) => within(structure()).getByRole('button', { name }).closest('.segment') as HTMLElement;
const insertButtons = () => within(structure()).queryAllByRole('button', { name: /einfügen|anfügen/ });
const segmentNames = (song: Song) => song.segments.map((s) => s.name);

describe('Spec songbook-view › Takt einfügen beim Überfahren', () => {
  it('Takt zwischen zwei Takten', async () => {
    const [a, b] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const { user, bars, currentSong } = setup([a!, b!], (s) => {
      const song = appendSegment(s, { name: 'V', bars: 4, grooveId: a!.id });
      return setBarProps(song, [song.segments[0]!.blocks[0]!.bars[1]!.id], { beats: 3, grooveId: b!.id });
    });
    await user.hover(rowOf(1));
    await user.click(within(rowOf(1)).getByRole('button', { name: 'Takt nach Takt 2 einfügen' }));
    expect(bars()).toHaveLength(5);
    expect(bars()[2]).toMatchObject({ beats: 3, grooveId: b!.id });
    expect(currentSong().segments[0]!.blocks).toHaveLength(1);
  });

  it('Takt am Blockanfang', async () => {
    const [a] = seed({ kind: 'groove', name: 'A' });
    const { user, bars } = setup([a!], (s) => appendSegment(s, { name: 'V', bars: 6, beats: 3, grooveId: a!.id }));
    await user.hover(rowOf(6));
    expect(within(rowOf(6)).queryByRole('button', { name: /^Takt vor/ })).not.toBeInTheDocument();
    await user.hover(rowOf(1));
    const first = bars()[0]!.id;
    await user.click(within(rowOf(1)).getByRole('button', { name: 'Takt vor Takt 1 einfügen' }));
    expect(bars()).toHaveLength(7);
    expect(bars()[0]).toMatchObject({ beats: 3, grooveId: a!.id });
    expect(bars()[1]!.id).toBe(first);
  });

  it('Touch', () => {
    setup([], (s) => appendSegment(s, { name: 'V', bars: 4 }));
    const row = rowOf(1);
    fireEvent.pointerOver(row, { pointerType: 'touch' });
    fireEvent.pointerEnter(row, { pointerType: 'touch' });
    expect(insertButtons()).toEqual([]);
  });
});

describe('Spec songbook-view › Leseansicht ohne Bedienelemente (Hover)', () => {
  it('Maus verlässt die Struktur', async () => {
    const { user } = setup([], (s) => appendSegment(s, { name: 'V', bars: 4 }));
    await user.hover(rowOf(1));
    expect(insertButtons().length).toBeGreaterThan(0);
    await user.unhover(rowOf(1));
    await user.hover(screen.getByRole('region', { name: 'Patterns' }));
    expect(insertButtons()).toEqual([]);
  });
});

describe('Spec songbook-view › Block und Segment einfügen beim Überfahren', () => {
  it('Block anfügen', async () => {
    const [a] = seed({ kind: 'groove', name: 'A' });
    const { user, currentSong } = setup([a!], (s) => appendSegment(s, { name: 'Verse', bars: 2, grooveId: a!.id }));
    await user.hover(segmentOf('Verse'));
    await user.click(within(segmentOf('Verse')).getByRole('button', { name: 'Block an Verse anfügen' }));
    const blocks = currentSong().segments[0]!.blocks;
    expect(blocks).toHaveLength(2);
    expect(blocks[1]!.bars.map((b) => [b.beats, b.grooveId])).toEqual(Array(2).fill([4, a!.id]));
  });

  it('Segment einfügen', async () => {
    const { user, currentSong } = setup([], (s) => ['Intro', 'Chorus'].reduce((x, name) => appendSegment(x, { name, bars: 1 }), s));
    await user.hover(segmentOf('Intro'));
    await user.click(within(segmentOf('Intro')).getByRole('button', { name: 'Segment nach Intro einfügen' }));
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Segment 3', 'Chorus']);
    expect(within(structure()).getByRole('button', { name: 'Segment 3' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('dialog', { name: 'Segment Segment 3' })).toBeInTheDocument();
  });
});

const patternPage = () => screen.getByRole('region', { name: 'Patterns' });
const cardHandle = (name: string) =>
  within(within(patternPage()).getByRole('article', { name })).getByRole('heading').closest('header') as HTMLElement;
const newButton = (kind: 'Groove' | 'Fill') => within(patternPage()).getByRole('button', { name: `Neuer ${kind}` });
const mouse = { pointerType: 'mouse', button: 0, pointerId: 1 };

/** Ziehen per Zeiger-Ereignissen: drücken, über die Schwelle bewegen, über `over` halten. */
function dragStart(source: HTMLElement, over: Element | null) {
  fireEvent.pointerDown(source, { ...mouse, clientX: 10, clientY: 10 });
  hitTarget = over;
  fireEvent.pointerMove(document, { ...mouse, clientX: 40, clientY: 30 });
}

function dragEnd(source: HTMLElement) {
  fireEvent.pointerUp(document, { ...mouse, clientX: 40, clientY: 30 });
  // Der Browser löst danach auf der Quelle einen Klick aus; nach dem Ziehen darf er nichts bewirken
  fireEvent.click(source);
}

function drag(source: HTMLElement, over: Element | null) {
  dragStart(source, over);
  dragEnd(source);
}

async function selectBars(user: ReturnType<typeof userEvent.setup>, from: number, to: number) {
  await user.click(bar(from));
  await user.keyboard('{Shift>}');
  await user.click(bar(to));
  await user.keyboard('{/Shift}');
}

describe('Spec songbook-view › Patterns auf Takte ziehen', () => {
  it('Groove auf einen Takt', () => {
    const [a] = seed({ kind: 'groove', name: 'A' });
    const { bars } = setup([a!], (s) => appendSegment(s, { name: 'V', bars: 4 }));
    drag(cardHandle('A'), bar(3));
    expect(bars().map((b) => b.grooveId)).toEqual([null, null, a!.id, null]);
  });

  it('Groove auf die Auswahl', async () => {
    const [a, b] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const { user, bars } = setup([a!, b!], (s) => appendSegment(s, { name: 'V', bars: 8, grooveId: a!.id }));
    await selectBars(user, 5, 8);
    drag(cardHandle('B'), bar(6));
    expect(bars().map((x) => x.grooveId)).toEqual([...Array(4).fill(a!.id), ...Array(4).fill(b!.id)]);
  });

  it('Fill auf einen Takt', () => {
    const [a, f] = seed({ kind: 'groove', name: 'A' }, { kind: 'fill', name: 'f1' });
    const { bars } = setup([a!, f!], (s) => appendSegment(s, { name: 'V', bars: 4, grooveId: a!.id }));
    drag(cardHandle('f1'), bar(4));
    expect(bars()[3]).toMatchObject({ grooveId: a!.id, fillId: f!.id });
    expect(bars().slice(0, 3).every((b) => b.fillId === null)).toBe(true);
  });

  it('Hervorhebung beim Ziehen', async () => {
    const [a, b] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const { user } = setup([a!, b!], (s) => appendSegment(s, { name: 'V', bars: 8, grooveId: a!.id }));
    await selectBars(user, 5, 8);
    dragStart(cardHandle('B'), bar(6));
    expect([4, 5, 6, 7, 8].map((n) => bar(n).classList.contains('drop-target'))).toEqual([false, true, true, true, true]);
    dragEnd(cardHandle('B'));
    expect(within(structure()).getAllByRole('button').filter((el) => el.classList.contains('drop-target'))).toEqual([]);
  });
});

describe('Spec songbook-view › Neues Pattern ziehen', () => {
  it('Neuen Groove ziehen', () => {
    const existing = seed({ kind: 'groove', name: '' });
    const { bars, currentSong } = setup(existing, (s) => appendSegment(s, { name: 'V', bars: 2 }));
    const color = nextColor(currentSong().patterns);
    drag(newButton('Groove'), bar(1));
    const groove = currentSong().patterns.find((p) => p.name === 'Groove 2')!;
    expect(groove).toMatchObject({ kind: 'groove', color });
    expect(groove.beats).toHaveLength(4);
    expect(bars().map((b) => b.grooveId)).toEqual([groove.id, null]);
    expect(structure()).toBeInTheDocument();
  });

  it('Klick auf „Neuer Groove“', async () => {
    const { user, currentSong } = setup([], (s) => appendSegment(s, { name: 'V', bars: 2 }));
    await user.click(newButton('Groove'));
    expect(currentSong().patterns).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Zurück zum Song' })).toBeInTheDocument();
  });
});

describe('Spec songbook-view › Ziehen abbrechen', () => {
  it('Loslassen neben der Struktur', () => {
    const [a] = seed({ kind: 'groove', name: 'A' });
    const { bars } = setup([a!], (s) => appendSegment(s, { name: 'V', bars: 2 }));
    drag(cardHandle('A'), patternPage());
    expect(bars().map((b) => b.grooveId)).toEqual([null, null]);
  });

  it('Escape beim Ziehen eines neuen Fills', () => {
    const { bars, currentSong } = setup([], (s) => appendSegment(s, { name: 'V', bars: 2 }));
    dragStart(newButton('Fill'), bar(2));
    fireEvent.keyDown(document, { key: 'Escape' });
    dragEnd(newButton('Fill'));
    expect(currentSong().patterns).toEqual([]);
    expect(bars()[1]!.fillId).toBeNull();
    expect(structure()).toBeInTheDocument();
  });
});
