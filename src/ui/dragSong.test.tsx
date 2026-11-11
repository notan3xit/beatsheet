import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AccountApi } from '../account/api';
import { createAccountSession } from '../account/session';
import type { Positions } from '../domain/songOrder';
import type { Workbook } from '../domain/types';
import { createNotebookStore } from '../state/notebookStore';
import type { SongActivity } from '../sync/songActivity';
import type { ActionResult, WorkbookActions } from '../sync/sync';
import { fakePlayer } from '../test/fakePlayer';
import { songWith } from '../test/songs';
import { App } from './App';
import { dropEffect } from './dragSong';
import { signedInAs, memberList } from '../test/accounts';

const ME = 'ich@example.com';
const workbook = (title: string): Workbook => ({ id: `wb-${title}`, title, owner: ME, members: memberList([ME]) });
const noNotices: never[] = [];
const mouse = { pointerType: 'mouse', button: 0, pointerId: 1 } as const;

const PERSONAL: Workbook = { id: 'wb-mine', title: 'Meine Songs', owner: ME, members: memberList([ME]), personal: true };

afterEach(() => vi.restoreAllMocks());

/** Kacheln eines Bereichs in einer Zeile: 100 breit, 10 Abstand (sort-songs, design.md D5). */
function layoutTiles() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const row = this.parentElement?.classList.contains('tiles') ? [...this.parentElement.children].indexOf(this) : 0;
    return { left: row * 110, top: 0, width: 100, height: 80, right: row * 110 + 100, bottom: 80, x: row * 110, y: 0, toJSON: () => ({}) } as DOMRect;
  });
}

function setup({
  band = [] as string[],
  mineTitles = [] as string[],
  moveResult = { ok: true } as ActionResult,
  shared = true,
} = {}) {
  const skizze = songWith({ title: 'Skizze' });
  const uprising = songWith({ title: 'Uprising' });
  const extraBand = band.map((title) => songWith({ title }));
  const extraMine = mineTitles.map((title) => songWith({ title }));
  const store = createNotebookStore([skizze, uprising, ...extraBand, ...extraMine], undefined, {
    workbooks: shared ? [PERSONAL, workbook('Band'), workbook('Proberaum')] : [PERSONAL],
    placement: { [uprising.id]: 'wb-Band', ...Object.fromEntries(extraBand.map((s) => [s.id, 'wb-Band'])) },
  });
  const moveSong = vi.fn(async (songId: string, workbookId: string): Promise<ActionResult> => {
    if (moveResult.ok) store.place(songId, workbookId);
    return moveResult;
  });
  const positions: Record<string, Positions> = { 'wb-mine': {}, 'wb-Band': {}, 'wb-Proberaum': {} };
  let version = 0;
  const listeners = new Set<() => void>();
  const activity: SongActivity = {
    lastChange: () => null,
    isNew: () => false,
    order: (id) => positions[id] ?? null,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getVersion: () => version,
  };
  const reorder = vi.fn((id: string, entries: Positions) => {
    positions[id] = { ...positions[id], ...entries };
    version++;
    listeners.forEach((listener) => listener());
  });
  const sync = {
    moveSong,
    reorder,
    createWorkbook: vi.fn(),
    createSongIn: vi.fn(),
    renameWorkbook: vi.fn(),
    deleteWorkbook: vi.fn(),
    invite: vi.fn(),
    removeMember: vi.fn(),
    deleteSong: vi.fn(),
    prepareLogout: vi.fn(async () => true),
    afterLogout: vi.fn(async () => {}),
    getNotices: () => noNotices,
    dismissNotice: vi.fn(),
    isOffline: () => false,
    isOutdated: () => false,
    reload: vi.fn(),
    subscribe: () => () => {},
  } as unknown as WorkbookActions;
  const account: AccountApi = {
    session: vi.fn(async () => signedInAs(ME)),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async () => ({ ok: true as const, ...signedInAs(ME) })),
    logout: vi.fn(async () => ({ ok: true as const })),
  };
  const session = createAccountSession(account);
  session.setSession(signedInAs(ME));
  let hit: Element | null = null;
  render(<App store={store} session={session} sync={sync} player={fakePlayer().player} hitTest={() => hit} activity={activity} />);
  const byTitle = (title: string) => store.getState().songs.find((s) => s.title === title)!.id;
  /** Setzt die Reihenfolge eines Workbooks nach Titeln, wie nach einem Abgleich. */
  const setOrder = (id: string, entries: Record<string, string>) =>
    act(() => reorder(id, Object.fromEntries(Object.entries(entries).map(([title, position]) => [byTitle(title), position]))));
  return { store, moveSong, reorder, skizze, uprising, setOrder, aim: (target: Element | null) => (hit = target) };
}

const mine = () => screen.getByRole('region', { name: 'Meine Songs' });
const tile = (area: HTMLElement, title: string) => within(area).getByText(title).closest('article')!;
/** Bestätigt bzw. bricht die Rückfrage ab, die nach dem Loslassen erscheint. */
const answer = async (button: 'Verschieben' | 'Kopieren' | 'Abbrechen') =>
  fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: button }));
const entry = (title: string) => within(screen.getByRole('navigation', { name: 'Workbooks' })).getByRole('button', { name: title });

/** Zieht von der Kachel über das Ziel an `x`; ohne `release` bleibt das Ziehen offen. */
function drag(source: Element, aim: (t: Element | null) => void, target: Element | null, release = true, x = 60) {
  fireEvent.pointerDown(source, { ...mouse, clientX: 10, clientY: 10 });
  aim(target);
  fireEvent.pointerMove(document, { ...mouse, clientX: x, clientY: 40 });
  if (release) {
    fireEvent.pointerUp(document, { ...mouse, clientX: x, clientY: 40 });
    fireEvent.click(document.elementFromPoint?.(x, 40) ?? source);
  }
}

/** Titel der Kacheln eines Bereichs in Anzeigereihenfolge, „+ Song“ eingeschlossen. */
const shown = (area: HTMLElement) => [...area.querySelector('.tiles')!.children].map((el) => el.querySelector('.tile-open')?.textContent ?? el.textContent);

describe('Spec workbook-sync › Song in ein Workbook ziehen (UI)', () => {
  it('Auf einen Eintrag ziehen', async () => {
    const { moveSong, skizze, aim } = setup();
    drag(tile(mine(), 'Skizze'), aim, entry('Proberaum'));
    expect(moveSong).not.toHaveBeenCalled();
    await answer('Verschieben');
    await waitFor(() => expect(moveSong).toHaveBeenCalledWith(skizze.id, 'wb-Proberaum'));
    expect(within(mine()).queryByText('Skizze')).not.toBeInTheDocument();
  });

  it('In das gewählte Workbook ziehen', async () => {
    const { moveSong, skizze, aim } = setup();
    const band = screen.getByRole('region', { name: 'Band' });
    drag(tile(mine(), 'Skizze'), aim, within(band).getByText('Uprising'));
    await answer('Verschieben');
    await waitFor(() => expect(moveSong).toHaveBeenCalledWith(skizze.id, 'wb-Band'));
    expect(within(band).getByText('Skizze')).toBeInTheDocument();
  });

  it('Ziel hervorgehoben, Kachel bleibt als Platzhalter, Ziehbild folgt dem Zeiger', () => {
    const { aim } = setup();
    const source = tile(mine(), 'Skizze');
    drag(source, aim, entry('Proberaum'), false);
    expect(entry('Proberaum')).toHaveClass('drop-target');
    expect(entry('Band')).not.toHaveClass('drop-target');
    expect(source).toHaveClass('dragging');
    const image = document.querySelector<HTMLElement>('.drag-tile')!;
    expect(image).toHaveTextContent('Skizze');
    expect(image.style.left).toBe('60px');
    expect(document.body).toHaveClass('dragging-pattern');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.body).not.toHaveClass('dragging-pattern');
  });

  it('Gewähltes Workbook als Ziel', () => {
    const { aim } = setup();
    const band = screen.getByRole('region', { name: 'Band' });
    drag(tile(mine(), 'Skizze'), aim, within(band).getByRole('button', { name: '+ Song' }), false);
    expect(entry('Band')).toHaveClass('drop-target');
    expect(band).toHaveClass('drop-target');
    expect(within(band).getByRole('button', { name: '+ Song' })).not.toHaveClass('drop-target');
    fireEvent.keyDown(document, { key: 'Escape' });
  });

  it('Abbrechen: Loslassen außerhalb eines Ziels', async () => {
    const { moveSong, aim } = setup();
    drag(tile(mine(), 'Skizze'), aim, null);
    expect(moveSong).not.toHaveBeenCalled();
    expect(within(mine()).getByText('Skizze')).toBeInTheDocument();
    expect(document.querySelector('.drag-tile')).not.toBeInTheDocument();
  });

  it('Abbrechen: Escape', () => {
    const { moveSong, aim } = setup();
    drag(tile(mine(), 'Skizze'), aim, entry('Proberaum'), false);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.pointerUp(document, { ...mouse, clientX: 60, clientY: 80 });
    expect(moveSong).not.toHaveBeenCalled();
    expect(entry('Proberaum')).not.toHaveClass('drop-target');
  });

  it('Rückfrage nach dem Ziehen abgebrochen', async () => {
    const { moveSong, aim } = setup();
    drag(tile(mine(), 'Skizze'), aim, entry('Band'));
    await answer('Abbrechen');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(moveSong).not.toHaveBeenCalled();
    expect(within(mine()).getByText('Skizze')).toBeInTheDocument();
  });

  it('Klick statt Ziehen', () => {
    const { store, skizze } = setup();
    const source = tile(mine(), 'Skizze');
    fireEvent.pointerDown(source, { ...mouse, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(document, { ...mouse, clientX: 11, clientY: 10 });
    fireEvent.click(source);
    expect(store.getState().openSongId).toBe(skizze.id);
  });

  it('Nach dem Ziehen öffnet der folgende Klick den Song nicht', () => {
    const { store, aim } = setup();
    const source = tile(mine(), 'Skizze');
    drag(source, aim, mine()); // löst nach dem Loslassen den Klick aus, den der Browser schickt
    expect(store.getState().openSongId).toBeNull();
    fireEvent.click(source);
    expect(store.getState().openSongId).not.toBeNull();
  });

  it('Workbook-Kachel', () => {
    const { moveSong, uprising, store, aim } = setup();
    const band = screen.getByRole('region', { name: 'Band' });
    drag(tile(band, 'Uprising'), aim, entry('Proberaum'), false);
    expect(entry('Proberaum')).not.toHaveClass('drop-target');
    fireEvent.pointerUp(document, { ...mouse, clientX: 60, clientY: 80 });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(moveSong).not.toHaveBeenCalled();
    expect(store.getState().placement[uprising.id]).toBe('wb-Band');
  });

  it('Beim Sortieren ist „Meine Songs“ nicht hervorgehoben', () => {
    const { aim } = setup();
    drag(tile(mine(), 'Skizze'), aim, mine(), false);
    expect(mine()).not.toHaveClass('drop-target');
    fireEvent.keyDown(document, { key: 'Escape' });
  });

  it('Touch startet kein Ziehen', () => {
    const { aim } = setup();
    fireEvent.pointerDown(tile(mine(), 'Skizze'), { pointerType: 'touch', button: 0, clientX: 10, clientY: 10 });
    aim(entry('Proberaum'));
    fireEvent.pointerMove(document, { pointerType: 'touch', clientX: 60, clientY: 80 });
    expect(document.querySelector('.drag-tile')).not.toBeInTheDocument();
  });
});

describe('Spec workbook-sync › Song aus einem Workbook ziehen (UI)', () => {
  const band = () => screen.getByRole('region', { name: 'Band' });

  it('Nach „Meine Songs“ ziehen', async () => {
    const { moveSong, aim } = setup();
    drag(tile(band(), 'Uprising'), aim, within(mine()).getByText('Skizze'));
    await answer('Kopieren');
    expect(within(mine()).getByText('Uprising (Kopie)')).toBeInTheDocument();
    expect(within(band()).getByText('Uprising')).toBeInTheDocument();
    expect(moveSong).not.toHaveBeenCalled();
  });

  it('„Meine Songs“ als Ziel hervorgehoben, „+ Song“ nicht', () => {
    const { aim } = setup();
    drag(tile(band(), 'Uprising'), aim, within(mine()).getByRole('button', { name: '+ Song' }), false);
    expect(mine()).toHaveClass('drop-target');
    expect(within(mine()).getByRole('button', { name: '+ Song' })).not.toHaveClass('drop-target');
    expect(document.querySelector('.drag-tile')).toHaveTextContent('Uprising');
    fireEvent.keyDown(document, { key: 'Escape' });
  });

  it('Im eigenen Workbook loslassen', () => {
    const { store, aim } = setup();
    drag(tile(band(), 'Uprising'), aim, band(), false);
    expect(band()).not.toHaveClass('drop-target');
    expect(entry('Band')).not.toHaveClass('drop-target');
    fireEvent.pointerUp(document, { ...mouse, clientX: 60, clientY: 80 });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(store.getState().songs).toHaveLength(2);
  });

  it('Escape beim Ziehen', () => {
    const { store, aim } = setup();
    drag(tile(band(), 'Uprising'), aim, mine(), false);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.pointerUp(document, { ...mouse, clientX: 60, clientY: 80 });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(store.getState().songs).toHaveLength(2);
  });
});

describe('dropEffect (sort-songs, design.md D6)', () => {
  it('Wirkung aus Quelle und Ziel', () => {
    expect(dropEffect('mine', { kind: 'workbook', id: 'wb-Band' })).toBe('move');
    expect(dropEffect('mine', { kind: 'workbook', id: 'wb-Band', slot: 0 })).toBe('move');
    expect(dropEffect('mine', { kind: 'mine', slot: 0 })).toBe('reorder');
    expect(dropEffect('mine', { kind: 'mine' })).toBeNull();
    expect(dropEffect('wb-Band', { kind: 'mine', slot: 1 })).toBe('copy');
    expect(dropEffect('wb-Band', { kind: 'workbook', id: 'wb-Band', slot: 0 })).toBe('reorder');
    expect(dropEffect('wb-Band', { kind: 'workbook', id: 'wb-Band' })).toBeNull();
    expect(dropEffect('wb-Band', { kind: 'workbook', id: 'wb-Proberaum' })).toBeNull();
  });
});

describe('Spec song-order › Reihenfolge der Kacheln (UI)', () => {
  const band = () => screen.getByRole('region', { name: 'Band' });

  it('Noch nicht sortiert', () => {
    setup({ band: ['Hysteria'] });
    expect(shown(band())).toEqual(['Hysteria', 'Uprising', '+ Song']);
  });

  it('Nach Positionen, danach ohne Position nach Titel', () => {
    const { setOrder } = setup({ band: ['Hysteria', 'Outro'] });
    setOrder('wb-Band', { Uprising: 'a0', Outro: 'a1' });
    expect(shown(band())).toEqual(['Uprising', 'Outro', 'Hysteria', '+ Song']);
  });

  it('„Meine Songs“ nach den Positionen des eigenen Bestands', () => {
    const { setOrder } = setup({ mineTitles: ['Abend'] });
    expect(shown(mine())).toEqual(['Abend', 'Skizze', '+ Song']);
    setOrder('wb-mine', { Skizze: 'a0' });
    expect(shown(mine())).toEqual(['Skizze', 'Abend', '+ Song']);
  });
});

describe('Spec song-order › Sortieren durch Ziehen (UI)', () => {
  const band = () => screen.getByRole('region', { name: 'Band' });

  it('Im Workbook sortieren', () => {
    layoutTiles();
    const { reorder, uprising, aim } = setup({ band: ['Hysteria', 'Outro'] });
    drag(tile(band(), 'Uprising'), aim, band(), true, 5);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(reorder).toHaveBeenCalledWith('wb-Band', expect.objectContaining({ [uprising.id]: expect.any(String) }));
    expect(shown(band())).toEqual(['Uprising', 'Hysteria', 'Outro', '+ Song']);
  });

  it('In „Meine Songs“ sortieren, auch ohne gemeinsames Workbook', () => {
    layoutTiles();
    const { reorder, aim } = setup({ mineTitles: ['Abend'], shared: false });
    drag(tile(mine(), 'Abend'), aim, mine(), true, 500);
    expect(reorder).toHaveBeenCalledWith('wb-mine', expect.any(Object));
  });

  it('In „Meine Songs“ sortieren', () => {
    layoutTiles();
    const { reorder, aim } = setup({ mineTitles: ['Abend'] });
    drag(tile(mine(), 'Abend'), aim, mine(), true, 500);
    expect(reorder).toHaveBeenCalledWith('wb-mine', expect.any(Object));
    expect(shown(mine())).toEqual(['Skizze', 'Abend', '+ Song']);
  });

  it('Einfügemarke ohne Hervorhebung von Bereich und Eintrag', () => {
    layoutTiles();
    const { aim } = setup({ band: ['Hysteria', 'Outro'] });
    drag(tile(band(), 'Uprising'), aim, band(), false, 120);
    expect(tile(band(), 'Outro')).toHaveClass('drop-before');
    expect(tile(band(), 'Hysteria')).not.toHaveClass('drop-before');
    expect(band()).not.toHaveClass('drop-target');
    expect(entry('Band')).not.toHaveClass('drop-target');
    expect(shown(band())).toEqual(['Hysteria', 'Outro', 'Uprising', '+ Song']);
    fireEvent.pointerMove(document, { ...mouse, clientX: 500, clientY: 40 });
    expect(within(band()).getByRole('button', { name: '+ Song' })).toHaveClass('drop-before');
    fireEvent.keyDown(document, { key: 'Escape' });
  });

  it('Escape und Loslassen am eigenen Platz schreiben nichts', () => {
    layoutTiles();
    const { reorder, aim } = setup({ band: ['Hysteria'] });
    drag(tile(band(), 'Uprising'), aim, band(), false, 5);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.pointerUp(document, { ...mouse, clientX: 5, clientY: 40 });
    drag(tile(band(), 'Uprising'), aim, band(), true, 120);
    drag(tile(band(), 'Uprising'), aim, band(), true, 500);
    expect(reorder).not.toHaveBeenCalled();
  });
});

describe('Spec song-order › Position beim Ablegen in einem anderen Bereich (UI)', () => {
  const band = () => screen.getByRole('region', { name: 'Band' });

  it('In das gewählte Workbook ziehen', async () => {
    layoutTiles();
    const { moveSong, reorder, skizze, aim } = setup({ band: ['Hysteria'] });
    drag(tile(mine(), 'Skizze'), aim, band(), false, 120);
    expect(tile(band(), 'Uprising')).toHaveClass('drop-before');
    fireEvent.pointerUp(document, { ...mouse, clientX: 120, clientY: 40 });
    fireEvent.click(document.body);
    expect(reorder).not.toHaveBeenCalled();
    await answer('Verschieben');
    await waitFor(() => expect(reorder).toHaveBeenCalledWith('wb-Band', expect.objectContaining({ [skizze.id]: expect.any(String) })));
    expect(moveSong).toHaveBeenCalledWith(skizze.id, 'wb-Band');
    expect(shown(band())).toEqual(['Hysteria', 'Skizze', 'Uprising', '+ Song']);
  });

  it('Nach „Meine Songs“ kopieren', async () => {
    layoutTiles();
    const { reorder, aim } = setup({ mineTitles: ['Abend'] });
    drag(tile(band(), 'Uprising'), aim, mine(), true, 120);
    await answer('Kopieren');
    await waitFor(() => expect(reorder).toHaveBeenCalledWith('wb-mine', expect.any(Object)));
    expect(shown(mine())).toEqual(['Abend', 'Uprising (Kopie)', 'Skizze', '+ Song']);
  });

  it('Verschieben scheitert, Abbrechen und Eintrag der Seitenleiste setzen keine Position', async () => {
    layoutTiles();
    const failing = setup({ band: ['Hysteria'], moveResult: { ok: false, error: 'unreachable' } });
    drag(tile(mine(), 'Skizze'), failing.aim, band(), true, 120);
    await answer('Verschieben');
    await waitFor(() => expect(failing.moveSong).toHaveBeenCalled());
    drag(tile(mine(), 'Skizze'), failing.aim, band(), true, 120);
    await answer('Abbrechen');
    expect(failing.reorder).not.toHaveBeenCalled();
  });

  it('Eintrag der Seitenleiste setzt keine Position', async () => {
    layoutTiles();
    const { moveSong, reorder, aim } = setup({ band: ['Hysteria'] });
    drag(tile(mine(), 'Skizze'), aim, entry('Band'), true, 120);
    await answer('Verschieben');
    await waitFor(() => expect(moveSong).toHaveBeenCalled());
    expect(reorder).not.toHaveBeenCalled();
  });

  it('Menü und Symbol setzen keine Position', async () => {
    const { moveSong, reorder } = setup({ band: ['Hysteria'] });
    fireEvent.click(within(tile(mine(), 'Skizze')).getByRole('button', { name: 'Zu Workbook …' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Band' }));
    await answer('Verschieben');
    await waitFor(() => expect(moveSong).toHaveBeenCalled());
    fireEvent.click(within(tile(band(), 'Hysteria')).getByRole('button', { name: 'Kopieren' }));
    await answer('Kopieren');
    expect(within(mine()).getByText('Hysteria (Kopie)')).toBeInTheDocument();
    expect(reorder).not.toHaveBeenCalled();
  });
});
