import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PlaybackSource, PlaybackState, Player } from '../audio/player';
import { createPattern } from '../domain/pattern';
import { patternTimeline, type Step } from '../domain/playback';
import type { Pattern } from '../domain/types';
import { openRepository } from '../persistence/repository';
import { createNotebookStore } from '../state/notebookStore';
import { createV2Database } from '../test/legacyDb';
import { notebookWith } from '../test/notebook';
import { songWith } from '../test/songs';
import { App } from './App';

/** Nachgebildeter Player: zeichnet Aufrufe auf, die Position meldet der Test selbst. */
function fakePlayer(available = true) {
  let state: PlaybackState = { playing: false, mark: null };
  let position: number | null = null;
  let source: PlaybackSource | null = null;
  const listeners = new Set<() => void>();
  const set = (next: PlaybackState) => {
    state = next;
    listeners.forEach((l) => l());
  };
  const player = {
    available,
    start: vi.fn((s: PlaybackSource) => {
      source = s;
      set({ playing: true, mark: null });
    }),
    stop: vi.fn(() => set({ playing: false, mark: null })),
    getState: () => state,
    getPosition: () => position,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  } satisfies Player;
  return {
    player,
    source: () => source!,
    /** Die Wiedergabe erreicht eine Rasterposition. */
    reach: (step: Step) => act(() => set({ playing: true, mark: step })),
    /** Fortlaufende Position in Beats, wie der Scheduler sie liefert. */
    at: (beat: number | null) => (position = beat),
  };
}

function seed(): Pattern[] {
  const result: Pattern[] = [];
  for (const name of ['Verse', 'Chorus']) result.push(createPattern(result, { kind: 'groove', name }));
  return result;
}

function setup({ available = true } = {}) {
  const notebook = notebookWith(seed());
  const fake = fakePlayer(available);
  const user = userEvent.setup();
  render(<App store={notebook.store} player={fake.player} />);
  return { ...notebook, ...fake, user };
}

const playButton = () => screen.getByRole('button', { name: /^(In Schleife abspielen|Stopp)$/ });
const tempoMark = (bpm: number) => screen.getByRole('button', { name: `Song-Tempo: ${bpm} BPM` });
const tempoNote = () => document.querySelector('.tempo-field') as HTMLElement;
/** Klickt die Tempoangabe an und tippt einen Wert ins Zahlenfeld. */
async function typeTempo(user: ReturnType<typeof userEvent.setup>, from: number, keys: string) {
  await user.click(tempoMark(from));
  const field = screen.getByLabelText('Song-Tempo (BPM)');
  await user.clear(field);
  await user.type(field, keys);
}
const cell = (instrument: string, beat: number, position: number) =>
  screen.getByRole('button', { name: new RegExp(`^${instrument}, Beat ${beat}, Position ${position}`) });
const highlighted = () => Array.from(document.querySelectorAll('.step.playing')).map((el) => el.getAttribute('aria-label'));

describe('Spec pattern-playback › Wiedergabe starten und stoppen (UI)', () => {
  it('Wiedergabe starten und stoppen', async () => {
    const { user, player } = setup();
    expect(playButton()).toHaveAccessibleName('In Schleife abspielen');
    await user.click(playButton());
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(playButton()).toHaveAccessibleName('Stopp');
    await user.click(playButton());
    expect(player.stop).toHaveBeenCalled();
    expect(playButton()).toHaveAccessibleName('In Schleife abspielen');
  });

  it('Quelle liefert das geöffnete Pattern und das Tempo des Songs', async () => {
    const { user, source, patternsNow } = setup();
    await user.click(playButton());
    expect(source().timeline()).toEqual(patternTimeline(patternsNow()[0]!));
    expect(source().loop).toBe(true);
    expect(source().tempo()).toBe(120);
  });
});

describe('Spec pattern-playback › Änderungen während der Wiedergabe (UI)', () => {
  it('Schlag im Sequencer ist ohne Neustart in der Quelle', async () => {
    const { user, source, player } = setup();
    await user.click(playButton());
    await user.click(cell('Bassdrum', 1, 1));
    expect(source().timeline()!.hits.map((h) => [h.instrument, h.at])).toEqual([['kick', 0]]);
    expect(player.start).toHaveBeenCalledTimes(1);
  });
});

describe('Spec pattern-playback › Wiedergabeposition im Sequencer (UI)', () => {
  it('Position folgt der Wiedergabe', async () => {
    const { user, reach } = setup();
    await user.click(playButton());
    expect(highlighted()).toEqual([]);
    reach({ beat: 1, position: 2 });
    const marked = highlighted();
    expect(marked).toHaveLength(10);
    expect(marked.every((label) => /, Beat 2, Position 3/.test(label!))).toBe(true);
  });

  it('Keine Hervorhebung nach Stopp', async () => {
    const { user, reach } = setup();
    await user.click(playButton());
    reach({ beat: 0, position: 0 });
    await user.click(playButton());
    expect(highlighted()).toEqual([]);
  });
});

describe('Spec pattern-playback › Wiedergabe endet beim Verlassen (UI)', () => {
  it('Zurück zur Doppelseite', async () => {
    const { user, player, store } = setup();
    await user.click(playButton());
    act(() => store.backToBook());
    expect(player.stop).toHaveBeenCalled();
  });

  it('Anderes Pattern öffnen: Stopp, kein Autostart', async () => {
    const { user, player, store, patternsNow } = setup();
    await user.click(playButton());
    act(() => store.openPattern(patternsNow()[1]!.id));
    expect(player.stop).toHaveBeenCalled();
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(playButton()).toHaveAccessibleName('In Schleife abspielen');
  });
});

describe('Spec pattern-playback › Tempo im Pattern-Editor', () => {
  it('Tempo ändern gilt für alle Patterns des Songs', async () => {
    const { user, store, patternsNow, currentSong } = setup();
    expect(tempoNote()).toHaveTextContent('♩ = 120 (Song-Tempo)');
    await typeTempo(user, 120, '90{Enter}');
    expect(currentSong().tempo).toBe(90);
    expect(tempoNote()).toHaveTextContent('♩ = 90 (Song-Tempo)');
    act(() => store.openPattern(patternsNow()[1]!.id));
    expect(tempoNote()).toHaveTextContent('♩ = 90 (Song-Tempo)');
  });

  it('Kennzeichnung als Song-Tempo', () => {
    setup();
    expect(tempoNote()).toHaveTextContent('♩ = 120 (Song-Tempo)');
    expect(screen.queryByText(/gilt für alle/)).not.toBeInTheDocument();
  });

  it('Eingabe verwerfen', async () => {
    const { user, currentSong } = setup();
    const before = currentSong();
    await typeTempo(user, 120, '96{Escape}');
    expect(tempoNote()).toHaveTextContent('♩ = 120 (Song-Tempo)');
    expect(currentSong()).toBe(before);
  });

  it('Tempo während der Wiedergabe', async () => {
    const { user, player, source } = setup();
    await user.click(playButton());
    await typeTempo(user, 120, '90');
    await user.tab();
    expect(source().tempo()).toBe(90);
    expect(player.start).toHaveBeenCalledTimes(1);
  });

  it('Ungültiges Tempo', async () => {
    const { user, currentSong } = setup();
    const before = currentSong();
    await typeTempo(user, 120, '0');
    await user.tab();
    expect(tempoNote()).toHaveTextContent('♩ = 120 (Song-Tempo)');
    expect(currentSong()).toBe(before);
  });
});

describe('Spec pattern-playback › Audio nicht verfügbar (UI)', () => {
  it('Browser ohne Web Audio', async () => {
    const { user, patternsNow } = setup({ available: false });
    expect(playButton()).toBeDisabled();
    expect(within(screen.getByRole('region', { name: 'Pattern bearbeiten' })).getByRole('note')).toHaveTextContent(
      /Wiedergabe ist in diesem Browser nicht möglich/,
    );
    await user.click(cell('Snare', 1, 1));
    expect(patternsNow()[0]!.beats[0]!.hits.snare).toEqual([0]);
  });
});

describe('Spec library-persistence › Lokal gespeicherte Songs ohne Tempo (UI)', () => {
  it('Start nach dem Update: Pattern-Editor zeigt Tempo 120', async () => {
    const dbName = `beatsheet-test-${crypto.randomUUID()}`;
    const { tempo: _tempo, ...legacy } = { ...songWith({ title: 'Alt', patterns: seed() }), revision: 6 };
    await createV2Database(dbName, [legacy]);

    const store = createNotebookStore(await (await openRepository(dbName)).loadAll());
    store.openSong(legacy.id);
    store.setLocked(false);
    store.openPattern(legacy.patterns[0]!.id);
    render(<App store={store} player={fakePlayer().player} />);
    expect(tempoNote()).toHaveTextContent('♩ = 120 (Song-Tempo)');
    expect(store.getState().songs[0]!.revision).toBe(6);
  });
});
