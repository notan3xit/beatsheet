import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { openDB } from 'idb';
import { describe, expect, it, vi } from 'vitest';
import type { PlaybackSource, PlaybackState, Player } from '../audio/player';
import { createPattern } from '../domain/pattern';
import type { Step } from '../domain/playback';
import type { Pattern } from '../domain/types';
import { openRepository } from '../persistence/repository';
import { createNotebookStore } from '../state/notebookStore';
import { notebookWith } from '../test/notebook';
import { songWith } from '../test/songs';
import { App } from './App';

/** Nachgebildeter Player: zeichnet Aufrufe auf, die Position meldet der Test selbst. */
function fakePlayer(available = true) {
  let state: PlaybackState = { playing: false, step: null };
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
      set({ playing: true, step: null });
    }),
    stop: vi.fn(() => set({ playing: false, step: null })),
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  } satisfies Player;
  return {
    player,
    source: () => source!,
    /** Die Wiedergabe erreicht eine Rasterposition. */
    reach: (step: Step) => act(() => set({ playing: true, step })),
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

const playButton = () => screen.getByRole('button', { name: /^(Abspielen|Stopp)$/ });
const tempoField = () => screen.getByLabelText('Tempo (BPM)') as HTMLInputElement;
const cell = (instrument: string, beat: number, position: number) =>
  screen.getByRole('button', { name: new RegExp(`^${instrument}, Beat ${beat}, Position ${position}`) });
const highlighted = () => Array.from(document.querySelectorAll('.step.playing')).map((el) => el.getAttribute('aria-label'));

describe('Spec pattern-playback › Wiedergabe starten und stoppen (UI)', () => {
  it('Wiedergabe starten und stoppen', async () => {
    const { user, player } = setup();
    expect(playButton()).toHaveAccessibleName('Abspielen');
    await user.click(playButton());
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(playButton()).toHaveAccessibleName('Stopp');
    await user.click(playButton());
    expect(player.stop).toHaveBeenCalled();
    expect(playButton()).toHaveAccessibleName('Abspielen');
  });

  it('Quelle liefert das geöffnete Pattern und das Tempo des Songs', async () => {
    const { user, source, patternsNow } = setup();
    await user.click(playButton());
    expect(source().pattern()).toBe(patternsNow()[0]);
    expect(source().tempo()).toBe(120);
  });
});

describe('Spec pattern-playback › Änderungen während der Wiedergabe (UI)', () => {
  it('Schlag im Sequencer ist ohne Neustart in der Quelle', async () => {
    const { user, source, player } = setup();
    await user.click(playButton());
    await user.click(cell('Bassdrum', 1, 1));
    expect(source().pattern().beats[0]!.hits.kick).toEqual([0]);
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
    expect(playButton()).toHaveAccessibleName('Abspielen');
  });
});

describe('Spec pattern-playback › Tempo im Pattern-Editor', () => {
  it('Tempo ändern gilt für alle Patterns des Songs', async () => {
    const { user, store, patternsNow, currentSong } = setup();
    expect(tempoField().value).toBe('120');
    await user.clear(tempoField());
    await user.type(tempoField(), '90{Enter}');
    expect(currentSong().tempo).toBe(90);
    expect(tempoField().value).toBe('90');
    act(() => store.openPattern(patternsNow()[1]!.id));
    expect(tempoField().value).toBe('90');
  });

  it('Tempo während der Wiedergabe', async () => {
    const { user, player, source } = setup();
    await user.click(playButton());
    await user.clear(tempoField());
    await user.type(tempoField(), '90');
    await user.tab();
    expect(source().tempo()).toBe(90);
    expect(player.start).toHaveBeenCalledTimes(1);
  });

  it('Ungültiges Tempo', async () => {
    const { user, currentSong } = setup();
    const before = currentSong();
    await user.clear(tempoField());
    await user.type(tempoField(), '0');
    await user.tab();
    expect(tempoField().value).toBe('120');
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
    const dbName = `drumstuff-test-${crypto.randomUUID()}`;
    (await openRepository(dbName)).close();
    const { tempo: _tempo, ...legacy } = { ...songWith({ title: 'Alt', patterns: seed() }), revision: 6 };
    const raw = await openDB(dbName, 2);
    await raw.put('songs', legacy);
    raw.close();

    const store = createNotebookStore(await (await openRepository(dbName)).loadAll());
    store.openSong(legacy.id);
    store.openPattern(legacy.patterns[0]!.id);
    render(<App store={store} player={fakePlayer().player} />);
    expect(tempoField().value).toBe('120');
    expect(store.getState().songs[0]!.revision).toBe(6);
  });
});
