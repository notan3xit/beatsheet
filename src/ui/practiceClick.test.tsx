import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { appendSegment, setBarProps } from '../domain/structure';
import { allBars } from '../domain/songPatterns';
import type { Pattern } from '../domain/types';
import { createPracticeStore } from '../state/practice';
import { fakePlayer } from '../test/fakePlayer';
import { notebookWith } from '../test/notebook';
import { patternOf } from '../test/patterns';
import { App } from './App';

const groove = (): Pattern => ({ ...patternOf(Array.from({ length: 4 }, () => ({ hits: { kick: [1] } }))), name: 'Verse' });
const fill = (): Pattern => ({ ...patternOf([{ hits: { snare: [1] } }, {}], 'fill'), name: 'Break' });

/** Song mit Groove „Verse“, Fill „Break“ (2 Beats) und Segment „Chorus“ (2 Takte), entsperrt auf der Doppelseite. */
function setup(open: 'book' | 'pattern' = 'book') {
  const verse = groove();
  const notebook = notebookWith([verse, fill()], open);
  act(() => notebook.store.updateSong((s) => appendSegment(s, { name: 'Chorus', bars: 2, grooveId: verse.id })));
  const fake = fakePlayer();
  const practice = createPracticeStore(null);
  const user = userEvent.setup();
  render(<App store={notebook.store} player={fake.player} practice={practice} />);
  return { ...notebook, ...fake, user, verse, practice };
}

const metronome = () => screen.getByRole('button', { name: 'Metronom' });
const countIn = () => screen.getByRole('button', { name: 'Einzählen' });
const practiceToggle = () => screen.getByRole('button', { name: 'Tempo' });
const header = () => document.querySelector('.songbook-header') as HTMLElement;
const songButton = () => within(header()).getByRole('button', { name: /^(Song abspielen|Stopp)$/ });
const structure = () => screen.getByRole('region', { name: 'Struktur' });

describe('Spec practice-click › Knöpfe Metronom und Einzählen', () => {
  it('Doppelseite', () => {
    setup();
    for (const button of [metronome(), countIn()]) {
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button).toHaveAttribute('title', button.getAttribute('aria-label'));
      expect(button).toHaveTextContent('');
    }
    const box = practiceToggle().closest('.practice')!;
    const order = [...box.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') ?? b.textContent);
    expect(order.slice(-2)).toEqual(['Metronom', 'Einzählen']);
  });

  it('Gleicher Stand im Pattern-Editor', async () => {
    const { user, store, verse } = setup();
    await user.click(metronome());
    act(() => store.openPattern(verse.id));
    expect(metronome()).toHaveAttribute('aria-pressed', 'true');
    expect(countIn()).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('Spec practice-click › Unabhängige Schalter', () => {
  it('Metronom ohne Tempo', async () => {
    const { user } = setup();
    await user.click(metronome());
    expect(metronome()).toHaveAttribute('aria-pressed', 'true');
    expect(practiceToggle()).toHaveAttribute('aria-pressed', 'false');
    expect(countIn()).toHaveAttribute('aria-pressed', 'false');
  });

  it('Tempo ausschalten', async () => {
    const { user } = setup();
    await user.click(practiceToggle());
    await user.click(metronome());
    await user.click(countIn());
    await user.click(practiceToggle());
    expect(metronome()).toHaveAttribute('aria-pressed', 'true');
    expect(countIn()).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Spec practice-click › Schalter gelten bis zum Neuladen', () => {
  it('Anderer Song', async () => {
    const { user, store } = setup();
    await user.click(metronome());
    act(() => {
      const other = store.createSong('Andere');
      store.openSong(other.id);
    });
    expect(metronome()).toHaveAttribute('aria-pressed', 'false');
  });

  it('Zurück zum Song', async () => {
    const { user, store, song } = setup();
    await user.click(countIn());
    act(() => store.backToList());
    act(() => store.openSong(song.id));
    expect(countIn()).toHaveAttribute('aria-pressed', 'true');
  });

  it('Kein Teil des Songs', async () => {
    const { user, currentSong } = setup();
    const before = currentSong();
    await user.click(metronome());
    await user.click(countIn());
    expect(currentSong()).toBe(before);
  });
});

describe('Spec practice-click › Metronom und Einzählen im gesperrten Song', () => {
  it('Gesperrter Song', async () => {
    const { user, store } = setup();
    act(() => store.setLocked(true));
    await user.click(metronome());
    await user.click(countIn());
    expect(metronome()).toHaveAttribute('aria-pressed', 'true');
    expect(countIn()).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Spec practice-click › Einzählen vor dem Start', () => {
  it('Song in 4/4', async () => {
    const { user, source } = setup();
    await user.click(countIn());
    await user.click(songButton());
    expect(source().countIn).toBe(4);
  });

  it('Ab einem Takt in 3/4', async () => {
    const { user, source, store, currentSong } = setup();
    act(() => store.updateSong((s) => setBarProps(s, [allBars(currentSong())[1]!.id], { beats: 3 })));
    await user.click(countIn());
    await user.click(within(structure()).getByRole('button', { name: 'Takt 2' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Takt-Auswahl' })).getByRole('button', { name: 'Ab hier abspielen' }));
    expect(source().countIn).toBe(3);
  });

  it('Kurzer Fill', async () => {
    const { user, source, store, patternsNow } = setup();
    await user.click(countIn());
    act(() => store.openPattern(patternsNow()[1]!.id));
    await user.click(screen.getByRole('button', { name: 'Einmal abspielen' }));
    expect(source().countIn).toBe(4);
  });

  it('Ohne Einzählen', async () => {
    const { user, source } = setup();
    await user.click(songButton());
    expect(source().countIn).toBe(0);
  });
});

describe('Spec practice-click › Einzählen nur beim Start', () => {
  it('Einschalten während der Wiedergabe', async () => {
    const { user, source, player } = setup();
    await user.click(songButton());
    await user.click(countIn());
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(source().countIn).toBe(0);
    await user.click(songButton());
    await user.click(songButton());
    expect(source().countIn).toBe(4);
  });
});

describe('Spec practice-click › Metronom während der Wiedergabe schalten', () => {
  it('Einschalten während der Wiedergabe', async () => {
    const { user, source, player } = setup('pattern');
    await user.click(screen.getByRole('button', { name: 'In Schleife abspielen' }));
    expect(source().metronome!()).toBe(false);
    await user.click(metronome());
    expect(source().metronome!()).toBe(true);
    expect(player.start).toHaveBeenCalledTimes(1);
  });
});

describe('Spec practice-click › Anzeige während des Einzählens', () => {
  it('Während des Einzählens', async () => {
    const { user } = setup();
    await user.click(countIn());
    await user.click(songButton());
    expect(songButton()).toHaveAccessibleName('Stopp');
    expect(document.querySelectorAll('.bar-frame.playing')).toHaveLength(0);
  });

  it('Stopp beim Einzählen', async () => {
    const { user, player } = setup();
    await user.click(countIn());
    await user.click(songButton());
    await user.click(songButton());
    expect(player.stop).toHaveBeenCalled();
  });
});

describe('Spec practice-click › Tempo von Metronom und Einzählen', () => {
  it('Im Übetempo', async () => {
    const { user, source } = setup();
    await user.click(practiceToggle());
    await user.click(metronome());
    await user.click(songButton());
    expect(source().metronome!()).toBe(true);
    expect(source().tempo()).toBe(90);
  });

  it('Im Song-Tempo', async () => {
    const { user, source } = setup();
    await user.click(metronome());
    await user.click(songButton());
    expect(source().metronome!()).toBe(true);
    expect(source().tempo()).toBe(120);
  });
});
