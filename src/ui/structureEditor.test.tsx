import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

function setup(patterns: Pattern[] = [], structure?: (song: Song) => Song) {
  const notebook = notebookWith(patterns, 'book');
  if (structure) act(() => notebook.store.updateSong(structure));
  const user = userEvent.setup();
  render(<App store={notebook.store} />);
  const bars = () => allBars(notebook.currentSong());
  return { ...notebook, user, bars };
}

const structure = () => screen.getByRole('region', { name: 'Struktur' });
const bar = (n: number) => within(structure()).getByRole('button', { name: `Takt ${n}` });
const segmentNames = (song: Song) => song.segments.map((s) => s.name);

const popover = (name: string) => screen.getByRole('dialog', { name });
const barPopover = () => popover('Takt-Auswahl');
const segmentButton = (name: string) => within(structure()).getByRole('button', { name });

async function selectBars(user: ReturnType<typeof userEvent.setup>, from: number, to = from) {
  await user.click(bar(from));
  if (to !== from) {
    await user.keyboard('{Shift>}');
    await user.click(bar(to));
    await user.keyboard('{/Shift}');
  }
}

const twoSegments = (song: Song) =>
  ['Intro', 'Verse'].reduce((s, name) => appendSegment(s, { name, bars: 2 }), song);

describe('Spec songbook-view › Bearbeiten über die Auswahl', () => {
  it('Takte auswählen', async () => {
    const { user } = setup([], (s) => appendSegment(s, { name: 'Verse', bars: 8 }));
    await selectBars(user, 5, 8);
    expect([4, 5, 6, 7, 8].map((n) => bar(n).getAttribute('aria-pressed'))).toEqual(['false', 'true', 'true', 'true', 'true']);
    expect(barPopover()).toHaveTextContent('Takte 5–8');
  });

  it('Segment auswählen', async () => {
    const { user } = setup([], twoSegments);
    await user.click(bar(2));
    await user.click(segmentButton('Verse'));
    expect(bar(2)).toHaveAttribute('aria-pressed', 'false');
    expect(segmentButton('Verse')).toHaveAttribute('aria-pressed', 'true');
    expect(popover('Segment Verse')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Takt-Auswahl' })).not.toBeInTheDocument();
  });

  it('Auswahl aufheben', async () => {
    const { user } = setup([], twoSegments);
    await selectBars(user, 1, 2);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(bar(1)).toHaveAttribute('aria-pressed', 'false');

    await user.click(segmentButton('Intro'));
    await user.click(screen.getByRole('region', { name: 'Patterns' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(segmentButton('Intro')).toHaveAttribute('aria-pressed', 'false');
  });

  describe('Popover am rechten Rand', () => {
    // jsdom hat kein Layout: Strukturseite von 0 bis 400 px, Popover an seiner Stelle ohne Verschiebung bei natural
    const rect = (left: number, width: number) =>
      ({ left, right: left + width, width, top: 0, bottom: 0, height: 0, x: left, y: 0, toJSON: () => ({}) }) as DOMRect;
    const shiftOf = (el: HTMLElement) => Number(el.style.transform.match(/translateX\((-?[\d.]+)px\)/)?.[1] ?? 0);

    async function openWith(natural: { left: number; width: number }) {
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        if (this.classList.contains('structure-page')) return rect(0, 400);
        if (this.classList.contains('structure-popover')) return rect(natural.left + shiftOf(this as HTMLElement), natural.width);
        return rect(0, 0);
      });
      const { user } = setup([], (s) => appendSegment(s, { name: 'Verse', bars: 4 }));
      await selectBars(user, 4);
      return barPopover();
    }

    afterEach(() => vi.restoreAllMocks());

    it('Überstand: das Popover rückt um den Überstand nach links', async () => {
      const panel = await openWith({ left: 300, width: 200 });
      expect(shiftOf(panel)).toBe(-100);
    });

    it('Breiter als der Platz links davon: höchstens bis an den linken Rand der Seite', async () => {
      const panel = await openWith({ left: 50, width: 500 });
      expect(shiftOf(panel)).toBe(-50);
    });

    it('Kein Überstand: das Popover bleibt an der Auswahl', async () => {
      const panel = await openWith({ left: 100, width: 200 });
      expect(shiftOf(panel)).toBe(0);
    });
  });
});

describe('Spec songbook-view › Segment-Popover', () => {
  it('Segment umbenennen', async () => {
    const { user, currentSong } = setup([], twoSegments);
    await user.click(segmentButton('Verse'));
    const input = within(popover('Segment Verse')).getByLabelText('Segmentname');
    await user.clear(input);
    await user.type(input, 'Strophe{Enter}');
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Strophe']);
  });

  it('Erstes Segment nicht nach oben', async () => {
    const { user } = setup([], twoSegments);
    await user.click(segmentButton('Intro'));
    expect(within(popover('Segment Intro')).getByRole('button', { name: 'Nach oben' })).toBeDisabled();
    expect(within(popover('Segment Intro')).getByRole('button', { name: 'Nach unten' })).toBeEnabled();
    await user.click(segmentButton('Verse'));
    expect(within(popover('Segment Verse')).getByRole('button', { name: 'Nach unten' })).toBeDisabled();
  });
});

describe('Spec songbook-view › Pattern-Chips', () => {
  it('Groove-Chips', async () => {
    const patterns = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const { user } = setup(patterns, (s) => appendSegment(s, { name: 'V', bars: 2, grooveId: patterns[0]!.id }));
    await selectBars(user, 1, 2);
    const chips = within(within(barPopover()).getByRole('group', { name: 'Groove' }));
    expect(chips.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Kein Groove', 'Neuer Groove', 'A', 'B']);
    expect(chips.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true');
    expect(chips.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'false');
    expect(chips.getByRole('button', { name: 'Neuer Groove' }).style.getPropertyValue('--pc')).toBe(`var(--ctp-${nextColor(patterns)})`);
  });

  it('Chips in Reihenfolge des Songs', async () => {
    const [a, b] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const { user } = setup([a!, b!], (s) => {
      const withBars = appendSegment(s, { name: 'V', bars: 2, grooveId: a!.id });
      return setBarProps(withBars, [allBars(withBars)[0]!.id], { grooveId: b!.id });
    });
    await selectBars(user, 1);
    const chips = within(within(barPopover()).getByRole('group', { name: 'Groove' }));
    expect(chips.getAllByRole('button').map((x) => x.getAttribute('aria-label'))).toEqual(['Kein Groove', 'Neuer Groove', 'B', 'A']);
  });

  it('Gemischte Auswahl', async () => {
    const [a, b] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const { user } = setup([a!, b!], (s) => {
      const song = appendSegment(s, { name: 'V', bars: 2, grooveId: a!.id });
      return setBarProps(song, [song.segments[0]!.blocks[0]!.bars[1]!.id], { grooveId: b!.id });
    });
    await selectBars(user, 1, 2);
    const chips = within(within(barPopover()).getByRole('group', { name: 'Groove' })).getAllByRole('button');
    expect(chips.filter((c) => c.getAttribute('aria-pressed') === 'true')).toEqual([]);
  });
});

describe('Spec songbook-view › Takt-Popover', () => {
  it('Akzente nur bei einem Takt', async () => {
    const { user } = setup([], (s) => appendSegment(s, { name: 'V', bars: 2 }));
    await selectBars(user, 1, 2);
    const panel = within(barPopover());
    for (const name of ['Taktlänge verringern', 'Taktlänge erhöhen', 'Takt davor', 'Takt danach', 'Löschen']) {
      expect(panel.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(panel.getByRole('group', { name: 'Fill' })).toBeInTheDocument();
    expect(panel.queryByRole('group', { name: 'Akzente' })).not.toBeInTheDocument();
    await user.click(bar(1));
    expect(within(barPopover()).getByRole('group', { name: 'Akzente' })).toBeInTheDocument();
  });

  it('Taktlänge an den Grenzen', async () => {
    const { user } = setup([], (s) => appendSegment(s, { name: 'V', bars: 1, beats: 1 }));
    await selectBars(user, 1);
    expect(within(barPopover()).getByRole('button', { name: 'Taktlänge verringern' })).toBeDisabled();
    expect(within(barPopover()).getByRole('button', { name: 'Taktlänge erhöhen' })).toBeEnabled();
  });
});

describe('Spec song-structure › Segmente einfügen (UI)', () => {
  it('Erstes Segment', async () => {
    const { user, currentSong, bars } = setup();
    await user.click(within(structure()).getByRole('button', { name: 'Erstes Segment anlegen' }));
    expect(segmentNames(currentSong())).toEqual(['Segment 1']);
    expect(bars().map((b) => [b.beats, b.grooveId])).toEqual(Array(4).fill([4, null]));
    expect(segmentButton('Segment 1')).toHaveAttribute('aria-pressed', 'true');
    expect(popover('Segment Segment 1')).toBeInTheDocument();
  });

  it('Segment dazwischen einfügen', async () => {
    const { user, currentSong } = setup([], (s) => ['Intro', 'Chorus'].reduce((x, name) => appendSegment(x, { name, bars: 1 }), s));
    await user.click(segmentButton('Intro'));
    await user.click(within(popover('Segment Intro')).getByRole('button', { name: 'Segment danach' }));
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Segment 3', 'Chorus']);
    expect(popover('Segment Segment 3')).toBeInTheDocument();
  });
});

describe('Spec song-structure › Segmente bearbeiten (UI)', () => {
  const three = (song: Song) =>
    ['Intro', 'Verse', 'Chorus'].reduce((s, name) => appendSegment(s, { name, bars: 1 }), song);

  it('Segment duplizieren', async () => {
    const { user, currentSong } = setup([], three);
    await user.click(segmentButton('Verse'));
    await user.click(within(popover('Segment Verse')).getByRole('button', { name: 'Duplizieren' }));
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Verse', 'Verse (Kopie)', 'Chorus']);
  });

  it('Segment verschieben', async () => {
    const { user, currentSong } = setup([], three);
    await user.click(segmentButton('Chorus'));
    await user.click(within(popover('Segment Chorus')).getByRole('button', { name: 'Nach oben' }));
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Chorus', 'Verse']);
    await user.click(segmentButton('Intro'));
    await user.click(within(popover('Segment Intro')).getByRole('button', { name: 'Nach unten' }));
    expect(segmentNames(currentSong())).toEqual(['Chorus', 'Intro', 'Verse']);
  });

  it('Segment löschen mit Bestätigung', async () => {
    const { user, currentSong } = setup([], three);
    await user.click(segmentButton('Verse'));
    await user.click(within(popover('Segment Verse')).getByRole('button', { name: 'Löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Verse', 'Chorus']);
    await user.click(within(popover('Segment Verse')).getByRole('button', { name: 'Löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(segmentNames(currentSong())).toEqual(['Intro', 'Chorus']);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Spec song-structure › Blöcke und Takte bearbeiten (UI)', () => {
  it('Block unten anfügen', async () => {
    const [a] = seed({ kind: 'groove', name: 'A' });
    const { user, currentSong } = setup([a!], (s) => appendSegment(s, { name: 'Verse', bars: 2, grooveId: a!.id }));
    await user.click(segmentButton('Verse'));
    await user.click(within(popover('Segment Verse')).getByRole('button', { name: 'Block anfügen' }));
    const blocks = currentSong().segments[0]!.blocks;
    expect(blocks).toHaveLength(2);
    expect(blocks[1]!.bars.map((b) => [b.beats, b.grooveId])).toEqual(Array(2).fill([4, a!.id]));
  });

  it('Takt einfügen', async () => {
    const { user, bars } = setup([], (s) => appendSegment(s, { name: 'V', bars: 4 }));
    await user.click(bar(2));
    await user.click(within(barPopover()).getByRole('button', { name: 'Takt danach' }));
    expect(bars()).toHaveLength(5);
  });

  it('Takt davor einfügen', async () => {
    const [a] = seed({ kind: 'groove', name: 'A' });
    const { user, bars } = setup([a!], (s) => appendSegment(s, { name: 'V', bars: 2, beats: 3, grooveId: a!.id }));
    const first = bars()[0]!.id;
    await user.click(bar(1));
    await user.click(within(barPopover()).getByRole('button', { name: 'Takt davor' }));
    expect(bars().map((b) => [b.beats, b.grooveId])).toEqual(Array(3).fill([3, a!.id]));
    expect(bars()[1]!.id).toBe(first);
  });

  it('Letzten Takt eines Blocks löschen', async () => {
    const { user, currentSong } = setup([], (s) => appendSegment(s, { name: 'V', bars: 1 }));
    await user.click(segmentButton('V'));
    await user.click(within(popover('Segment V')).getByRole('button', { name: 'Block anfügen' }));
    expect(currentSong().segments[0]!.blocks).toHaveLength(2);
    await user.click(bar(2));
    await user.click(within(barPopover()).getByRole('button', { name: 'Löschen' }));
    expect(currentSong().segments[0]!.blocks).toHaveLength(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Ausgewählte Takte löschen', async () => {
    const { user, bars } = setup([], (s) => appendSegment(s, { name: 'V', bars: 4 }));
    await selectBars(user, 2, 3);
    await user.click(within(barPopover()).getByRole('button', { name: 'Löschen' }));
    expect(bars()).toHaveLength(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Spec song-structure › Takteigenschaften setzen (UI)', () => {
  const chip = (group: string, name: string) =>
    within(within(barPopover()).getByRole('group', { name: group })).getByRole('button', { name });

  it('Groove für Auswahl setzen', async () => {
    const [a, b] = seed({ kind: 'groove', name: 'A' }, { kind: 'groove', name: 'B' });
    const { user, bars } = setup([a!, b!], (s) => appendSegment(s, { name: 'Verse', bars: 8, grooveId: a!.id }));
    await selectBars(user, 5, 8);
    await user.click(chip('Groove', 'B'));
    expect(bars().map((x) => x.grooveId)).toEqual([...Array(4).fill(a!.id), ...Array(4).fill(b!.id)]);
    expect(chip('Groove', 'B')).toHaveAttribute('aria-pressed', 'true');
  });

  it('Taktlänge ändern', async () => {
    const { user, bars } = setup([], (s) => appendSegment(s, { name: 'V', bars: 3 }));
    await user.click(bar(2));
    await user.click(within(barPopover()).getByRole('button', { name: 'Taktlänge verringern' }));
    await user.click(within(barPopover()).getByRole('button', { name: 'Taktlänge verringern' }));
    expect(bars().map((x) => x.beats)).toEqual([4, 2, 4]);
    expect(within(barPopover()).getByLabelText('Taktlänge')).toHaveTextContent('2/4');
  });

  it('Länge gemischter Auswahl erhöhen', async () => {
    const { user, bars } = setup([], (s) => {
      const song = appendSegment(s, { name: 'V', bars: 2 });
      return setBarProps(song, [song.segments[0]!.blocks[0]!.bars[1]!.id], { beats: 3 });
    });
    await selectBars(user, 1, 2);
    expect(within(barPopover()).getByLabelText('Taktlänge')).toHaveTextContent('gemischt');
    await user.click(within(barPopover()).getByRole('button', { name: 'Taktlänge erhöhen' }));
    expect(bars().map((x) => x.beats)).toEqual([5, 4]);
  });

  it('Fill setzen und entfernen', async () => {
    const [a, f] = seed({ kind: 'groove', name: 'A' }, { kind: 'fill', name: 'f1' });
    const { user, bars } = setup([a!, f!], (s) => appendSegment(s, { name: 'V', bars: 4, grooveId: a!.id }));
    await user.click(bar(4));
    await user.click(chip('Fill', 'f1'));
    expect(bars()[3]!.fillId).toBe(f!.id);
    await user.click(chip('Fill', 'Kein Fill'));
    expect(bars()[3]!.fillId).toBeNull();
  });
});

describe('Spec song-structure › Platzhalter aus der Struktur anlegen (UI)', () => {
  it('Neuer Groove als Platzhalter', async () => {
    const { user, bars, currentSong } = setup(seed({ kind: 'groove', name: '' }), (s) => appendSegment(s, { name: 'V', bars: 8 }));
    await selectBars(user, 1, 4);
    await user.click(within(barPopover()).getByRole('button', { name: 'Neuer Groove' }));
    const groove = currentSong().patterns.find((p) => p.name === 'Groove 2')!;
    expect(groove.beats).toHaveLength(4);
    expect(bars().map((b) => b.grooveId)).toEqual([...Array(4).fill(groove.id), ...Array(4).fill(null)]);
    expect(structure()).toBeInTheDocument();
  });

  it('Neuer Fill als Platzhalter', async () => {
    const { user, bars, currentSong } = setup([], (s) => appendSegment(s, { name: 'V', bars: 8 }));
    await user.click(bar(8));
    await user.click(within(barPopover()).getByRole('button', { name: 'Neuer Fill' }));
    const fill = currentSong().patterns.find((p) => p.name === 'Fill 1')!;
    expect(fill).toMatchObject({ kind: 'fill' });
    expect(fill.beats).toHaveLength(1);
    expect(bars()[7]!.fillId).toBe(fill.id);
  });
});

describe('Spec song-structure › Akzente (UI)', () => {
  it('Crash auf der Eins hinzufügen und entfernen', async () => {
    const { user, bars } = setup([], (s) => appendSegment(s, { name: 'V', bars: 1 }));
    await user.click(bar(1));
    const panel = within(barPopover());
    await user.selectOptions(panel.getByLabelText('Akzent-Instrument'), 'Crash');
    await user.selectOptions(panel.getByLabelText('Akzent-Beat'), '1');
    await user.selectOptions(panel.getByLabelText('Akzent-Position'), '1');
    await user.click(panel.getByRole('button', { name: 'Akzent hinzufügen' }));
    expect(bars()[0]!.accents).toEqual([{ instrument: 'crash', beat: 0, position: 0 }]);
    expect(within(structure()).getByText('Cr')).toBeInTheDocument();
    await user.click(within(barPopover()).getByRole('button', { name: 'Crash auf 1.1 entfernen' }));
    expect(bars()[0]!.accents).toEqual([]);
  });
});

describe('Spec songbook-view › Abspielen in den Popovers', () => {
  it('Abspielen im Segment-Popover', async () => {
    const { user } = setup([], twoSegments);
    await user.click(segmentButton('Verse'));
    const panel = within(popover('Segment Verse'));
    expect(panel.getByRole('button', { name: 'Ab hier abspielen' })).toBeInTheDocument();
    expect(panel.getByRole('button', { name: 'In Schleife abspielen' })).toBeInTheDocument();
  });

  it('Abspielen im Takt-Popover, auch bei mehreren Takten', async () => {
    const { user } = setup([], twoSegments);
    await selectBars(user, 1, 2);
    const panel = within(barPopover());
    expect(panel.getByRole('button', { name: 'Ab hier abspielen' })).toBeInTheDocument();
    expect(panel.getByRole('button', { name: 'In Schleife abspielen' })).toBeInTheDocument();
  });
});

