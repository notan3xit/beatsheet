import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountApi } from '../account/api';
import { createAccountSession } from '../account/session';
import type { Song, Workbook } from '../domain/types';
import type { LastChange } from '../persistence/activity';
import { createNotebookStore } from '../state/notebookStore';
import type { SongActivity } from '../sync/songActivity';
import type { WorkbookActions } from '../sync/sync';
import { fakePlayer } from '../test/fakePlayer';
import { songWith } from '../test/songs';
import { App } from './App';

const ME = 'ich@example.com';
const MAX = 'max@example.org';
const NOW = new Date(2026, 10, 8, 14, 30);
const ago = (seconds: number) => NOW.getTime() / 1000 - seconds;

const band: Workbook = { id: 'wb-band', title: 'Band', owner: ME, members: [ME, MAX], profiles: { [MAX]: { name: 'Max', initials: 'M', color: 'blue' } } };
const proberaum: Workbook = { id: 'wb-proberaum', title: 'Proberaum', owner: ME, members: [ME, 'anna@example.com'] };
const personal: Workbook = { id: 'wb-me', title: 'Meine Songs', owner: ME, members: [ME], personal: true };

function fakeActivity(entries: Record<string, LastChange & { isNew?: boolean }>) {
  const listeners = new Set<() => void>();
  let version = 0;
  const activity: SongActivity = {
    lastChange: (id) => (entries[id] ? { time: entries[id].time, author: entries[id].author } : null),
    isNew: (id) => entries[id]?.isNew ?? false,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getVersion: () => version,
  };
  const markNew = (id: string, isNew: boolean) => {
    entries[id] = { ...entries[id]!, isNew };
    version++;
    act(() => listeners.forEach((l) => l()));
  };
  return { activity, markNew };
}

const NO_NOTICES: ReturnType<WorkbookActions['getNotices']> = [];
const noSync = (): WorkbookActions => ({
  createWorkbook: vi.fn(),
  renameWorkbook: vi.fn(),
  deleteWorkbook: vi.fn(),
  invite: vi.fn(),
  removeMember: vi.fn(),
  moveSong: vi.fn(),
  createSongIn: vi.fn(),
  deleteSong: vi.fn(),
  prepareLogout: vi.fn(async () => true),
  afterLogout: vi.fn(),
  getNotices: () => NO_NOTICES,
  dismissNotice: vi.fn(),
  isOffline: () => false,
  subscribe: () => () => {},
});

function setup(songs: { song: Song; workbook?: Workbook }[], entries: Record<string, LastChange & { isNew?: boolean }>) {
  const placement = Object.fromEntries(songs.flatMap(({ song, workbook }) => (workbook ? [[song.id, workbook.id]] : [])));
  const store = createNotebookStore(songs.map((s) => s.song), undefined, { placement, workbooks: [band, proberaum, personal] });
  const account: AccountApi = {
    session: vi.fn(async () => ME),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async () => ({ ok: true as const, email: ME })),
    logout: vi.fn(async () => ({ ok: true as const })),
  };
  const session = createAccountSession(account);
  session.setEmail(ME);
  const fake = fakeActivity(entries);
  render(<App store={store} session={session} sync={noSync()} player={fakePlayer().player} activity={fake.activity} />);
  return fake;
}

const tileOf = (area: string, title: string) => within(screen.getByRole('region', { name: area })).getByText(title).closest('article')!;
const entry = (title: string) => within(screen.getByRole('navigation', { name: 'Workbooks' })).getByRole('button', { name: title });
const dotIn = (element: HTMLElement) => within(element).queryByRole('img', { name: 'neu' });

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date', 'setInterval', 'clearInterval'] });
});
afterEach(() => vi.useRealTimers());

describe('Spec song-activity › Letzte Änderung auf der Kachel', () => {
  it('Gemeinsames Workbook', () => {
    const song = songWith({ title: 'Hysteria' });
    setup([{ song, workbook: band }], { [song.id]: { time: ago(7200), author: MAX } });
    expect(tileOf('Band', 'Hysteria')).toHaveTextContent('vor 2 Std.');
    expect(tileOf('Band', 'Hysteria')).toHaveTextContent('Max');
  });

  it('Ohne Profil die Adresse', () => {
    const song = songWith({ title: 'Intro' });
    setup([{ song, workbook: band }], { [song.id]: { time: ago(7200), author: 'anna@example.com' } });
    expect(tileOf('Band', 'Intro')).toHaveTextContent('anna@example.com');
  });

  it('Meine Songs: Zeit, kein Autor, kein Punkt', () => {
    const local = songWith({ title: 'Skizze' });
    const own = songWith({ title: 'Eigen' });
    setup([{ song: local }, { song: own, workbook: personal }], {
      [local.id]: { time: ago(7200), author: null },
      [own.id]: { time: ago(7200), author: MAX, isNew: true },
    });
    expect(tileOf('Meine Songs', 'Skizze')).toHaveTextContent('vor 2 Std.');
    expect(tileOf('Meine Songs', 'Eigen')).not.toHaveTextContent('Max');
    expect(dotIn(tileOf('Meine Songs', 'Eigen'))).toBeNull();
  });
});

describe('Spec song-activity › Zeitangabe', () => {
  it('folgt nach einer Minute dem Lauf der Zeit', () => {
    const song = songWith({ title: 'Hysteria' });
    setup([{ song, workbook: band }], { [song.id]: { time: ago(30), author: MAX } });
    expect(tileOf('Band', 'Hysteria')).toHaveTextContent('gerade eben');
    act(() => vi.advanceTimersByTime(60_000));
    expect(tileOf('Band', 'Hysteria')).toHaveTextContent('vor 1 Min.');
  });
});

describe('Spec song-activity › Neues auf der Kachel', () => {
  it('Punkt mit zugänglichem Namen, erscheint bei einer Meldung', () => {
    const song = songWith({ title: 'Hysteria' });
    const { markNew } = setup([{ song, workbook: band }], { [song.id]: { time: ago(60), author: MAX } });
    expect(dotIn(tileOf('Band', 'Hysteria'))).toBeNull();
    markNew(song.id, true);
    expect(dotIn(tileOf('Band', 'Hysteria'))).not.toBeNull();
  });
});

describe('Spec song-activity › Neues in der Seitenleiste', () => {
  it('Songs mit Neuem und Nichts Neues', () => {
    const hysteria = songWith({ title: 'Hysteria' });
    const intro = songWith({ title: 'Intro' });
    const outro = songWith({ title: 'Outro' });
    setup([{ song: hysteria, workbook: band }, { song: intro, workbook: band }, { song: outro, workbook: proberaum }], {
      [hysteria.id]: { time: ago(60), author: MAX, isNew: true },
      [intro.id]: { time: ago(60), author: MAX, isNew: true },
      [outro.id]: { time: ago(60), author: ME },
    });
    expect(within(entry('Band')).getAllByRole('img', { name: 'neu' })).toHaveLength(1);
    expect(entry('Band')).toHaveAccessibleDescription(/neu/);
    expect(dotIn(entry('Proberaum'))).toBeNull();
  });
});
