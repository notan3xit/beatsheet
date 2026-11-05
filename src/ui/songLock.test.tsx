import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { allBars } from '../domain/songPatterns';
import { appendSegment } from '../domain/structure';
import type { Pattern, Song } from '../domain/types';
import { createNotebookStore, type NotebookStore } from '../state/notebookStore';
import { fakePlayer } from '../test/fakePlayer';
import { patternOf } from '../test/patterns';
import { songWith } from '../test/songs';
import { App } from './App';
import { useLockGuard } from './lock';
import { StoreContext } from './useLibrary';
import { connectUrl } from './urlSync';

const verse = (): Pattern => ({
  ...patternOf(Array.from({ length: 4 }, () => ({ hits: { kick: [1], snare: [3] } }))),
  name: 'Verse',
});

/** „Hysteria“ mit den Segmenten Intro (Takte 1–4) und Verse (Takte 5–8), alle mit dem Groove „Verse“. */
function hysteria(pattern = verse()): Song {
  const song = songWith({ title: 'Hysteria', patterns: [pattern] });
  return ['Intro', 'Verse'].reduce((s, name) => appendSegment(s, { name, bars: 4, grooveId: pattern.id }), song);
}

let hitTarget: Element | null = null;
let disconnect: (() => void) | undefined;
afterEach(() => {
  disconnect?.();
  disconnect = undefined;
  window.history.replaceState(null, '', '#/');
});

function renderApp(store: NotebookStore) {
  hitTarget = null;
  const fake = fakePlayer();
  const user = userEvent.setup();
  render(<App store={store} player={fake.player} hitTest={() => hitTarget} />);
  const current = () => store.getState().songs[0]!;
  return { ...fake, store, user, current, bars: () => allBars(current()) };
}

/** Song geöffnet auf der Doppelseite, gesperrt wie nach dem Öffnen. */
function setup(song = hysteria()) {
  const store = createNotebookStore([song]);
  store.openSong(song.id);
  return renderApp(store);
}

const unlockButton = () => screen.getByRole('button', { name: 'Song entsperren' });
const lockButton = () => screen.getByRole('button', { name: 'Song sperren' });
const isLocked = () => screen.queryByRole('button', { name: 'Song entsperren' }) !== null;
const button = (name: string) => screen.queryByRole('button', { name });
const structure = () => screen.getByRole('region', { name: 'Struktur' });
const songList = () => screen.getByRole('region', { name: 'Meine Songs' });
const bar = (n: number) => within(structure()).getByRole('button', { name: `Takt ${n}` });
const title = () => screen.getByRole('heading', { level: 2 });
const inputs = () => document.querySelectorAll('main input, main select, main textarea');
const unsafeButtons = () => [...document.querySelectorAll('main button:not(:disabled):not([data-read-safe])')];

describe('Spec song-lock › Schloss', () => {
  it('Entsperren', async () => {
    const { user } = setup();
    await user.click(unlockButton());
    expect(lockButton()).toBeInTheDocument();
    expect(button('Song löschen')).toBeInTheDocument();
    expect(button('Neuer Groove')).toBeInTheDocument();
    expect(button('Song-Tempo: 120 BPM')).toBeInTheDocument();
  });

  it('Wieder sperren', async () => {
    const { user } = setup();
    await user.click(unlockButton());
    await user.click(lockButton());
    expect(unlockButton()).toBeInTheDocument();
    expect(button('Song löschen')).not.toBeInTheDocument();
    expect(button('Neuer Groove')).not.toBeInTheDocument();
    expect(button('Song-Tempo: 120 BPM')).not.toBeInTheDocument();
  });

  it('Offene Eingabe beim Sperren', async () => {
    const { user, current } = setup();
    await user.click(unlockButton());
    await user.click(title());
    const field = screen.getByRole('textbox', { name: 'Songtitel' });
    await user.clear(field);
    await user.type(field, 'Uprising');
    await user.click(lockButton());
    expect(current().title).toBe('Uprising');
    expect(isLocked()).toBe(true);
  });
});

describe('Spec song-lock › Gesperrt beim Öffnen', () => {
  it('Öffnen aus der Song-Liste', async () => {
    const { user } = renderApp(createNotebookStore([hysteria()]));
    await user.click(within(songList()).getByText('Hysteria'));
    expect(isLocked()).toBe(true);
  });

  it('Erneutes Öffnen', async () => {
    const { user } = setup();
    await user.click(unlockButton());
    await user.click(screen.getByRole('button', { name: 'Songs' }));
    await user.click(within(songList()).getByText('Hysteria'));
    expect(isLocked()).toBe(true);
  });

  it('Neuladen', () => {
    const song = hysteria();
    window.history.replaceState(null, '', `#/songs/${song.id}`);
    const before = createNotebookStore([song]);
    const disconnectBefore = connectUrl(before, window);
    before.setLocked(false);
    disconnectBefore();
    const after = createNotebookStore([song]);
    disconnect = connectUrl(after, window);
    expect(after.getState().openSongId).toBe(song.id);
    expect(after.getState().locked).toBe(true);
  });
});

describe('Spec song-lock › Leerer Song öffnet entsperrt', () => {
  async function createAndOpen() {
    const app = renderApp(createNotebookStore());
    await app.user.click(screen.getByRole('button', { name: 'Song anlegen' }));
    await app.user.click(within(songList()).getByText('Neuer Song'));
    return app;
  }

  it('Neu angelegter Song', async () => {
    await createAndOpen();
    expect(lockButton()).toBeInTheDocument();
    expect(button('Erstes Segment anlegen')).toBeInTheDocument();
  });

  it('Song mit Inhalt', async () => {
    const { user } = await createAndOpen();
    await user.click(screen.getByRole('button', { name: 'Erstes Segment anlegen' }));
    await user.click(screen.getByRole('button', { name: 'Songs' }));
    await user.click(within(songList()).getByText('Neuer Song'));
    expect(isLocked()).toBe(true);
  });

  it('Song nur mit Patterns', () => {
    setup(songWith({ title: 'Skizze', patterns: [verse()] }));
    expect(isLocked()).toBe(true);
  });
});

describe('Spec song-lock › Sperre nur lokal', () => {
  it('Song bleibt unverändert', async () => {
    const { user, current } = setup();
    const before = current();
    await user.click(unlockButton());
    await user.click(lockButton());
    expect(current()).toBe(before);
  });

  it('Adresse bleibt unverändert', async () => {
    const song = hysteria();
    window.history.replaceState(null, '', `#/songs/${song.id}`);
    const store = createNotebookStore([song]);
    disconnect = connectUrl(store, window);
    const { user } = renderApp(store);
    const [hash, entries] = [window.location.hash, window.history.length];
    await user.click(unlockButton());
    expect(window.location.hash).toBe(hash);
    expect(window.history.length).toBe(entries);
  });
});

describe('Spec song-lock › Keine Änderung im gesperrten Zustand', () => {
  it('Keine Eingabefelder auf der Doppelseite', () => {
    setup();
    expect(inputs()).toHaveLength(0);
  });
});

describe('Spec song-lock › Knöpfe nur mit Freigabe', () => {
  function Probe({ onClick }: { onClick: () => void }) {
    return (
      <main {...useLockGuard()}>
        <button type="button" onClick={onClick}>
          Ohne Freigabe
        </button>
        <button type="button" data-read-safe="" onClick={onClick}>
          Freigegeben
        </button>
      </main>
    );
  }

  function probe(locked: boolean) {
    const store = createNotebookStore([hysteria()]);
    store.setLocked(locked);
    const onClick = vi.fn();
    render(
      <StoreContext.Provider value={store}>
        <Probe onClick={onClick} />
      </StoreContext.Provider>,
    );
    return { onClick, user: userEvent.setup() };
  }

  it('Knopf ohne Freigabe per Maus', async () => {
    const { user, onClick } = probe(true);
    await user.click(screen.getByRole('button', { name: 'Ohne Freigabe' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('Knopf ohne Freigabe per Tastatur', async () => {
    const { user, onClick } = probe(true);
    screen.getByRole('button', { name: 'Ohne Freigabe' }).focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('Knopf ohne Freigabe im entsperrten Song', async () => {
    const { user, onClick } = probe(false);
    await user.click(screen.getByRole('button', { name: 'Ohne Freigabe' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Freigegebener Knopf im Riegel', async () => {
    const { user, onClick } = probe(true);
    await user.click(screen.getByRole('button', { name: 'Freigegeben' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Freigegebener Knopf', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Songs' }));
    expect(songList()).toBeInTheDocument();
  });

  it('Alle aktiven Knöpfe auf der Doppelseite freigegeben', () => {
    setup();
    expect(unsafeButtons()).toEqual([]);
  });

  it('Der Riegel lässt das entsperrte Bearbeiten durch', async () => {
    const { user, bars } = setup();
    await user.click(unlockButton());
    await user.hover(bar(1).closest('.structure-row') as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Takt vor Takt 1 einfügen' }));
    expect(bars()).toHaveLength(9);
  });
});

describe('Spec song-lock › Gesperrte Doppelseite', () => {
  it('Kopf der Doppelseite', () => {
    setup();
    expect(title()).toHaveTextContent('Hysteria');
    expect(within(title()).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Song-Tempo: 120 BPM' })).toHaveTextContent('♩ = 120');
    expect(button('Song-Tempo: 120 BPM')).not.toBeInTheDocument();
    expect(button('Song abspielen')).toBeInTheDocument();
    expect(button('Song löschen')).not.toBeInTheDocument();
  });

  it('Klick auf den Titel', async () => {
    const { user } = setup();
    await user.click(title());
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('Überfahren der Struktur', async () => {
    const { user } = setup();
    await user.hover(bar(1).closest('.structure-row') as HTMLElement);
    expect(within(structure()).queryAllByRole('button', { name: /einfügen|anfügen/ })).toEqual([]);
  });

  it('Pattern ziehen', () => {
    const song = hysteria();
    const pattern = song.patterns[0]!;
    const other = { ...verse(), id: 'other', name: 'Other' };
    const { current } = setup({ ...song, patterns: [pattern, other] });
    const source = document.querySelector(`[aria-labelledby="pattern-${other.id}"] header`) as HTMLElement;
    const mouse = { button: 0, pointerType: 'mouse' };
    fireEvent.pointerDown(source, { ...mouse, clientX: 10, clientY: 10 });
    hitTarget = bar(1);
    fireEvent.pointerMove(document, { ...mouse, clientX: 40, clientY: 30 });
    fireEvent.pointerUp(document, { ...mouse, clientX: 40, clientY: 30 });
    expect(allBars(current())[0]!.grooveId).toBe(pattern.id);
  });

  it('Patterns anlegen', () => {
    setup();
    expect(button('Neuer Groove')).not.toBeInTheDocument();
    expect(button('Neuer Fill')).not.toBeInTheDocument();
  });

  it('Pattern öffnen', async () => {
    const { user, store } = setup();
    await user.click(screen.getByRole('button', { name: 'Verse ansehen' }));
    expect(store.getState().view.kind).toBe('pattern');
  });
});

describe('Spec song-lock › Auswahl im gesperrten Song', () => {
  const PLAY_ACTIONS = ['Ab hier abspielen', 'In Schleife abspielen'];
  const popoverButtons = (dialog: HTMLElement) =>
    within(dialog)
      .getAllByRole('button')
      .map((b) => b.textContent);

  async function selectBars(user: ReturnType<typeof userEvent.setup>, from: number, to: number) {
    await user.click(bar(from));
    await user.keyboard('{Shift>}');
    await user.click(bar(to));
    await user.keyboard('{/Shift}');
  }

  it('Takte auswählen', async () => {
    const { user } = setup();
    await selectBars(user, 5, 8);
    for (const n of [5, 6, 7, 8]) expect(bar(n)).toHaveAttribute('aria-pressed', 'true');
    expect(bar(4)).toHaveAttribute('aria-pressed', 'false');
    expect(document.querySelectorAll('.item.groove.highlighted')).toHaveLength(4);
    const popover = screen.getByRole('dialog', { name: 'Takt-Auswahl' });
    expect(popoverButtons(popover)).toEqual(PLAY_ACTIONS);
    expect(within(popover).getByRole('heading', { name: 'Takte 5–8' })).toBeInTheDocument();
  });

  it('Segment auswählen', async () => {
    const { user } = setup();
    await user.click(within(structure()).getByRole('button', { name: 'Verse' }));
    expect(popoverButtons(screen.getByRole('dialog', { name: 'Segment Verse' }))).toEqual(PLAY_ACTIONS);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('Schleife im gesperrten Song', async () => {
    const { user, player, source, bars } = setup();
    await selectBars(user, 5, 8);
    await user.click(screen.getByRole('button', { name: 'In Schleife abspielen' }));
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(source().loop).toBe(true);
    expect(source().timeline()!.marks.map((m) => m.mark)).toEqual(bars().slice(4).map((b) => b.id));
  });

  it('Alle aktiven Knöpfe bei geöffnetem Takt-Popover freigegeben', async () => {
    const { user } = setup();
    await user.click(bar(1));
    expect(inputs()).toHaveLength(0);
    expect(unsafeButtons()).toEqual([]);
  });

  it('Alle aktiven Knöpfe bei geöffnetem Segment-Popover freigegeben', async () => {
    const { user } = setup();
    await user.click(within(structure()).getByRole('button', { name: 'Intro' }));
    expect(inputs()).toHaveLength(0);
    expect(unsafeButtons()).toEqual([]);
  });
});

describe('Spec song-lock › Gesperrter Pattern-Editor', () => {
  /** Groove „Verse“ mit Flam auf der Snare, geöffnet im Pattern-Editor. */
  function openEditor(song = hysteria()) {
    const flam = song.patterns[0]!;
    flam.beats[0]!.articulations = { snare: { 2: 'flam' } };
    const store = createNotebookStore([song]);
    store.openSong(song.id);
    store.openPattern(flam.id);
    return { ...renderApp(store), flam };
  }
  const grid = () => screen.getByRole('grid', { name: 'Sequencer' });
  const cell = (name: string) => within(grid()).getByRole('button', { name });
  const snareCell = 'Snare, Beat 1, Position 3, Flam';

  it('Klick im Sequencer', async () => {
    const { user, current } = openEditor();
    const before = current();
    await user.click(cell('Bassdrum, Beat 1, Position 2'));
    await user.click(cell('Bassdrum, Beat 1, Position 1'));
    expect(current()).toBe(before);
  });

  it('Shift-Klick im Sequencer', async () => {
    const { user, current } = openEditor();
    const before = current();
    await user.keyboard('{Shift>}');
    await user.click(cell(snareCell));
    await user.keyboard('{/Shift}');
    expect(current()).toBe(before);
  });

  it('Schläge lesbar', () => {
    openEditor();
    const step = cell(snareCell);
    expect(step).toHaveAttribute('aria-pressed', 'true');
    expect(step).toHaveAttribute('data-articulation', 'flam');
    expect(step).toBeDisabled();
  });

  it('Werte als Text', () => {
    openEditor();
    const editor = screen.getByRole('region', { name: 'Pattern ansehen' });
    expect(within(editor).getByRole('heading', { level: 2 })).toHaveTextContent('Verse');
    expect(within(editor).getByText('4 Beats')).toBeInTheDocument();
    expect(within(grid()).getAllByText('16tel')).toHaveLength(4);
    expect(editor.querySelector('.tempo-field')).toHaveTextContent('♩ = 120 (Song-Tempo)');
    expect(within(editor).getByText('Groove')).toBeInTheDocument();
    expect(document.querySelector('.editor svg, .editor canvas')).not.toBeNull();
  });

  it('Aktionen entfallen', () => {
    openEditor();
    for (const name of ['Rückgängig', 'Wiederherstellen', 'Duplizieren', 'Löschen']) expect(button(name)).not.toBeInTheDocument();
  });

  it('Laufposition beim Abspielen', async () => {
    const { user, reach } = openEditor();
    await user.click(screen.getByRole('button', { name: 'Abspielen' }));
    reach({ beat: 0, position: 1 });
    expect(cell('Bassdrum, Beat 1, Position 2')).toHaveClass('playing');
  });

  it('Keine Eingabefelder im Pattern-Editor', () => {
    openEditor();
    expect(inputs()).toHaveLength(0);
  });

  it('Alle aktiven Knöpfe im Pattern-Editor freigegeben', () => {
    openEditor();
    expect(unsafeButtons()).toEqual([]);
  });

  it('Tastenkürzel', async () => {
    const { user, flam, store } = openEditor();
    const hits = () => store.getState().songs[0]!.patterns[0]!.beats[0]!.hits.kick;
    await user.click(unlockButton());
    await user.click(cell('Bassdrum, Beat 1, Position 2'));
    expect(hits()).toContain(1);
    await user.click(lockButton());
    await user.keyboard('{Control>}z{/Control}');
    expect(hits()).toContain(1);
    expect(store.getState().songs[0]!.patterns[0]!.id).toBe(flam.id);
  });

  it('Klick auf den Patternnamen', async () => {
    const { user } = openEditor();
    await user.click(screen.getByRole('heading', { level: 2 }));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('Entsperrt bietet der Editor wieder alle Bedienelemente', async () => {
    const { user } = openEditor();
    await user.click(unlockButton());
    expect(screen.getByRole('region', { name: 'Pattern bearbeiten' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Unterteilung Beat 1' })).toBeInTheDocument();
    expect(button('Song-Tempo: 120 BPM')).toBeInTheDocument();
    expect(button('Duplizieren')).toBeInTheDocument();
    expect(cell('Bassdrum, Beat 1, Position 2')).toBeEnabled();
  });
});

describe('Spec song-lock › Gleiche Anordnung beim Entsperren', () => {
  function openEditor(pattern = verse()) {
    const song = hysteria(pattern);
    const store = createNotebookStore([song]);
    store.openSong(song.id);
    store.openPattern(pattern.id);
    return renderApp(store);
  }
  const editor = () => document.querySelector('.editor-header') as HTMLElement;

  it('Länge', async () => {
    const { user } = openEditor();
    expect(within(editor()).getByText('4 Beats')).not.toHaveAttribute('aria-label');
    await user.click(unlockButton());
    expect(screen.getByRole('combobox', { name: 'Länge (Beats)' })).toHaveDisplayValue('4 Beats');
    expect(editor()).not.toHaveTextContent('Länge (Beats)');
  });

  it('Länge von einem Beat', async () => {
    const { user } = openEditor(patternOf([{}]));
    expect(within(editor()).getByText('1 Beat')).toBeInTheDocument();
    await user.click(unlockButton());
    expect(screen.getByRole('combobox', { name: 'Länge (Beats)' })).toHaveDisplayValue('1 Beat');
  });

  it('Tempo im Pattern-Editor', async () => {
    const { user } = openEditor();
    const note = () => editor().querySelector('.tempo-field') as HTMLElement;
    expect(note()).toHaveTextContent('♩ = 120 (Song-Tempo)');
    expect(button('Song-Tempo: 120 BPM')).not.toBeInTheDocument();
    await user.click(unlockButton());
    expect(note()).toHaveTextContent('♩ = 120 (Song-Tempo)');
    expect(button('Song-Tempo: 120 BPM')).toBeInTheDocument();
  });

  it('Unterteilung', async () => {
    const { user } = openEditor();
    const grid = screen.getByRole('grid', { name: 'Sequencer' });
    expect(within(grid).getAllByText('16tel')).toHaveLength(4);
    await user.click(unlockButton());
    expect(screen.getByRole('combobox', { name: 'Unterteilung Beat 1' })).toHaveDisplayValue('16tel');
  });

  it('Text und Bedienelement teilen sich die Maße', async () => {
    const { user } = openEditor();
    const pairs = [
      { text: () => within(editor()).getByText('4 Beats'), control: () => screen.getByRole('combobox', { name: 'Länge (Beats)' }) },
      { text: () => within(screen.getByRole('grid')).getAllByText('16tel')[0]!, control: () => screen.getByRole('combobox', { name: 'Unterteilung Beat 1' }) },
    ];
    const classes = pairs.map((p) => p.text().className);
    await user.click(unlockButton());
    pairs.forEach((p, i) => {
      expect(classes[i]).toContain('value-control');
      expect(p.control().className).toBe(classes[i]);
    });
  });
});

describe('Spec song-lock › Schloss im Pattern-Editor', () => {
  it('Wechsel in den Pattern-Editor', async () => {
    const { user } = setup();
    await user.click(unlockButton());
    await user.click(screen.getByRole('button', { name: 'Verse bearbeiten' }));
    expect(lockButton()).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hysteria' }));
    expect(lockButton()).toBeInTheDocument();
  });

  it('Entsperren im Pattern-Editor', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Verse ansehen' }));
    await user.click(unlockButton());
    await user.click(screen.getByRole('button', { name: 'Hysteria' }));
    expect(lockButton()).toBeInTheDocument();
  });
});

describe('Spec song-lock › Adresse nennt ein Pattern', () => {
  it('Adresse nennt ein Pattern', () => {
    const song = hysteria();
    window.history.replaceState(null, '', `#/songs/${song.id}/patterns/${song.patterns[0]!.id}`);
    const store = createNotebookStore([song]);
    disconnect = connectUrl(store, window);
    renderApp(store);
    expect(store.getState().view.kind).toBe('pattern');
    expect(isLocked()).toBe(true);
  });
});

describe('Spec song-lock › Fremde Änderungen im gesperrten Song', () => {
  it('Änderung eines Mitglieds', () => {
    const { store, current } = setup();
    act(() => store.applyRemote([{ ...current(), title: 'Fremd' }], []));
    expect(title()).toHaveTextContent('Fremd');
    expect(isLocked()).toBe(true);
  });
});

describe('Spec song-lock › Wiedergabe beim Wechsel des Zustands', () => {
  it('Sperren während der Wiedergabe', async () => {
    const { user, player } = setup();
    await user.click(screen.getByRole('button', { name: 'Song abspielen' }));
    await user.click(unlockButton());
    await user.click(lockButton());
    expect(player.start).toHaveBeenCalledTimes(1);
    expect(player.stop).not.toHaveBeenCalled();
    expect(button('Stopp')).toBeInTheDocument();
  });
});

describe('Spec navigation › Editierbare Überschrift', () => {
  it('Gesperrter Song', async () => {
    const { user } = setup();
    await user.click(title());
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(title()).toHaveTextContent('Hysteria');
  });
});

describe('Spec songbook-view › Leseansicht ohne Bedienelemente', () => {
  it('Gesperrter Song ohne Segmente', () => {
    setup(songWith({ title: 'Skizze', patterns: [verse()] }));
    expect(within(structure()).queryAllByRole('button')).toEqual([]);
  });
});
