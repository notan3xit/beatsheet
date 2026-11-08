import * as A from '@automerge/automerge/slim';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPattern, duplicatePattern, renamePattern, touch } from '../domain/pattern';
import { changeSubdivision, toggleHit } from '../domain/sequencer';
import { deleteBar, renameSegment, setBarProps, appendSegment } from '../domain/structure';
import type { Pattern, Song, Workbook } from '../domain/types';
import { readHistory } from '../persistence/history';
import { connectStore, openRepository } from '../persistence/repository';
import { applySong, changeMessage, createSongDoc, songOf, type SongDocument } from '../persistence/songDoc';
import { createNotebookStore } from '../state/notebookStore';
import { songWith } from '../test/songs';
import { App } from './App';

const ARTJOM = 'artjom@example.com';
const MAX = 'max@example.org';
/** Montag, 2. November 2026, 20:00 Ortszeit. */
const MONDAY = new Date(2026, 10, 2, 20, 0);
const minutes = (date: Date, n: number) => new Date(date.getTime() + n * 60_000);

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterEach(() => vi.useRealTimers());

const band: Workbook = {
  id: 'band',
  title: 'Band',
  owner: ARTJOM,
  members: [ARTJOM, MAX],
  profiles: {
    [ARTJOM]: { name: 'Artjom', initials: 'AW', color: 'blue' },
    [MAX]: { name: 'Max', initials: 'MK', color: 'peach' },
  },
};

/** „Verse“ mit einem Schlag, „Into Chorus“ als Fill; Segment „Intro“ mit 4 Takten, der erste mit beiden. */
function startSong(): Song {
  const verse = toggleHit(createPattern([], { kind: 'groove', name: 'Verse' }), 0, 'kick', 0);
  const fill = toggleHit(createPattern([verse], { kind: 'fill', name: 'Into Chorus', length: 1 }), 0, 'snare', 0);
  const song = appendSegment({ ...songWith({ title: 'Hysteria', patterns: [verse, fill] }), tempo: 40 }, { name: 'Intro', bars: 4 });
  const first = song.segments[0]!.blocks[0]!.bars[0]!.id;
  return setBarProps(song, [first], { grooveId: verse.id, fillId: fill.id });
}

/** Historie als echtes Dokument; jede Änderung eine Minute nach der vorigen, wenn nicht anders angegeben. */
function scenario(start: Song = startSong()) {
  vi.setSystemTime(MONDAY);
  let doc: SongDocument = createSongDoc(start);
  const api = {
    get doc() {
      return doc;
    },
    get song() {
      return songOf(doc);
    },
    edit(change: (song: Song) => Song, { by = ARTJOM, at }: { by?: string | null; at?: Date } = {}) {
      vi.setSystemTime(at ?? minutes(new Date(), 1));
      const song = songOf(doc);
      doc = applySong(doc, { ...change(song), revision: song.revision + 1 }, changeMessage({ by: by ?? undefined }));
      return api;
    },
    pattern(name: string, change: (p: Pattern) => Pattern, options?: { by?: string | null; at?: Date }) {
      return api.edit((s) => ({ ...s, patterns: s.patterns.map((p) => (p.name === name ? touch(change(p)) : p)) }), options);
    },
  };
  return api;
}

function open(history: ReturnType<typeof scenario>, { shared = false, locked = false, view = 'history' }: { shared?: boolean; locked?: boolean; view?: 'history' | 'book' } = {}) {
  const song = history.song;
  const store = createNotebookStore([song], undefined, shared ? { placement: { [song.id]: band.id }, workbooks: [band] } : undefined);
  store.openSong(song.id);
  store.setLocked(locked);
  if (view === 'history') store.openHistory();
  const user = userEvent.setup();
  render(<App store={store} historyOf={() => readHistory(history.doc)} />);
  return { store, user };
}

const list = () => screen.getByRole('list', { name: 'Bearbeitungen' });
const entries = () => within(list()).getAllByRole('button');
const detail = () => screen.getByRole('region', { name: 'Stand' });
const restoreButtons = () => within(detail()).queryAllByRole('button', { name: /auf diesen Stand/ });
const bars = (song: Song) => song.segments.flatMap((s) => s.blocks.flatMap((b) => b.bars));

describe('Spec song-history › Verlauf öffnen', () => {
  it('Verlauf öffnen: Knopf zwischen „Song löschen“ und „Struktur ausklappen“', async () => {
    const { store, user } = open(scenario(), { view: 'book' });
    const title = screen.getByRole('button', { name: 'Verlauf' }).parentElement!;
    const names = within(title).getAllByRole('button').map((b) => b.textContent || b.getAttribute('aria-label'));
    expect(names.indexOf('Verlauf')).toBe(names.indexOf('Song löschen') + 1);
    expect(names.indexOf('Struktur ausklappen')).toBe(names.indexOf('Verlauf') + 1);
    await user.click(screen.getByRole('button', { name: 'Verlauf' }));
    expect(store.getState().view).toEqual({ kind: 'history' });
  });

  it('Verlauf öffnen auch gesperrt', async () => {
    const { store, user } = open(scenario(), { view: 'book', locked: true });
    await user.click(screen.getByRole('button', { name: 'Verlauf' }));
    expect(store.getState().view).toEqual({ kind: 'history' });
  });

  it('Sperrzustand bleibt', async () => {
    const { store, user } = open(scenario());
    expect(screen.getByRole('button', { name: 'Song sperren' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('navigation', { name: 'Pfad' })).getByRole('button', { name: 'Hysteria' }));
    expect(store.getState()).toMatchObject({ view: { kind: 'book' }, locked: false });
  });
});

describe('Spec song-history › Liste der Bearbeitungen', () => {
  it('neueste zuerst, mit Trennern je Tag', () => {
    const history = scenario()
      .edit((s) => ({ ...s, tempo: 117 }), { by: MAX })
      .pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0), { at: new Date(2026, 10, 3, 19, 0) });
    open(history);
    expect(entries().map((e) => e.textContent)).toEqual([
      expect.stringContaining('Verse'),
      expect.stringContaining('Tempo'),
      expect.stringContaining('Song'),
    ]);
    expect(within(list()).getAllByRole('heading')).toHaveLength(2);
  });

  it('Bearbeitung ohne Nettounterschied ist gekennzeichnet', () => {
    open(scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)).pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)));
    expect(entries()[0]).toHaveAttribute('data-unchanged');
    expect(entries()[1]).not.toHaveAttribute('data-unchanged');
  });
});

describe('Spec song-history › Personen im Verlauf', () => {
  const people = () => within(list()).queryAllByRole('group').map((g) => g.getAttribute('aria-label'));

  it('Zwei Personen', () => {
    open(scenario().edit((s) => ({ ...s, tempo: 117 })).pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0), { by: MAX }), { shared: true });
    // Das Anlegen des Songs trägt keinen Autor
    expect(people()).toEqual(['Max', 'Artjom', 'Unbekannt']);
  });

  it('Eigener Song', () => {
    open(scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0), { by: MAX }));
    expect(people()).toEqual([]);
  });

  it('Autor ohne Profil und ohne Autor', () => {
    open(scenario().edit((s) => ({ ...s, tempo: 90 }), { by: null }).edit((s) => ({ ...s, tempo: 117 }), { by: 'anna@example.com' }), { shared: true });
    expect(people().slice(0, 2)).toEqual(['anna@example.com', 'Unbekannt']);
  });
});

describe('Spec song-history › Stand einer Bearbeitung', () => {
  it('Neueste ist gewählt; ältere Bearbeitung wählen', async () => {
    const history = scenario().edit((s) => ({ ...s, tempo: 117 }), { at: new Date(2026, 10, 2, 21, 10) }).pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0));
    const { user } = open(history);
    expect(entries()[0]).toHaveAttribute('aria-current', 'true');
    expect(restoreButtons()).toHaveLength(0);
    await user.click(entries()[1]!);
    expect(entries()[1]).toHaveAttribute('aria-current', 'true');
    expect(detail()).toHaveTextContent('21:10');
    expect(restoreButtons()).toHaveLength(2);
  });
});

describe('Spec song-history › Schritte einer Bearbeitung', () => {
  const many = () => {
    const history = scenario().edit((s) => ({ ...s, tempo: 100 }));
    for (let i = 0; i < 5; i++) history.pattern('Verse', (p) => toggleHit(p, 1, 'snare', i % 4));
    return history;
  };
  const range = () => within(detail()).getByRole('slider');

  it('Zurückschritt', async () => {
    const { user } = open(many());
    expect(range()).toHaveAttribute('aria-valuetext', 'Schritt 5 von 5');
    await user.click(within(detail()).getByRole('button', { name: 'Schritt zurück' }));
    await user.click(within(detail()).getByRole('button', { name: 'Schritt zurück' }));
    expect(range()).toHaveAttribute('aria-valuetext', 'Schritt 3 von 5');
  });

  it('Vor der Bearbeitung', () => {
    open(many());
    fireEvent.change(range(), { target: { value: range().getAttribute('min') } });
    expect(range()).toHaveAttribute('aria-valuetext', 'vorher');
    expect(within(detail()).getByRole('button', { name: 'Schritt zurück' })).toBeDisabled();
    expect(within(detail()).getByRole('button', { name: 'Schritt vor' })).toBeEnabled();
  });
});

describe('Spec song-history › Vergleich eines Patterns', () => {
  it('Zuerst die Song-Daten, darunter die Eigenschaften des Patterns', () => {
    open(scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)));
    const songData = within(detail()).getByRole('list', { name: 'Song-Daten' });
    const props = within(detail()).getByRole('list', { name: 'Eigenschaften' });
    expect(songData.compareDocumentPosition(props) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(props.compareDocumentPosition(within(detail()).getAllByRole('grid', { name: 'Sequencer' })[0]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('Umbenannt', () => {
    open(scenario().pattern('Verse', (p) => renamePattern(p, 'Strophe')));
    const props = within(detail()).getByRole('list', { name: 'Eigenschaften' });
    expect(props.querySelector('del')).toHaveTextContent('Verse');
    expect(props.querySelector('ins')).toHaveTextContent('Strophe');
  });

  it('Kopie', () => {
    const history = scenario();
    const copy = duplicatePattern(history.song.patterns[0]!, history.song.patterns);
    history.edit((s) => ({ ...s, patterns: [...s.patterns, copy] })).pattern(copy.name, (p) => toggleHit(p, 1, 'snare', 0));
    open(history);
    expect(within(detail()).getAllByRole('grid', { name: 'Sequencer' })).toHaveLength(2);
    expect(detail().querySelector('details summary')).toHaveTextContent(/Vorlage.*Verse/);
  });
});

describe('Spec song-history › Sequencer vor der Bearbeitung', () => {
  const previous = () => detail().querySelector('details')!;

  it('Eingeklappt, lässt sich aufklappen', async () => {
    const { user } = open(scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)));
    expect(previous().open).toBe(false);
    await user.click(previous().querySelector('summary')!);
    expect(previous().open).toBe(true);
  });

  it('Unterteilung geändert: aufgeklappt', () => {
    open(scenario().pattern('Verse', (p) => changeSubdivision(p, 1, 3).pattern));
    expect(previous().open).toBe(true);
  });

  it('Gemeinsam scrollen: beide Sequencer in einem Bereich', () => {
    open(scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)));
    const [before, after] = within(detail()).getAllByRole('grid', { name: 'Sequencer' });
    expect(before!.closest('.history-sequencers')).not.toBeNull();
    expect(before!.closest('.history-sequencers')).toBe(after!.closest('.history-sequencers'));
  });
});

describe('Spec song-history › Verwendung eines Patterns im Song', () => {
  const highlighted = () => within(detail()).getAllByRole('img').filter((bar) => bar.hasAttribute('data-highlighted'));

  it('Groove im Refrain: nur Takte mit dem Pattern sind farbig', () => {
    open(scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)));
    expect(highlighted().map((b) => b.getAttribute('aria-label'))).toEqual([expect.stringContaining('Takt 1')]);
    expect(within(detail()).queryByRole('note')).not.toBeInTheDocument();
  });

  it('Ohne Zuordnung: Hinweis statt Motiv', () => {
    open(scenario().pattern('Into Chorus', (p) => toggleHit(p, 0, 'kick', 0)).edit((s) => setBarProps(s, [bars(s)[0]!.id], { fillId: null })).pattern('Into Chorus', (p) => toggleHit(p, 0, 'kick', 0)));
    expect(within(detail()).getByRole('note')).toBeInTheDocument();
    expect(within(detail()).queryAllByRole('img')).toEqual([]);
  });
});

describe('Spec song-history › Vergleich der Struktur', () => {
  const motif = (name: 'Vorher' | 'Nachher') => within(detail()).getByRole('group', { name });

  it('Takte gekürzt', () => {
    open(scenario().edit((s) => bars(s).slice(2).reduce((song, bar) => deleteBar(song, bar.id), s)));
    const before = within(motif('Vorher')).getAllByRole('img');
    expect(before.filter((b) => b.hasAttribute('data-highlighted'))).toHaveLength(2);
    expect(within(motif('Nachher')).getAllByRole('img').filter((b) => b.hasAttribute('data-highlighted'))).toHaveLength(0);
  });

  it('Segment umbenannt', () => {
    open(scenario().edit((s) => renameSegment(s, s.segments[0]!.id, 'Strophe')));
    expect(motif('Nachher').querySelector('del')).toHaveTextContent('Intro');
    expect(motif('Nachher').querySelector('ins')).toHaveTextContent('Strophe');
  });
});

describe('Spec song-history › Takte im Motiv', () => {
  it('Takt überfahren und verlassen', () => {
    open(scenario().edit((s) => renameSegment(s, s.segments[0]!.id, 'Strophe')));
    const [bar] = within(within(detail()).getByRole('group', { name: 'Vorher' })).getAllByRole('img');
    expect(bar).toHaveAccessibleName(/Takt 1.*Verse.*Into Chorus/);
    fireEvent.pointerMove(bar!, { clientX: 10, clientY: 10 });
    expect(screen.getByRole('tooltip')).toHaveTextContent(/Verse.*Into Chorus/);
    fireEvent.pointerLeave(bar!);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});

describe('Spec song-history › Vergleich der Song-Daten', () => {
  it('Tempo geändert', () => {
    open(scenario().edit((s) => ({ ...s, tempo: 117 })));
    expect(detail().querySelector('del')).toHaveTextContent('40');
    expect(detail().querySelector('ins')).toHaveTextContent('117');
  });
});

describe('Spec song-history › Änderungen während des geöffneten Verlaufs', () => {
  it('Max ändert gleichzeitig', async () => {
    const history = scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)).edit((s) => ({ ...s, title: 'Hysteria (live)' }));
    const { store, user } = open(history, { shared: true });
    await user.click(entries()[1]!);
    const selected = entries()[1]!.textContent;

    history.edit((s) => ({ ...s, tempo: 117 }), { by: MAX });
    act(() => store.applyRemote([history.song], []));
    expect(entries()).toHaveLength(4);
    expect(entries()[0]).toHaveTextContent('117');
    expect(within(list()).getByRole('button', { current: true })).toHaveTextContent(selected!);
  });
});

describe('Spec song-history › Wiederherstellen', () => {
  const dialog = () => screen.getByRole('alertdialog');
  const verse = (song: Song) => song.patterns.find((p) => p.name === 'Verse')!;

  /** Mit Repository, damit eine Wiederherstellung ins Dokument geschrieben wird. */
  async function openWithRepository(history: ReturnType<typeof scenario>) {
    const repo = await openRepository(`history-ui-${crypto.randomUUID()}`, { author: () => ARTJOM });
    const song = repo.adopt(history.song.id, A.save(history.doc), band.id);
    const store = createNotebookStore([song], undefined, { placement: { [song.id]: band.id }, workbooks: [band] });
    connectStore(store, repo);
    store.openSong(song.id);
    store.setLocked(false);
    store.openHistory();
    const user = userEvent.setup();
    render(<App store={store} historyOf={(id) => repo.history(id)} />);
    return { store, user };
  }

  it('Groove: Knöpfe für den Gegenstand und den ganzen Song', async () => {
    const { user } = open(scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)).edit((s) => ({ ...s, tempo: 117 }), { by: MAX }));
    await user.click(entries()[1]!);
    expect(restoreButtons().map((b) => b.textContent)).toEqual(['Groove auf diesen Stand', 'Ganzen Song auf diesen Stand']);
  });

  it('Aktueller Stand', () => {
    open(scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)));
    expect(restoreButtons()).toHaveLength(0);
  });

  it('Gesperrt', async () => {
    const { user } = open(scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)).edit((s) => ({ ...s, tempo: 117 }), { by: MAX }), { locked: true });
    await user.click(entries()[1]!);
    expect(restoreButtons()).toHaveLength(0);
  });

  it('Änderungen anderer', async () => {
    const history = scenario()
      .pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0))
      .pattern('Verse', (p) => toggleHit(p, 2, 'snare', 0), { by: MAX });
    const { user } = open(history, { shared: true });
    await user.click(entries()[1]!);
    await user.click(screen.getByRole('button', { name: 'Groove auf diesen Stand' }));
    expect(dialog()).toHaveTextContent('Verse');
    expect(within(dialog()).getByRole('note')).toHaveTextContent('Max');
  });

  it('Abbrechen', async () => {
    const history = scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)).pattern('Verse', (p) => toggleHit(p, 2, 'snare', 0), { by: MAX });
    const { store, user } = open(history);
    const before = store.getState().songs[0];
    await user.click(entries()[1]!);
    await user.click(screen.getByRole('button', { name: 'Groove auf diesen Stand' }));
    await user.click(within(dialog()).getByRole('button', { name: 'Abbrechen' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(store.getState().songs[0]).toBe(before);
  });

  it('Nichts zu tun', async () => {
    const { user } = open(scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0)).edit((s) => ({ ...s, tempo: 117 }), { by: MAX }));
    await user.click(entries()[1]!);
    await user.click(screen.getByRole('button', { name: 'Groove auf diesen Stand' }));
    expect(within(dialog()).queryByRole('button', { name: 'Wiederherstellen' })).not.toBeInTheDocument();
    expect(within(dialog()).getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
  });

  it('Bestätigen: neue Bearbeitung oben, frühere bleiben', async () => {
    const history = scenario().pattern('Verse', (p) => toggleHit(p, 1, 'snare', 0));
    const target = history.song;
    history.pattern('Verse', (p) => toggleHit(p, 2, 'snare', 0), { by: MAX }).pattern('Verse', (p) => toggleHit(p, 3, 'snare', 0), { by: MAX });
    const { store, user } = await openWithRepository(history);
    const count = entries().length;
    await user.click(entries()[1]!);
    await user.click(screen.getByRole('button', { name: 'Groove auf diesen Stand' }));
    await user.click(within(dialog()).getByRole('button', { name: 'Wiederherstellen' }));

    expect(verse(store.getState().songs[0]!).beats).toEqual(verse(target).beats);
    expect(entries()).toHaveLength(count + 1);
    expect(entries()[0]).toHaveTextContent('Wiederhergestellt');
    expect(entries()[0]).toHaveAttribute('aria-current', 'true');
  });
});
