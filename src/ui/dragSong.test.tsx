import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AccountApi } from '../account/api';
import { createAccountSession } from '../account/session';
import type { Workbook } from '../domain/types';
import { createNotebookStore } from '../state/notebookStore';
import type { ActionResult, WorkbookActions } from '../sync/sync';
import { fakePlayer } from '../test/fakePlayer';
import { songWith } from '../test/songs';
import { App } from './App';

const ME = 'ich@example.com';
const workbook = (title: string): Workbook => ({ id: `wb-${title}`, title, owner: ME, members: [ME] });
const noNotices: never[] = [];
const mouse = { pointerType: 'mouse', button: 0, pointerId: 1 } as const;

function setup() {
  const skizze = songWith({ title: 'Skizze' });
  const uprising = songWith({ title: 'Uprising' });
  const store = createNotebookStore([skizze, uprising], undefined, {
    workbooks: [workbook('Band'), workbook('Proberaum')],
    placement: { [uprising.id]: 'wb-Band' },
  });
  const moveSong = vi.fn(async (songId: string, workbookId: string): Promise<ActionResult> => {
    store.place(songId, workbookId);
    return { ok: true };
  });
  const sync = {
    moveSong,
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
    subscribe: () => () => {},
  } as unknown as WorkbookActions;
  const account: AccountApi = {
    session: vi.fn(async () => ME),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async () => ({ ok: true as const, email: ME })),
    logout: vi.fn(async () => ({ ok: true as const })),
  };
  const session = createAccountSession(account);
  session.setEmail(ME);
  let hit: Element | null = null;
  render(<App store={store} session={session} sync={sync} player={fakePlayer().player} hitTest={() => hit} />);
  return { store, moveSong, skizze, uprising, aim: (target: Element | null) => (hit = target) };
}

const mine = () => screen.getByRole('region', { name: 'Meine Songs' });
const tile = (area: HTMLElement, title: string) => within(area).getByText(title).closest('article')!;
const entry = (title: string) => within(screen.getByRole('navigation', { name: 'Workbooks' })).getByRole('button', { name: title });

/** Zieht von der Kachel über das Ziel; ohne `release` bleibt das Ziehen offen. */
function drag(source: Element, aim: (t: Element | null) => void, target: Element | null, release = true) {
  fireEvent.pointerDown(source, { ...mouse, clientX: 10, clientY: 10 });
  aim(target);
  fireEvent.pointerMove(document, { ...mouse, clientX: 60, clientY: 80 });
  if (release) {
    fireEvent.pointerUp(document, { ...mouse, clientX: 60, clientY: 80 });
    fireEvent.click(document.elementFromPoint?.(60, 80) ?? source);
  }
}

describe('Spec workbook-sync › Song in ein Workbook ziehen (UI)', () => {
  it('Auf einen Eintrag ziehen', async () => {
    const { moveSong, skizze, aim } = setup();
    drag(tile(mine(), 'Skizze'), aim, entry('Proberaum'));
    await waitFor(() => expect(moveSong).toHaveBeenCalledWith(skizze.id, 'wb-Proberaum'));
    expect(within(mine()).queryByText('Skizze')).not.toBeInTheDocument();
  });

  it('In das gewählte Workbook ziehen', async () => {
    const { moveSong, skizze, aim } = setup();
    const band = screen.getByRole('region', { name: 'Band' });
    drag(tile(mine(), 'Skizze'), aim, within(band).getByText('Uprising'));
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

  it('Abbrechen: Loslassen über „Meine Songs“', async () => {
    const { moveSong, aim } = setup();
    drag(tile(mine(), 'Skizze'), aim, mine());
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
    const { moveSong, aim } = setup();
    const band = screen.getByRole('region', { name: 'Band' });
    drag(tile(band, 'Uprising'), aim, entry('Proberaum'), false);
    expect(document.querySelector('.drag-tile')).not.toBeInTheDocument();
    fireEvent.pointerUp(document, { ...mouse, clientX: 60, clientY: 80 });
    expect(moveSong).not.toHaveBeenCalled();
  });

  it('Touch startet kein Ziehen', () => {
    const { aim } = setup();
    fireEvent.pointerDown(tile(mine(), 'Skizze'), { pointerType: 'touch', button: 0, clientX: 10, clientY: 10 });
    aim(entry('Proberaum'));
    fireEvent.pointerMove(document, { pointerType: 'touch', clientX: 60, clientY: 80 });
    expect(document.querySelector('.drag-tile')).not.toBeInTheDocument();
  });
});
