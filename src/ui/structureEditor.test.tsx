import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createPattern } from '../domain/pattern';
import { allBars } from '../domain/songPatterns';
import { appendSegment } from '../domain/structure';
import type { Pattern, Song } from '../domain/types';
import { notebookWith } from '../test/notebook';
import { App } from './App';

function seed(...specs: { kind: 'groove' | 'fill'; name: string; length?: number }[]): Pattern[] {
  const result: Pattern[] = [];
  for (const spec of specs) result.push(createPattern(result, spec));
  return result;
}

function setup(patterns: Pattern[] = [], structure?: (song: Song) => Song) {
  const notebook = notebookWith(patterns, 'book');
  if (structure) act(() => notebook.store.updateSong(structure));
  const user = userEvent.setup();
  render(<App store={notebook.store} />);
  const bars = () => allBars(notebook.currentSong());
  return { ...notebook, user, bars };
}

const structure = () => screen.getByRole('region', { name: 'Struktur' });
const inspector = () => screen.getByRole('region', { name: 'Takt-Auswahl' });
const bar = (n: number) => within(structure()).getByRole('button', { name: `Takt ${n}` });
const segmentNames = (song: Song) => song.segments.map((s) => s.name);

describe('Spec song-structure › Segmente anlegen (UI)', () => {
  it('Intro anlegen mit bestehendem Groove', async () => {
    const [a] = seed({ kind: 'groove', name: 'A' });
    const { user, currentSong, bars } = setup([a!]);
    await user.type(screen.getByLabelText('Segmentname'), 'Intro');
    await user.clear(screen.getByLabelText('Takte'));
    await user.type(screen.getByLabelText('Takte'), '4');
    await user.selectOptions(screen.getByLabelText('Groove für das Segment'), 'A');
    await user.click(screen.getByRole('button', { name: 'Segment anfügen' }));
    expect(segmentNames(currentSong())).toEqual(['Intro']);
    expect(bars().map((b) => [b.beats, b.grooveId])).toEqual(Array(4).fill([4, a!.id]));
  });

  it('Neuer Groove als Platzhalter', async () => {
    const { user, currentSong, bars } = setup();
    await user.type(screen.getByLabelText('Segmentname'), 'Verse');
    await user.selectOptions(screen.getByLabelText('Groove für das Segment'), 'Neuer Groove …');
    await user.type(screen.getByLabelText('Name des neuen Grooves'), 'Verse-Beat');
    await user.click(screen.getByRole('button', { name: 'Segment anfügen' }));
    const groove = currentSong().patterns.find((p) => p.name === 'Verse-Beat')!;
    expect(groove).toMatchObject({ kind: 'groove' });
    expect(groove.beats).toHaveLength(4);
    expect(bars().every((b) => b.grooveId === groove.id)).toBe(true);
    expect(structure()).toBeInTheDocument();
  });

  it('Segment ohne Groove mit anderer Taktlänge', async () => {
    const { user, bars } = setup();
    await user.type(screen.getByLabelText('Segmentname'), 'Break');
    await user.clear(screen.getByLabelText('Takte'));
    await user.type(screen.getByLabelText('Takte'), '2');
    await user.selectOptions(screen.getByLabelText('Beats pro Takt (neues Segment)'), '3');
    await user.click(screen.getByRole('button', { name: 'Segment anfügen' }));
    expect(bars().map((b) => [b.beats, b.grooveId])).toEqual([
      [3, null],
      [3, null],
    ]);
  });
});

describe('Spec song-structure › Segmente bearbeiten (UI)', () => {
  const three = (song: Song) =>
    ['Intro', 'Verse', 'Chorus'].reduce((s, name) => appendSegment(s, { name, bars: 1 }), song);

  it('Segment duplizieren', async () => {
    const { user, currentSong } = setup([], three);
    await user.click(screen.getByRole('button', { name: 'Verse duplizieren' }));
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Verse', 'Verse (Kopie)', 'Chorus']);
  });

  it('Segment verschieben', async () => {
    const { user, currentSong } = setup([], three);
    await user.click(screen.getByRole('button', { name: 'Chorus nach oben' }));
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Chorus', 'Verse']);
    await user.click(screen.getByRole('button', { name: 'Intro nach unten' }));
    expect(segmentNames(currentSong())).toEqual(['Chorus', 'Intro', 'Verse']);
  });

  it('Segment umbenennen', async () => {
    const { user, currentSong } = setup([], three);
    await user.click(screen.getByRole('button', { name: 'Verse umbenennen' }));
    const input = screen.getByLabelText('Neuer Name für Verse');
    await user.clear(input);
    await user.type(input, 'Strophe{Enter}');
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Strophe', 'Chorus']);
  });

  it('Segment löschen mit Bestätigung', async () => {
    const { user, currentSong } = setup([], three);
    await user.click(screen.getByRole('button', { name: 'Verse löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Verse', 'Chorus']);
    await user.click(screen.getByRole('button', { name: 'Verse löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Chorus']);
  });

  it('Block anfügen', async () => {
    const { user, currentSong } = setup([], three);
    await user.click(screen.getByRole('button', { name: 'Block an Verse anfügen' }));
    expect(currentSong().segments[1]!.blocks).toHaveLength(2);
  });
});

describe('Spec song-structure › Takteigenschaften setzen (UI)', () => {
  it('Groove für Auswahl setzen', async () => {
    const [a, b] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const { user, bars } = setup([a!, b!], (s) => appendSegment(s, { name: 'Verse', bars: 8, grooveId: a!.id }));
    await user.click(bar(5));
    await user.keyboard('{Shift>}');
    await user.click(bar(8));
    await user.keyboard('{/Shift}');
    expect([5, 6, 7, 8].map((n) => bar(n).getAttribute('aria-pressed'))).toEqual(['true', 'true', 'true', 'true']);
    expect(bar(4)).toHaveAttribute('aria-pressed', 'false');
    await user.selectOptions(within(inspector()).getByLabelText('Groove'), 'B');
    expect(bars().map((x) => x.grooveId)).toEqual([...Array(4).fill(a!.id), ...Array(4).fill(b!.id)]);
  });

  it('Taktlänge ändern', async () => {
    const { user, bars } = setup([], (s) => appendSegment(s, { name: 'V', bars: 3 }));
    await user.click(bar(2));
    await user.selectOptions(within(inspector()).getByLabelText('Beats pro Takt'), '2');
    expect(bars().map((x) => x.beats)).toEqual([4, 2, 4]);
  });

  it('Fill setzen und entfernen', async () => {
    const [a, f] = seed({ kind: 'groove', name: 'A' }, { kind: 'fill', name: 'f1' });
    const { user, bars } = setup([a!, f!], (s) => appendSegment(s, { name: 'V', bars: 4, grooveId: a!.id }));
    await user.click(bar(4));
    await user.selectOptions(within(inspector()).getByLabelText('Fill am Taktende'), 'f1 (1 Beat)');
    expect(bars()[3]!.fillId).toBe(f!.id);
    await user.selectOptions(within(inspector()).getByLabelText('Fill am Taktende'), '– kein –');
    expect(bars()[3]!.fillId).toBeNull();
  });
});

describe('Spec song-structure › Platzhalter aus der Struktur anlegen (UI)', () => {
  it('Neuer Fill als Platzhalter', async () => {
    const { user, bars, currentSong } = setup([], (s) => appendSegment(s, { name: 'V', bars: 8 }));
    await user.click(bar(8));
    const panel = inspector();
    await user.selectOptions(within(panel).getByLabelText('Fill am Taktende'), 'Neuer Fill …');
    await user.type(within(panel).getByLabelText('Name des neuen Fills'), 'Tom-Run');
    await user.clear(within(panel).getByLabelText('Länge des neuen Fills (Beats)'));
    await user.type(within(panel).getByLabelText('Länge des neuen Fills (Beats)'), '2');
    await user.click(within(panel).getByRole('button', { name: 'Fill anlegen' }));
    const fill = currentSong().patterns.find((p) => p.name === 'Tom-Run')!;
    expect(fill.kind).toBe('fill');
    expect(fill.beats).toHaveLength(2);
    expect(bars()[7]!.fillId).toBe(fill.id);
    expect(structure()).toBeInTheDocument();
  });

  it('Neuer Groove als Platzhalter für die Auswahl', async () => {
    const { user, bars, currentSong } = setup([], (s) => appendSegment(s, { name: 'V', bars: 2 }));
    await user.click(bar(1));
    const panel = inspector();
    await user.selectOptions(within(panel).getByLabelText('Groove'), 'Neuer Groove …');
    await user.type(within(panel).getByLabelText('Name des neuen Grooves'), 'Shuffle');
    await user.click(within(panel).getByRole('button', { name: 'Groove anlegen' }));
    const groove = currentSong().patterns.find((p) => p.name === 'Shuffle')!;
    expect(bars().map((b) => b.grooveId)).toEqual([groove.id, null]);
  });
});

describe('Spec song-structure › Akzente (UI)', () => {
  it('Crash auf der Eins hinzufügen und entfernen', async () => {
    const { user, bars } = setup([], (s) => appendSegment(s, { name: 'V', bars: 1 }));
    await user.click(bar(1));
    const panel = inspector();
    await user.selectOptions(within(panel).getByLabelText('Akzent-Instrument'), 'Crash');
    await user.selectOptions(within(panel).getByLabelText('Akzent-Beat'), '1');
    await user.selectOptions(within(panel).getByLabelText('Akzent-Position'), '1');
    await user.click(within(panel).getByRole('button', { name: 'Akzent hinzufügen' }));
    expect(bars()[0]!.accents).toEqual([{ instrument: 'crash', beat: 0, position: 0 }]);
    expect(within(structure()).getByText('Cr')).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'Crash auf 1.1 entfernen' }));
    expect(bars()[0]!.accents).toEqual([]);
  });
});

describe('Spec song-structure › Blöcke und Takte bearbeiten (UI)', () => {
  it('Takt einfügen', async () => {
    const { user, bars } = setup([], (s) => appendSegment(s, { name: 'V', bars: 4 }));
    await user.click(bar(2));
    await user.click(within(inspector()).getByRole('button', { name: 'Takt danach einfügen' }));
    expect(bars()).toHaveLength(5);
  });

  it('Takt am Blockende anfügen', async () => {
    const { user, bars } = setup([], (s) => appendSegment(s, { name: 'V', bars: 2, beats: 3 }));
    await user.click(bar(1));
    await user.click(within(inspector()).getByRole('button', { name: 'Takt am Blockende anfügen' }));
    expect(bars().map((b) => b.beats)).toEqual([3, 3, 3]);
  });

  it('Ausgewählte Takte löschen', async () => {
    const { user, bars } = setup([], (s) => appendSegment(s, { name: 'V', bars: 4 }));
    await user.click(bar(2));
    await user.keyboard('{Shift>}');
    await user.click(bar(3));
    await user.keyboard('{/Shift}');
    await user.click(within(inspector()).getByRole('button', { name: 'Ausgewählte Takte löschen' }));
    expect(bars()).toHaveLength(2);
    expect(screen.queryByRole('region', { name: 'Takt-Auswahl' })).not.toBeInTheDocument();
  });
});
