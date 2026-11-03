import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setTempo } from '../domain/playback';
import { allBars } from '../domain/songPatterns';
import { appendSegment, deleteBar, setBarProps } from '../domain/structure';
import type { Song } from '../domain/types';
import { fakePlayer } from '../test/fakePlayer';
import { notebookWith } from '../test/notebook';
import { patternOf } from '../test/patterns';
import { App } from './App';

const kicks = () => ({ ...patternOf(Array.from({ length: 4 }, () => ({ hits: { kick: [1] } }))), name: 'Kicks' });
const snares = () => ({ ...patternOf(Array.from({ length: 4 }, () => ({ hits: { snare: [1] } }))), name: 'Snares' });

/** Song mit „Verse“ (Takte 1–2) und „Chorus“ (Takte 3–4), alle mit Groove „Kicks“, geöffnet auf der Doppelseite. */
function setup({ available = true, structure = true } = {}) {
  const groove = kicks();
  const other = snares();
  const notebook = notebookWith([groove, other], 'book');
  if (structure) {
    act(() =>
      notebook.store.updateSong((s) =>
        ['Verse', 'Chorus'].reduce((song, name) => appendSegment(song, { name, bars: 2, grooveId: groove.id }), s),
      ),
    );
  }
  const fake = fakePlayer(available);
  const user = userEvent.setup();
  render(<App store={notebook.store} player={fake.player} />);
  const bars = () => allBars(notebook.currentSong());
  return { ...notebook, ...fake, user, bars, groove, other };
}

const header = () => document.querySelector('.songbook-header') as HTMLElement;
const songButton = () => within(header()).getByRole('button', { name: /^(Song abspielen|Stopp)$/ });
const structure = () => screen.getByRole('region', { name: 'Struktur' });
const bar = (n: number) => within(structure()).getByRole('button', { name: `Takt ${n}` });
const barPopover = () => screen.getByRole('dialog', { name: 'Takt-Auswahl' });
const segmentPopover = (name: string) => screen.getByRole('dialog', { name: `Segment ${name}` });
const marksOf = (source: ReturnType<ReturnType<typeof fakePlayer>['source']>) =>
  source.timeline()!.marks.map((m) => m.mark);

async function selectBars(user: ReturnType<typeof userEvent.setup>, from: number, to = from) {
  await user.click(bar(from));
  if (to !== from) {
    await user.keyboard('{Shift>}');
    await user.click(bar(to));
    await user.keyboard('{/Shift}');
  }
}

describe('Spec song-playback › Song abspielen', () => {
  it('Ganzen Song abspielen', async () => {
    const { user, player, source, bars } = setup();
    expect(songButton()).toHaveAccessibleName('Song abspielen');
    await user.click(songButton());
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(source().loop).toBe(false);
    expect(source().timeline()!.length).toBe(16);
    expect(marksOf(source())).toEqual(bars().map((b) => b.id));
    expect(songButton()).toHaveAccessibleName('Stopp');
  });

  it('Ende des Songs', async () => {
    const { user, end, bars, reach } = setup();
    await user.click(songButton());
    reach(bars()[3]!.id, 15);
    end();
    expect(songButton()).toHaveAccessibleName('Song abspielen');
    expect(document.querySelectorAll('.bar-frame.playing')).toHaveLength(0);
  });

  it('Stoppen', async () => {
    const { user, player } = setup();
    await user.click(songButton());
    await user.click(songButton());
    expect(player.stop).toHaveBeenCalled();
    expect(songButton()).toHaveAccessibleName('Song abspielen');
  });

  it('Song ohne Takte', () => {
    setup({ structure: false });
    expect(songButton()).toBeDisabled();
  });
});

describe('Spec song-playback › Ab hier abspielen', () => {
  it('Ab einem Takt', async () => {
    const { user, source, bars } = setup();
    await selectBars(user, 3);
    await user.click(within(barPopover()).getByRole('button', { name: 'Ab hier abspielen' }));
    expect(source().loop).toBe(false);
    expect(marksOf(source())).toEqual([bars()[2]!.id, bars()[3]!.id]);
  });

  it('Ab einem Segment', async () => {
    const { user, source, bars } = setup();
    await user.click(within(structure()).getByRole('button', { name: 'Chorus' }));
    await user.click(within(segmentPopover('Chorus')).getByRole('button', { name: 'Ab hier abspielen' }));
    expect(source().loop).toBe(false);
    expect(marksOf(source())[0]).toBe(bars()[2]!.id);
    expect(marksOf(source())).toHaveLength(2);
  });
});

describe('Spec song-playback › Auswahl in Schleife abspielen', () => {
  it('Takte in Schleife', async () => {
    const { user, source, bars } = setup();
    await selectBars(user, 2, 3);
    await user.click(within(barPopover()).getByRole('button', { name: 'In Schleife abspielen' }));
    expect(source().loop).toBe(true);
    expect(source().timeline()!.length).toBe(8);
    expect(marksOf(source())).toEqual([bars()[1]!.id, bars()[2]!.id]);
    expect(songButton()).toHaveAccessibleName('Stopp');
  });

  it('Segment in Schleife', async () => {
    const { user, source, bars } = setup();
    await user.click(within(structure()).getByRole('button', { name: 'Chorus' }));
    await user.click(within(segmentPopover('Chorus')).getByRole('button', { name: 'In Schleife abspielen' }));
    expect(source().loop).toBe(true);
    expect(marksOf(source())).toEqual([bars()[2]!.id, bars()[3]!.id]);
  });
});

describe('Spec song-playback › Bereich beim Start festgehalten', () => {
  async function loopTwoThree() {
    const t = setup();
    await selectBars(t.user, 2, 3);
    await t.user.click(within(barPopover()).getByRole('button', { name: 'In Schleife abspielen' }));
    return t;
  }

  it('Auswahl ändern während der Schleife', async () => {
    const { user, source, bars, player } = await loopTwoThree();
    await user.click(bar(1));
    expect(marksOf(source())).toEqual([bars()[1]!.id, bars()[2]!.id]);
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(player.stop).not.toHaveBeenCalled();
  });

  it('Auswahl aufheben während der Schleife', async () => {
    const { user, source, bars, player } = await loopTwoThree();
    await user.keyboard('{Escape}');
    expect(marksOf(source())).toEqual([bars()[1]!.id, bars()[2]!.id]);
    expect(player.stop).not.toHaveBeenCalled();
  });

  it('Anfangstakt gelöscht', async () => {
    const { source, bars, store } = await loopTwoThree();
    const second = bars()[1]!.id;
    act(() => store.updateSong((s: Song) => deleteBar(s, second)));
    expect(source().timeline()).toBeNull();
  });
});

describe('Spec song-playback › Änderungen während der Song-Wiedergabe', () => {
  it('Groove eines späteren Takts ändern', async () => {
    const { user, source, bars, store, other, player } = setup();
    await user.click(songButton());
    const third = bars()[2]!.id;
    act(() => store.updateSong((s: Song) => setBarProps(s, [third], { grooveId: other.id })));
    const inBarThree = source().timeline()!.hits.filter((h) => h.at >= 8 && h.at < 12);
    expect(inBarThree.map((h) => h.instrument)).toEqual(['snare', 'snare', 'snare', 'snare']);
    expect(player.start).toHaveBeenCalledTimes(1);
  });

  it('Tempo während der Song-Wiedergabe', async () => {
    const { user, source, store, player } = setup();
    await user.click(songButton());
    expect(source().tempo()).toBe(120);
    act(() => store.updateSong((s: Song) => setTempo(s, 90)));
    expect(source().tempo()).toBe(90);
    expect(player.start).toHaveBeenCalledTimes(1);
  });
});

describe('Spec song-playback › Song-Wiedergabe endet beim Verlassen', () => {
  it('Pattern öffnen während der Wiedergabe', async () => {
    const { user, player, store, groove } = setup();
    await user.click(songButton());
    act(() => store.openPattern(groove.id));
    expect(player.stop).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Abspielen' })).toBeInTheDocument();
  });

  it('Zur Song-Liste', async () => {
    const { user, player, store } = setup();
    await user.click(songButton());
    act(() => store.backToList());
    expect(player.stop).toHaveBeenCalled();
  });
});

describe('Spec song-playback › Song-Wiedergabe ohne Audio', () => {
  it('Browser ohne Web Audio auf der Doppelseite', async () => {
    const { user } = setup({ available: false });
    expect(songButton()).toBeDisabled();
    expect(within(header()).getByRole('note')).toHaveTextContent(/Wiedergabe ist in diesem Browser nicht möglich/);
    await selectBars(user, 1);
    expect(within(barPopover()).getByRole('button', { name: 'Ab hier abspielen' })).toBeDisabled();
    expect(within(barPopover()).getByRole('button', { name: 'In Schleife abspielen' })).toBeDisabled();
  });
});

describe('Spec song-playback › Wiedergabeposition in der Struktur', () => {
  const scrollIntoView = vi.fn();
  const original = Element.prototype.scrollIntoView;
  beforeEach(() => {
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });
  afterEach(() => {
    Element.prototype.scrollIntoView = original;
  });

  const playing = () => [...document.querySelectorAll('.bar-frame.playing')].map((el) => el.getAttribute('aria-label'));
  const line = () => document.querySelector('.playhead-line') as HTMLElement | null;

  it('Position im Takt: Takt hervorgehoben, Linie in seiner Mitte', async () => {
    const { user, bars, reach } = setup();
    await user.click(songButton());
    reach(bars()[2]!.id, 10); // Takt 3 beginnt bei Beat 8
    expect(playing()).toEqual(['Takt 3']);
    // Takt 3 ist der erste Takt der Chorus-Zeile (x = 0), Beat 3 liegt bei x = 2
    await waitFor(() => expect(line()?.style.left).toBe('calc(var(--beat) * 2)'));
    expect(line()!.closest('.structure-row')).toContainElement(bar(3));
    expect(line()).toHaveAttribute('aria-hidden', 'true');
  });

  it('Linie bei Schleife relativ zum Bereichsanfang', async () => {
    const { user, bars, reach } = setup();
    await selectBars(user, 2, 3);
    await user.click(within(barPopover()).getByRole('button', { name: 'In Schleife abspielen' }));
    reach(bars()[1]!.id, 1); // Takt 2 ist Bereichsanfang; Takt 2 liegt in der Verse-Zeile bei x = 4
    await waitFor(() => expect(line()?.style.left).toBe('calc(var(--beat) * 5)'));
  });

  it('Mitscrollen beim Taktwechsel', async () => {
    const { user, bars, reach } = setup();
    await user.click(songButton());
    reach(bars()[0]!.id, 0);
    reach(bars()[3]!.id, 12);
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest', behavior: 'smooth' });
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(bar(4));
    const calls = scrollIntoView.mock.calls.length;
    reach(bars()[3]!.id, 13); // gleicher Takt: kein weiteres Scrollen
    expect(scrollIntoView.mock.calls.length).toBe(calls);
  });

  it('Keine Anzeige nach Stopp', async () => {
    const { user, bars, reach } = setup();
    await user.click(songButton());
    reach(bars()[2]!.id, 9);
    await user.click(songButton());
    expect(playing()).toEqual([]);
    expect(line()).toBeNull();
  });
});
