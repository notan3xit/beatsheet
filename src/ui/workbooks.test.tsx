import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AccountApi } from '../account/api';
import { createAccountSession } from '../account/session';
import type { Song, Workbook } from '../domain/types';
import { parseNotebookFile, serializeNotebook } from '../persistence/fileFormat';
import { createNotebookStore, type NotebookStore } from '../state/notebookStore';
import type { SyncError } from '../sync/api';
import type { ActionResult, CreatedResult, Notice, WorkbookActions } from '../sync/sync';
import { fakePlayer } from '../test/fakePlayer';
import { songWith } from '../test/songs';
import { App } from './App';
import * as download from './download';

const ME = 'ich@example.com';
const ANNA = 'anna@example.com';
const ok: ActionResult = { ok: true };
const unreachable = { ok: false as const, error: 'unreachable' as const };

const workbook = (title: string, overrides: Partial<Workbook> = {}): Workbook => ({
  id: `wb-${title}`,
  title,
  owner: ME,
  members: [ME, ANNA],
  ...overrides,
});

function fakeSync(store: NotebookStore, overrides: Partial<WorkbookActions> = {}) {
  let notices: Notice[] = [];
  let offline = false;
  let outdated = false;
  const listeners = new Set<() => void>();
  const actions = {
    createWorkbook: vi.fn(async (title: string): Promise<CreatedResult> => {
      const created = workbook(title || 'Neues Workbook', { members: [ME] });
      store.setWorkbooks([...store.getState().workbooks, created]);
      return { ok: true, id: created.id };
    }),
    renameWorkbook: vi.fn(async (id: string, title: string) => {
      store.setWorkbooks(store.getState().workbooks.map((w) => (w.id === id ? { ...w, title } : w)));
      return ok;
    }),
    deleteWorkbook: vi.fn(async (id: string) => {
      store.setWorkbooks(store.getState().workbooks.filter((w) => w.id !== id));
      return ok;
    }),
    invite: vi.fn(async () => ok),
    removeMember: vi.fn(async () => ok),
    moveSong: vi.fn(async (songId: string, workbookId: string) => {
      store.place(songId, workbookId);
      return ok;
    }),
    createSongIn: vi.fn(async (workbookId: string): Promise<CreatedResult> => ({ ok: true, id: store.createSong('', workbookId).id })),
    reorder: vi.fn(),
    deleteSong: vi.fn(async (songId: string) => {
      store.deleteSong(songId);
      return ok;
    }),
    prepareLogout: vi.fn(async () => true),
    afterLogout: vi.fn(async () => {
      store.applyRemote([], Object.keys(store.getState().placement));
      store.setWorkbooks([]);
    }),
    getNotices: () => notices,
    isOffline: () => offline,
    isOutdated: () => outdated,
    reload: vi.fn(async () => {}),
    dismissNotice: vi.fn((id: number) => {
      notices = notices.filter((n) => n.id !== id);
      listeners.forEach((l) => l());
    }),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    ...overrides,
  };
  const addNotice = (text: string) => {
    notices = [...notices, { id: notices.length + 1, text }];
    listeners.forEach((l) => l());
  };
  const setOffline = (next: boolean) => {
    offline = next;
    listeners.forEach((l) => l());
  };
  const setOutdated = (next: boolean) => {
    outdated = next;
    listeners.forEach((l) => l());
  };
  return { actions, addNotice, setOffline, setOutdated };
}

function setup({
  songs = [] as Song[],
  workbooks = [] as Workbook[],
  placement = {} as Record<string, string>,
  email = ME as string | null,
  overrides = {} as Partial<WorkbookActions>,
  storagePersisted = true,
} = {}) {
  const store = createNotebookStore(songs, undefined, { placement, workbooks });
  const account: AccountApi = {
    session: vi.fn(async () => email),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async () => ({ ok: true as const, email: ME })),
    logout: vi.fn(async () => ({ ok: true as const })),
  };
  const session = createAccountSession(account);
  session.setEmail(email);
  const { actions: sync, addNotice, setOffline, setOutdated } = fakeSync(store, overrides);
  const user = userEvent.setup();
  render(<App store={store} session={session} sync={sync} player={fakePlayer().player} storagePersisted={storagePersisted} />);
  return { store, session, sync, user, account, addNotice, setOffline, setOutdated };
}

const card = (name: string) => screen.getByRole('region', { name });
const stack = () => document.querySelector<HTMLElement>('.app-notes')!;
const sidebar = () => screen.getByRole('navigation', { name: 'Workbooks' });
/** Titel der Workbooks in der Seitenleiste; leer ohne Bereich „Workbooks“. */
const workbookTitles = () =>
  screen.queryByRole('navigation', { name: 'Workbooks' })
    ? within(sidebar()).getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed')).map((b) => b.getAttribute('aria-label'))
    : [];
const entry = (title: string) => within(sidebar()).getByRole('button', { name: title });
const tileOf = (area: string, title: string) => within(card(area)).getByText(title).closest('article')!;
const membersOf = (title: string) => within(card(title)).getByRole('button', { name: 'Mitglieder' });
const popover = (title: string) => screen.getByRole('dialog', { name: `Mitglieder von ${title}` });

describe('Spec workbooks › Workbook anlegen (UI)', () => {
  it('Workbook anlegen', async () => {
    const { user, sync } = setup();
    await user.click(within(sidebar()).getByRole('button', { name: '+ Workbook' }));
    expect(sync.createWorkbook).toHaveBeenCalledWith('');
    expect(workbookTitles()).toEqual(['Neues Workbook']);
    expect(entry('Neues Workbook')).toHaveAttribute('aria-pressed', 'true');
    expect(entry('Neues Workbook')).toHaveAccessibleDescription('0 Songs · 1 Mitglied');
    await user.click(within(card('Neues Workbook')).getByRole('heading', { name: 'Neues Workbook' }));
    expect(screen.getByLabelText('Titel von Neues Workbook')).toBeInTheDocument();
  });

  it('Ohne Titel', async () => {
    const { user } = setup({ workbooks: [workbook('Band')] });
    await user.click(within(sidebar()).getByRole('button', { name: '+ Workbook' }));
    expect(workbookTitles()).toEqual(['Band', 'Neues Workbook']);
    expect(within(card('Neues Workbook')).getByRole('heading', { name: 'Neues Workbook' })).toBeInTheDocument();
  });

  it('Abgemeldet', () => {
    setup({ email: null });
    expect(workbookTitles()).toEqual([]);
    expect(screen.queryByRole('region', { name: 'Workbooks' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Workbook' })).not.toBeInTheDocument();
  });

  it('Fehler beim Anlegen', async () => {
    const { user } = setup({ overrides: { createWorkbook: vi.fn(async () => unreachable) } });
    await user.click(screen.getByRole('button', { name: '+ Workbook' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Der Server ist nicht erreichbar.');
  });
});

describe('Spec workbooks › Workbooks auf der Startseite (UI)', () => {
  it('Zwei Workbooks', () => {
    const skizze = songWith({ title: 'Skizze' });
    const intro = songWith({ title: 'Intro' });
    setup({ songs: [skizze, intro], workbooks: [workbook('Proberaum'), workbook('Band')], placement: { [intro.id]: 'wb-Band' } });
    expect(workbookTitles()).toEqual(['Band', 'Proberaum']);
    const regions = within(screen.getByRole('main', { name: 'Songs' })).getAllByRole('region').map((r) => r.getAttribute('aria-label'));
    expect(regions).toEqual(['Meine Songs', 'Workbooks', 'Band']);
    expect(within(card('Meine Songs')).getByText('Skizze')).toBeInTheDocument();
    expect(within(card('Band')).queryByText('Skizze')).not.toBeInTheDocument();
    expect(within(card('Band')).getByText('Intro')).toBeInTheDocument();
    expect(within(card('Meine Songs')).queryByText('Intro')).not.toBeInTheDocument();
  });

  it('Angaben in der Seitenleiste', () => {
    const songs = ['A', 'B', 'C'].map((title) => songWith({ title }));
    setup({ songs, workbooks: [workbook('Band')], placement: Object.fromEntries(songs.map((s) => [s.id, 'wb-Band'])) });
    expect(entry('Band')).toHaveAccessibleDescription('3 Songs · 2 Mitglieder');
  });

  it('Ohne Workbooks', () => {
    setup({ songs: [songWith({ title: 'Skizze' })] });
    expect(workbookTitles()).toEqual([]);
    expect(within(sidebar()).getByRole('button', { name: '+ Workbook' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Zu Workbook …' })).not.toBeInTheDocument();
  });

  it('Bereich zeigt Mitglieder und öffnet Songs', async () => {
    const intro = songWith({ title: 'Intro' });
    const { user, store } = setup({ songs: [intro], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' } });
    expect(membersOf('Band')).toHaveAttribute('title', `${ME}, ${ANNA}`);
    await user.click(within(card('Band')).getByText('Intro'));
    expect(store.getState().openSongId).toBe(intro.id);
  });

  it('Bekannte Workbooks erscheinen auch ohne Sitzung (Server nicht erreichbar)', () => {
    const intro = songWith({ title: 'Intro' });
    setup({ songs: [intro], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' }, email: null });
    expect(within(card('Band')).getByText('Intro')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Workbook' })).not.toBeInTheDocument();
  });
});

describe('Spec workbooks › Workbook wählen (UI)', () => {
  const two = () => {
    const intro = songWith({ title: 'Intro' });
    const probe = songWith({ title: 'Probe' });
    return setup({ songs: [intro, probe], workbooks: [workbook('Band'), workbook('Proberaum')], placement: { [intro.id]: 'wb-Band', [probe.id]: 'wb-Proberaum' } });
  };

  it('Wählen', async () => {
    const { user } = two();
    await user.click(entry('Proberaum'));
    expect(within(card('Proberaum')).getByText('Probe')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Band' })).not.toBeInTheDocument();
    expect(entry('Proberaum')).toHaveAttribute('aria-pressed', 'true');
    expect(entry('Band')).toHaveAttribute('aria-pressed', 'false');
  });

  it('Vorgabe', () => {
    two();
    expect(entry('Band')).toHaveAttribute('aria-pressed', 'true');
    expect(within(card('Band')).getByText('Intro')).toBeInTheDocument();
  });

  it('Rückkehr von einem Song', async () => {
    const { user } = two();
    await user.click(entry('Proberaum'));
    await user.click(within(card('Proberaum')).getByText('Probe'));
    await user.click(within(screen.getByRole('navigation', { name: 'Pfad' })).getByRole('button', { name: 'Songs' }));
    expect(entry('Proberaum')).toHaveAttribute('aria-pressed', 'true');
  });

  it('Gewähltes Workbook verschwindet', async () => {
    const { user, store } = two();
    await user.click(entry('Proberaum'));
    act(() => store.setWorkbooks(store.getState().workbooks.filter((w) => w.title !== 'Proberaum')));
    expect(entry('Band')).toHaveAttribute('aria-pressed', 'true');
    expect(card('Band')).toBeInTheDocument();
  });
});

describe('Spec workbooks › Workbook umbenennen (UI)', () => {
  it('Umbenennen', async () => {
    const { user, sync } = setup({ workbooks: [workbook('Band')] });
    await user.click(within(card('Band')).getByRole('heading', { name: 'Band' }));
    const input = screen.getByLabelText('Titel von Band');
    await user.clear(input);
    await user.type(input, 'Band 2026{Enter}');
    expect(sync.renameWorkbook).toHaveBeenCalledWith('wb-Band', 'Band 2026');
    expect(within(card('Band 2026')).getByRole('heading', { name: 'Band 2026' })).toBeInTheDocument();
  });

  it('Leerer Titel', async () => {
    const { user, sync } = setup({ workbooks: [workbook('Band')] });
    await user.click(within(card('Band')).getByRole('heading', { name: 'Band' }));
    await user.clear(screen.getByLabelText('Titel von Band'));
    await user.tab();
    expect(sync.renameWorkbook).not.toHaveBeenCalled();
    expect(within(card('Band')).getByRole('heading', { name: 'Band' })).toBeInTheDocument();
  });

  it('Mitglieder können nicht umbenennen', async () => {
    const { user } = setup({ workbooks: [workbook('Band', { owner: ANNA })] });
    await user.click(within(card('Band')).getByRole('heading', { name: 'Band' }));
    expect(screen.queryByLabelText('Titel von Band')).not.toBeInTheDocument();
  });
});

describe('Spec workbooks › Workbook löschen (UI)', () => {
  it('Leeres Workbook löschen', async () => {
    const { user, sync } = setup({ workbooks: [workbook('Band')] });
    await user.click(within(card('Band')).getByRole('button', { name: 'Workbook löschen' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('Band');
    await user.click(within(dialog).getByRole('button', { name: 'Bestätigen' }));
    expect(sync.deleteWorkbook).toHaveBeenCalledWith('wb-Band');
    expect(screen.queryByRole('region', { name: 'Band' })).not.toBeInTheDocument();
  });

  it('Löschen abgebrochen', async () => {
    const { user, sync } = setup({ workbooks: [workbook('Band')] });
    await user.click(within(card('Band')).getByRole('button', { name: 'Workbook löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    expect(sync.deleteWorkbook).not.toHaveBeenCalled();
  });

  it('Workbook mit Songs', () => {
    const intro = songWith({ title: 'Intro' });
    setup({ songs: [intro], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' } });
    expect(within(card('Band')).queryByRole('button', { name: 'Workbook löschen' })).not.toBeInTheDocument();
  });

  it('Nur der Besitzer kann löschen', () => {
    setup({ workbooks: [workbook('Band', { owner: ANNA })] });
    expect(within(card('Band')).queryByRole('button', { name: 'Workbook löschen' })).not.toBeInTheDocument();
  });
});

describe('Spec workbooks › Mitglied einladen (UI)', () => {
  async function inviteWith(result: ActionResult) {
    const ctx = setup({ workbooks: [workbook('Band')], overrides: { invite: vi.fn(async () => result) } });
    await ctx.user.click(membersOf('Band'));
    await ctx.user.type(within(popover('Band')).getByLabelText('Mail-Adresse'), 'ben@example.com');
    await ctx.user.click(within(popover('Band')).getByRole('button', { name: 'Einladen' }));
    return ctx;
  }

  it('Einladen', async () => {
    const { sync } = await inviteWith(ok);
    expect(sync.invite).toHaveBeenCalledWith('wb-Band', 'ben@example.com');
    expect(within(popover('Band')).getByLabelText('Mail-Adresse')).toHaveValue('');
    expect(within(popover('Band')).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Ungültige Adresse', async () => {
    await inviteWith({ ok: false, error: 'invalid-email' });
    expect(within(popover('Band')).getByRole('alert')).toHaveTextContent('Bitte gib eine gültige Mail-Adresse ein.');
    expect(within(popover('Band')).getByLabelText('Mail-Adresse')).toHaveValue('ben@example.com');
  });

  it('Bereits Mitglied', async () => {
    await inviteWith({ ok: false, error: 'already-member' });
    expect(within(popover('Band')).getByRole('alert')).toHaveTextContent('Diese Person ist bereits Mitglied.');
  });

  it('Einundzwanzigste Einladung', async () => {
    await inviteWith({ ok: false, error: 'rate-limited' });
    expect(within(popover('Band')).getByRole('alert')).toHaveTextContent('Bitte lade später erneut ein.');
  });

  it('Mitglieder sehen kein Einladen', async () => {
    const { user } = setup({ workbooks: [workbook('Band', { owner: ANNA })] });
    await user.click(membersOf('Band'));
    expect(within(popover('Band')).queryByLabelText('Mail-Adresse')).not.toBeInTheDocument();
  });
});

describe('Spec workbooks › Mitglieder-Popover (UI)', () => {
  it('Besitzer öffnet die Mitglieder', async () => {
    const { user } = setup({ workbooks: [workbook('Band')] });
    await user.click(membersOf('Band'));
    const members = within(popover('Band')).getByRole('region', { name: 'Mitglieder' });
    const add = within(popover('Band')).getByRole('region', { name: 'Hinzufügen' });
    expect(within(members).getByText(ANNA)).toBeInTheDocument();
    expect(within(add).getByLabelText('Mail-Adresse')).toBeInTheDocument();
    expect(within(members).queryByLabelText('Mail-Adresse')).not.toBeInTheDocument();
    expect(within(popover('Band')).getAllByRole('heading').map((h) => h.textContent)).toEqual(['Mitglieder', 'Hinzufügen']);
  });

  it('Mitglied öffnet die Mitglieder', async () => {
    const { user } = setup({ workbooks: [workbook('Band', { owner: ANNA })] });
    await user.click(membersOf('Band'));
    expect(within(popover('Band')).getAllByRole('heading').map((h) => h.textContent)).toEqual(['Mitglieder']);
    expect(within(popover('Band')).queryByRole('region', { name: 'Hinzufügen' })).not.toBeInTheDocument();
  });
});

describe('Spec workbooks › Mitglieder mit Profil (UI)', () => {
  const BEN = 'ben@example.com';
  const band = () =>
    workbook('Band', { members: [ME, ANNA, BEN], profiles: { [ME]: { name: 'Artjom', initials: 'AR', color: 'blue' }, [ANNA]: { name: 'Anna Berg', initials: 'AB', color: 'green' } } });
  const avatars = () => [...membersOf('Band').querySelectorAll<HTMLElement>('.avatar')];

  it('Kürzel in Farbe', () => {
    setup({ workbooks: [band()] });
    expect(avatars().map((a) => a.textContent)).toEqual(['AR', 'AB', 'BE']);
    expect(avatars()[1]).toHaveClass('colored');
    expect(avatars()[1]!.style.getPropertyValue('--pc')).toBe('var(--ctp-green)');
    expect(avatars()[2]).not.toHaveClass('colored');
    expect(membersOf('Band')).toHaveAttribute('title', `Artjom, Anna Berg, ${BEN}`);
  });

  it('Gespeichertes Kürzel statt Anfangsbuchstaben', () => {
    setup({ workbooks: [{ ...band(), profiles: { ...band().profiles, [ANNA]: { name: 'Anna Berg', initials: 'A', color: 'green' } } }] });
    expect(avatars()[1]).toHaveTextContent('A');
  });

  it('Mitgliederliste', async () => {
    const { user } = setup({ workbooks: [band()] });
    await user.click(membersOf('Band'));
    const list = within(popover('Band')).getByRole('region', { name: 'Mitglieder' });
    expect(within(list).getByText('Anna Berg')).toBeInTheDocument();
    expect(list).not.toHaveTextContent(ANNA);
    expect(within(list).getByRole('button', { name: `${ANNA} entfernen` })).toBeInTheDocument();
  });

  it('Noch nicht angemeldet', async () => {
    const { user } = setup({ workbooks: [band()] });
    await user.click(membersOf('Band'));
    const ben = within(popover('Band')).getByText(BEN).closest('li')!;
    expect(ben).toHaveTextContent('noch nicht angemeldet');
  });

  it('Neuer Name erscheint ohne Neuladen (Spec workbooks › Geänderte Profile erscheinen bei allen)', async () => {
    const { user, store } = setup({ workbooks: [band()] });
    await user.click(membersOf('Band'));
    act(() => store.setWorkbooks([{ ...band(), profiles: { ...band().profiles, [ANNA]: { name: 'Anna B.', initials: 'AB', color: 'green' } } }]));
    expect(within(popover('Band')).getByText('Anna B.')).toBeInTheDocument();
    expect(within(popover('Band')).queryByText('Anna Berg')).not.toBeInTheDocument();
  });
});

describe('Spec workbooks › Mitglied entfernen und austreten (UI)', () => {
  it('Entfernen nach Bestätigung', async () => {
    const { user, sync } = setup({ workbooks: [workbook('Band')] });
    await user.click(membersOf('Band'));
    await user.click(within(popover('Band')).getByRole('button', { name: `${ANNA} entfernen` }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(sync.removeMember).toHaveBeenCalledWith('wb-Band', ANNA);
  });

  it('Entfernen abgebrochen', async () => {
    const { user, sync } = setup({ workbooks: [workbook('Band')] });
    await user.click(membersOf('Band'));
    await user.click(within(popover('Band')).getByRole('button', { name: `${ANNA} entfernen` }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    expect(sync.removeMember).not.toHaveBeenCalled();
  });

  it('Verlassen nach Bestätigung', async () => {
    const { user, sync } = setup({ workbooks: [workbook('Band', { owner: ANNA, members: [ANNA, ME] })] });
    await user.click(membersOf('Band'));
    await user.click(within(popover('Band')).getByRole('button', { name: 'Workbook verlassen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(sync.removeMember).toHaveBeenCalledWith('wb-Band', ME);
  });

  it('Besitzer', async () => {
    const { user } = setup({ workbooks: [workbook('Band')] });
    await user.click(membersOf('Band'));
    expect(within(popover('Band')).queryByRole('button', { name: 'Workbook verlassen' })).not.toBeInTheDocument();
    expect(within(popover('Band')).queryByRole('button', { name: `${ME} entfernen` })).not.toBeInTheDocument();
  });

  it('Mitglieder können andere nicht entfernen', async () => {
    const { user } = setup({ workbooks: [workbook('Band', { owner: ANNA, members: [ANNA, ME] })] });
    await user.click(membersOf('Band'));
    expect(within(popover('Band')).queryByRole('button', { name: /entfernen/ })).not.toBeInTheDocument();
  });

  it('Escape schließt das Popover', async () => {
    const { user } = setup({ workbooks: [workbook('Band')] });
    await user.click(membersOf('Band'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Escape schließt das Popover auch mit dem Fokus außerhalb', async () => {
    const { user } = setup({ workbooks: [workbook('Band')] });
    await user.click(membersOf('Band'));
    within(card('Meine Songs')).getByRole('button', { name: '+ Song' }).focus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Klick außerhalb schließt das Popover', async () => {
    const { user } = setup({ workbooks: [workbook('Band')] });
    await user.click(membersOf('Band'));
    await user.click(screen.getByRole('heading', { name: 'Meine Songs' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Klick im Popover lässt es offen', async () => {
    const { user } = setup({ workbooks: [workbook('Band')] });
    await user.click(membersOf('Band'));
    await user.click(within(popover('Band')).getByLabelText('Mail-Adresse'));
    expect(popover('Band')).toBeInTheDocument();
  });

  it('Nachfrage aus dem Popover: Abbrechen und Escape lassen es offen', async () => {
    const { user } = setup({ workbooks: [workbook('Band')] });
    await user.click(membersOf('Band'));
    await user.click(within(popover('Band')).getByRole('button', { name: `${ANNA} entfernen` }));
    await user.keyboard('{Escape}');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    expect(popover('Band')).toBeInTheDocument();
  });

});

describe('Spec workbooks › Songs nach dem Austritt (UI)', () => {
  it('Hinweis nach dem Austritt lässt sich schließen', async () => {
    const { user, addNotice, sync } = setup();
    addNotice('Du bist nicht mehr Mitglied von „Band“. Die Songs liegen jetzt unter Meine Songs.');
    const notice = await screen.findByRole('status');
    expect(notice).toHaveTextContent('nicht mehr Mitglied von „Band“');
    await user.click(within(notice).getByRole('button', { name: 'Meldung schließen' }));
    expect(sync.dismissNotice).toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('Spec workbook-sync › Abgleich pausiert bei veralteter App (UI)', () => {
  it('Neue Version veröffentlicht', async () => {
    const { setOutdated, setOffline, sync, user } = setup();
    act(() => {
      setOffline(true);
      setOutdated(true);
    });
    const [note, ...others] = screen.getAllByRole('status');
    expect(others).toEqual([]);
    expect(within(note!).queryByRole('button', { name: 'Meldung schließen' })).not.toBeInTheDocument();
    await user.click(within(note!).getByRole('button', { name: 'Neu laden' }));
    expect(sync.reload).toHaveBeenCalledOnce();
  });
});

describe('Spec workbook-sync › Hinweis ohne Verbindung (UI)', () => {
  it('erscheint oben und verschwindet wieder', async () => {
    const { setOffline } = setup();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => setOffline(true));
    const note = screen.getByRole('status');
    expect(note).toHaveTextContent('Keine Verbindung zum Server');
    expect(note).toHaveTextContent('weiterarbeiten');
    expect(note).toHaveTextContent('übertragen');
    act(() => setOffline(false));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('Alle Hinweise stehen gestapelt zwischen Kopf und Inhalt', () => {
    const { setOffline, addNotice } = setup({ storagePersisted: false });
    act(() => {
      setOffline(true);
      addNotice('Du bist nicht mehr Mitglied von „Band“.');
    });
    const texts = ['dauerhaften Speicher', 'Keine Verbindung zum Server', 'nicht mehr Mitglied'];
    const stack = screen.getByText(new RegExp(texts[0]!)).parentElement!;
    for (const text of texts) expect(stack).toContainElement(screen.getByText(new RegExp(text)));
    // Das Seitenraster kennt genau drei Zeilen; jedes weitere Kind rutschte unter den Inhalt
    const page = stack.parentElement!;
    expect([...page.children]).toEqual([screen.getByRole('banner'), stack, screen.getByRole('main')]);
  });

  it('erscheint mit bekannten Workbooks auch ohne Sitzung', () => {
    const { setOffline } = setup({ email: null, workbooks: [workbook('Band')] });
    act(() => setOffline(true));
    expect(screen.getByRole('status')).toHaveTextContent('Keine Verbindung zum Server');
  });

  it('erscheint nicht ohne Sitzung und ohne Workbooks: Dann gibt es nichts abzugleichen', () => {
    const { setOffline } = setup({ email: null });
    act(() => setOffline(true));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('Spec workbook-sync › Song in ein Workbook verschieben (UI)', () => {
  const row = (title: string) => tileOf('Meine Songs', title);

  it('Verschieben, ohne den Song zu öffnen', async () => {
    const uprising = songWith({ title: 'Uprising' });
    const { user, sync, store } = setup({ songs: [uprising], workbooks: [workbook('Band')] });
    await user.click(within(row('Uprising')).getByRole('button', { name: 'Zu Workbook …' }));
    await user.click(screen.getByRole('menuitem', { name: 'Band' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Verschieben' }));
    expect(sync.moveSong).toHaveBeenCalledWith(uprising.id, 'wb-Band');
    expect(store.getState().openSongId).toBeNull();
    expect(within(card('Band')).getByText('Uprising')).toBeInTheDocument();
    expect(within(card('Meine Songs')).queryByText('Uprising')).not.toBeInTheDocument();
  });

  it('Server nicht erreichbar', async () => {
    const uprising = songWith({ title: 'Uprising' });
    const { user } = setup({ songs: [uprising], workbooks: [workbook('Band')], overrides: { moveSong: vi.fn(async () => unreachable) } });
    await user.click(within(row('Uprising')).getByRole('button', { name: 'Zu Workbook …' }));
    await user.click(screen.getByRole('menuitem', { name: 'Band' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Verschieben' }));
    expect(within(stack()).getByRole('alert')).toHaveTextContent('Der Server ist nicht erreichbar.');
    expect(within(card('Meine Songs')).getByText('Uprising')).toBeInTheDocument();
  });

  it('Verschieben abgebrochen', async () => {
    const uprising = songWith({ title: 'Uprising' });
    const { user, sync } = setup({ songs: [uprising], workbooks: [workbook('Band')] });
    await user.click(within(row('Uprising')).getByRole('button', { name: 'Zu Workbook …' }));
    await user.click(screen.getByRole('menuitem', { name: 'Band' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    await user.click(within(row('Uprising')).getByRole('button', { name: 'Zu Workbook …' }));
    await user.click(screen.getByRole('menuitem', { name: 'Band' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(sync.moveSong).not.toHaveBeenCalled();
    expect(within(card('Meine Songs')).getByText('Uprising')).toBeInTheDocument();
  });

  it('Das Menü schließt bei Klick außerhalb und mit Escape', async () => {
    const { user } = setup({ songs: [songWith({ title: 'Uprising' })], workbooks: [workbook('Band')] });
    await user.click(within(row('Uprising')).getByRole('button', { name: 'Zu Workbook …' }));
    await user.click(screen.getByRole('heading', { name: 'Meine Songs' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(within(row('Uprising')).getByRole('button', { name: 'Zu Workbook …' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('Nur angemeldet und mit Workbooks', () => {
    const songs = [songWith({ title: 'Uprising' })];
    setup({ songs });
    expect(screen.queryByRole('button', { name: 'Zu Workbook …' })).not.toBeInTheDocument();
  });

  it('Abgemeldet nicht', () => {
    setup({ songs: [songWith({ title: 'Uprising' })], workbooks: [workbook('Band')], email: null });
    expect(screen.queryByRole('button', { name: 'Zu Workbook …' })).not.toBeInTheDocument();
  });

  it('Workbook-Songs lassen sich nicht weiter verschieben', () => {
    const intro = songWith({ title: 'Intro' });
    setup({ songs: [intro], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' } });
    expect(screen.queryByRole('button', { name: 'Zu Workbook …' })).not.toBeInTheDocument();
  });
});

describe('Spec workbook-sync › Song in einem Workbook anlegen (UI)', () => {
  it('Anlegen in der Karte', async () => {
    const { user, sync, store } = setup({ workbooks: [workbook('Band')] });
    await user.click(within(card('Band')).getByRole('button', { name: '+ Song' }));
    expect(sync.createSongIn).toHaveBeenCalledWith('wb-Band');
    expect(screen.getByRole('heading', { level: 2, name: 'Neuer Song' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('navigation', { name: 'Pfad' })).getByRole('button', { name: 'Songs' }));
    expect(within(card('Band')).getByText('Neuer Song')).toBeInTheDocument();
    expect(store.getState().placement[store.getState().songs[0]!.id]).toBe('wb-Band');
  });

  it('Neuer Song eines anderen Mitglieds', () => {
    const { store } = setup({ workbooks: [workbook('Band')] });
    act(() => {
      store.createSong('Von Anna', 'wb-Band');
    });
    expect(within(card('Band')).getByText('Von Anna')).toBeInTheDocument();
    expect(entry('Band')).toHaveAccessibleDescription('1 Song · 2 Mitglieder');
  });

  it('Server nicht erreichbar', async () => {
    const { user } = setup({ workbooks: [workbook('Band')], overrides: { createSongIn: vi.fn(async () => unreachable) } });
    await user.click(within(card('Band')).getByRole('button', { name: '+ Song' }));
    expect(within(stack()).getByRole('alert')).toHaveTextContent('Der Server ist nicht erreichbar.');
    expect(within(card('Band')).queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Spec workbook-sync › Workbook-Song löschen (UI)', () => {
  async function openAndDelete(overrides: Partial<WorkbookActions> = {}) {
    const intro = songWith({ title: 'Intro' });
    const ctx = setup({ songs: [intro], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' }, overrides });
    await ctx.user.click(within(card('Band')).getByText('Intro'));
    await ctx.user.click(screen.getByRole('button', { name: 'Song löschen' }));
    return { ...ctx, intro };
  }

  it('Die Nachfrage nennt, dass der Song für alle Mitglieder gelöscht wird', async () => {
    const { user, sync, intro, store } = await openAndDelete();
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('für alle Mitglieder von „Band“');
    await user.click(within(dialog).getByRole('button', { name: 'Bestätigen' }));
    expect(sync.deleteSong).toHaveBeenCalledWith(intro.id);
    expect(store.getState().songs).toEqual([]);
  });

  it('Server nicht erreichbar: Der Song bleibt, die App meldet es', async () => {
    const { user, store } = await openAndDelete({ deleteSong: vi.fn(async () => unreachable) });
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Der Server ist nicht erreichbar.');
    expect(store.getState().songs).toHaveLength(1);
  });

  it('Lokale Songs löschen wie bisher, ohne den Server', async () => {
    const song = songWith({ title: 'Skizze' });
    const { user, sync, store } = setup({ songs: [song] });
    await user.click(within(card('Meine Songs')).getByText('Skizze'));
    await user.click(screen.getByRole('button', { name: 'Song löschen' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).not.toHaveTextContent('für alle Mitglieder');
    await user.click(within(dialog).getByRole('button', { name: 'Bestätigen' }));
    expect(sync.deleteSong).not.toHaveBeenCalled();
    expect(store.getState().songs).toEqual([]);
  });
});

describe('Spec library-persistence › Workbook-Songs im Import (UI)', () => {
  const fileOf = (songs: Song[]) => new File([serializeNotebook(songs, new Date())], 'backup.json', { type: 'application/json' });
  const entry = (dialog: HTMLElement, title: string) => within(dialog).getByRole('group', { name: title });

  async function importFile(ctx: ReturnType<typeof setup>, songs: Song[]) {
    await ctx.user.upload(screen.getByLabelText('Importieren'), fileOf(songs));
    return screen.findByRole('dialog', { name: 'Songs importieren' });
  }

  it('Workbook-Song ersetzen', async () => {
    const intro = songWith({ title: 'Intro' });
    const ctx = setup({ songs: [intro], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' } });
    const dialog = await importFile(ctx, [{ ...intro, tempo: 77, revision: 9 }]);
    expect(within(entry(dialog, 'Intro')).getByRole('radio', { name: 'Ersetzen' })).toBeChecked();
    expect(entry(dialog, 'Intro')).toHaveTextContent('betrifft alle Mitglieder von „Band“');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Importieren' }));
    expect(ctx.store.getState().songs[0]!.tempo).toBe(77);
    expect(ctx.store.getState().placement[intro.id]).toBe('wb-Band');
  });

  it('Der Hinweis erscheint nur bei „Ersetzen“', async () => {
    const intro = songWith({ title: 'Intro' });
    const ctx = setup({ songs: [intro], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' } });
    const dialog = await importFile(ctx, [{ ...intro, tempo: 77, revision: 9 }]);
    await ctx.user.click(within(entry(dialog, 'Intro')).getByRole('radio', { name: 'Als Kopie' }));
    expect(entry(dialog, 'Intro')).not.toHaveTextContent('betrifft alle Mitglieder');
  });

  it('Kein Hinweis bei lokalen Songs', async () => {
    const song = songWith({ title: 'Skizze' });
    const ctx = setup({ songs: [song] });
    const dialog = await importFile(ctx, [{ ...song, tempo: 77, revision: 9 }]);
    expect(entry(dialog, 'Skizze')).not.toHaveTextContent('betrifft alle Mitglieder');
  });

  it('Workbook-Song als Kopie', async () => {
    const intro = songWith({ title: 'Intro' });
    const ctx = setup({ songs: [intro], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' } });
    const dialog = await importFile(ctx, [{ ...intro, tempo: 77, revision: 9 }]);
    await ctx.user.click(within(entry(dialog, 'Intro')).getByRole('radio', { name: 'Als Kopie' }));
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Importieren' }));
    expect(within(card('Meine Songs')).getByText('Intro (Kopie)')).toBeInTheDocument();
    expect(ctx.store.getState().songs.find((s) => s.id === intro.id)!.tempo).toBe(intro.tempo);
  });

  it('Export', async () => {
    const save = vi.spyOn(download, 'downloadFile').mockImplementation(() => {});
    const intro = songWith({ title: 'Intro' });
    const { user } = setup({ songs: [intro], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' } });
    await user.click(screen.getByRole('button', { name: 'Menü' }));
    await user.click(screen.getByRole('menuitem', { name: 'Exportieren' }));
    const parsed = parseNotebookFile(save.mock.calls[0]![1]);
    expect(parsed.ok && parsed.songs.map((s) => s.title)).toEqual(['Intro']);
    save.mockRestore();
  });
});

describe('Spec song-library › Song kopieren (UI)', () => {
  const copyIn = (area: string, title: string) => within(tileOf(area, title)).getByRole('button', { name: 'Kopieren' });
  const dialog = () => screen.getByRole('alertdialog');
  const titles = (area: string) => within(card(area)).queryAllByRole('article').map((t) => within(t).getByRole('heading').textContent);

  function withBand() {
    const skizze = songWith({ title: 'Skizze' });
    const uprising = songWith({ title: 'Uprising' });
    return { skizze, uprising, ...setup({ songs: [skizze, uprising], workbooks: [workbook('Band')], placement: { [uprising.id]: 'wb-Band' } }) };
  }

  it('Eigenen Song kopieren', async () => {
    const { user, store } = withBand();
    await user.click(copyIn('Meine Songs', 'Skizze'));
    await user.click(within(dialog()).getByRole('button', { name: 'Kopieren' }));
    expect(titles('Meine Songs')).toEqual(['Skizze', 'Skizze (Kopie)']);
    expect(store.getState().openSongId).toBeNull();
  });

  it('Song aus einem Workbook kopieren', async () => {
    const { user, sync } = withBand();
    await user.click(copyIn('Band', 'Uprising'));
    await user.click(within(dialog()).getByRole('button', { name: 'Kopieren' }));
    expect(titles('Meine Songs')).toEqual(['Skizze', 'Uprising (Kopie)']);
    expect(titles('Band')).toEqual(['Uprising']);
    expect(sync.moveSong).not.toHaveBeenCalled();
  });

  it('Kopieren abgebrochen', async () => {
    const { user } = withBand();
    await user.click(copyIn('Band', 'Uprising'));
    await user.click(within(dialog()).getByRole('button', { name: 'Abbrechen' }));
    await user.click(copyIn('Meine Songs', 'Skizze'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(titles('Meine Songs')).toEqual(['Skizze']);
  });

  it('Rückfragen für Workbook-Songs und eigene Songs unterscheiden sich', async () => {
    const { user } = withBand();
    await user.click(copyIn('Band', 'Uprising'));
    const fromWorkbook = dialog().textContent;
    await user.click(within(dialog()).getByRole('button', { name: 'Abbrechen' }));
    await user.click(copyIn('Meine Songs', 'Skizze'));
    expect(dialog().textContent?.replace('Skizze', 'Uprising')).not.toBe(fromWorkbook);
  });
});

describe('Spec account-songs › „Meine Songs“ im Account (UI)', () => {
  const personal: Workbook = { id: 'wb-me', title: 'Meine Songs', owner: ME, members: [ME], personal: true };
  const placed = (title: string) => {
    const song = songWith({ title });
    return { song, placement: { [song.id]: personal.id } };
  };
  const row = (title: string) => tileOf('Meine Songs', title);

  it('Der eigene Bestand erscheint nicht in der Seitenleiste, seine Songs stehen in „Meine Songs“', () => {
    const { song, placement } = placed('Skizze');
    setup({ songs: [song], workbooks: [personal, workbook('Band')], placement });
    expect(workbookTitles()).toEqual(['Band']);
    expect(within(card('Meine Songs')).getByText('Skizze')).toBeInTheDocument();
  });

  it('„Zu Workbook …“ nennt den eigenen Bestand nicht', async () => {
    const { song, placement } = placed('Skizze');
    const { user, sync } = setup({ songs: [song], workbooks: [personal, workbook('Band')], placement });
    await user.click(within(row('Skizze')).getByRole('button', { name: 'Zu Workbook …' }));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Band']);
    await user.click(screen.getByRole('menuitem', { name: 'Band' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Verschieben' }));
    expect(sync.moveSong).toHaveBeenCalledWith(song.id, 'wb-Band');
  });

  it('Ohne Workbooks', () => {
    const { song, placement } = placed('Skizze');
    setup({ songs: [song], workbooks: [personal], placement });
    expect(workbookTitles()).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Zu Workbook …' })).not.toBeInTheDocument();
  });

  it('Löschen: Die Nachfrage nennt keine Mitglieder, der Sync übernimmt', async () => {
    const { song, placement } = placed('Skizze');
    const { user, sync } = setup({ songs: [song], workbooks: [personal], placement });
    await user.click(within(card('Meine Songs')).getByText('Skizze'));
    await user.click(screen.getByRole('button', { name: 'Song löschen' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).not.toHaveTextContent('Mitglieder');
    await user.click(within(dialog).getByRole('button', { name: 'Bestätigen' }));
    expect(sync.deleteSong).toHaveBeenCalledWith(song.id);
  });

  it('Import: Ersetzen eines eigenen Songs nennt keine Mitglieder', async () => {
    const { song, placement } = placed('Skizze');
    const ctx = setup({ songs: [song], workbooks: [personal], placement });
    const file = new File([serializeNotebook([{ ...song, tempo: 77, revision: 9 }], new Date())], 'backup.json', { type: 'application/json' });
    await ctx.user.upload(screen.getByLabelText('Importieren'), file);
    const dialog = await screen.findByRole('dialog', { name: 'Songs importieren' });
    expect(within(dialog).getByRole('radio', { name: 'Ersetzen' })).toBeChecked();
    expect(dialog).not.toHaveTextContent('betrifft alle Mitglieder');
  });

  it('Hinweis nach der Übernahme', async () => {
    const { addNotice } = setup();
    act(() => addNotice('2 Songs wurden in deinen Account übernommen.'));
    expect(screen.getByRole('status')).toHaveTextContent('2 Songs wurden in deinen Account übernommen.');
  });

  it('Ein noch nicht hochgeladener Song lässt sich ohne Sync löschen', async () => {
    const song = songWith({ title: 'Neu' });
    const { user, sync, store } = setup({ songs: [song], workbooks: [personal] });
    await user.click(within(card('Meine Songs')).getByText('Neu'));
    await user.click(screen.getByRole('button', { name: 'Song löschen' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(sync.deleteSong).not.toHaveBeenCalled();
    expect(store.getState().songs).toEqual([]);
  });
});

describe('Spec library-persistence › Dauerhaften Speicher anfordern (UI)', () => {
  const note = () => screen.getByRole('note');

  it('Speicher nicht dauerhaft: abgemeldet mit Verweis auf den Export', () => {
    setup({ email: null, storagePersisted: false });
    expect(note()).toHaveTextContent('gelöscht werden');
    expect(note()).toHaveTextContent('Exportieren');
    expect(note()).toHaveTextContent('im Menü');
  });

  it('Speicher nicht dauerhaft, angemeldet: nennt Account und nicht übertragene Änderungen', () => {
    setup({ storagePersisted: false });
    expect(note()).toHaveTextContent('dauerhaften Speicher');
    expect(note()).toHaveTextContent('im Account');
    expect(note()).toHaveTextContent('nicht übertragene Änderungen');
    expect(note()).not.toHaveTextContent('Exportieren');
  });

  it('Der Hinweis wechselt mit der Anmeldung', () => {
    const { session } = setup({ email: null, storagePersisted: false });
    act(() => session.setEmail(ME));
    expect(note()).toHaveTextContent('im Account');
    act(() => session.setEmail(null));
    expect(note()).toHaveTextContent('Exportieren');
  });

  it('Ohne Abgleich gilt der Hinweis für lokale Daten, auch angemeldet', () => {
    const session = createAccountSession({
      session: vi.fn(async () => ME),
      requestCode: vi.fn(async () => ({ ok: true as const })),
      verify: vi.fn(async () => ({ ok: true as const, email: ME })),
      logout: vi.fn(async () => ({ ok: true as const })),
    });
    session.setEmail(ME);
    render(<App store={createNotebookStore()} session={session} player={fakePlayer().player} storagePersisted={false} />);
    expect(note()).toHaveTextContent('Exportieren');
  });
});

describe('Spec app-messages › Meldungen gesammelt oben (UI)', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/ui/styles.css'), 'utf8');
  const rule = (selector: string) => new RegExp(`\\n${selector.replace(/[.>]/g, (c) => `\\${c}`)} \\{([^}]*)\\}`).exec(css)?.[1] ?? '';

  it('Fehler einer Aktion in einer Karte; ein erfolgreicher neuer Versuch entfernt ihn', async () => {
    const createSongIn = vi.fn<() => Promise<CreatedResult>>().mockResolvedValueOnce(unreachable).mockResolvedValue({ ok: true, id: 'neu' });
    const { user } = setup({ workbooks: [workbook('Band')], overrides: { createSongIn } });
    await user.click(within(card('Band')).getByRole('button', { name: '+ Song' }));
    const alert = within(stack()).getByRole('alert');
    expect(alert).toHaveTextContent('Der Server ist nicht erreichbar.');
    expect(within(card('Band')).queryByRole('alert')).not.toBeInTheDocument();
    await user.click(within(card('Band')).getByRole('button', { name: '+ Song' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Wiederholtes Scheitern derselben Stelle stapelt nicht', async () => {
    const { user } = setup({ workbooks: [workbook('Band')], overrides: { createSongIn: vi.fn(async () => unreachable) } });
    await user.click(within(card('Band')).getByRole('button', { name: '+ Song' }));
    await user.click(within(card('Band')).getByRole('button', { name: '+ Song' }));
    expect(within(stack()).getAllByRole('alert')).toHaveLength(1);
  });

  it('Mehrere Stellen stapeln sich; jede Meldung lässt sich einzeln schließen', async () => {
    const { user, addNotice } = setup({ workbooks: [workbook('Band')], overrides: { createSongIn: vi.fn(async () => unreachable), createWorkbook: vi.fn(async () => unreachable) } });
    act(() => addNotice('Hinweis'));
    await user.click(within(card('Band')).getByRole('button', { name: '+ Song' }));
    await user.click(screen.getByRole('button', { name: '+ Workbook' }));
    expect(within(stack()).getAllByRole('alert')).toHaveLength(2);
    expect(within(stack()).getAllByRole('status')).toHaveLength(1);
    await user.click(within(within(stack()).getAllByRole('alert')[0]!).getByRole('button', { name: 'Meldung schließen' }));
    expect(within(stack()).getAllByRole('alert')).toHaveLength(1);
  });

  it('Ergebnis des Imports', async () => {
    const { user } = setup();
    const file = new File([serializeNotebook([songWith({ title: 'Neu' })], new Date())], 'backup.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Importieren'), file);
    await user.click(within(await screen.findByRole('dialog', { name: 'Songs importieren' })).getByRole('button', { name: 'Importieren' }));
    const status = within(stack()).getByRole('status');
    expect(status).toHaveTextContent('1 hinzugefügt');
    expect(within(screen.getByRole('banner')).queryByRole('status')).not.toBeInTheDocument();
    await user.click(within(status).getByRole('button', { name: 'Meldung schließen' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('Fehler beim Abmelden und beim Löschen stehen im Stapel', async () => {
    const intro = songWith({ title: 'Intro' });
    const ctx = setup({ songs: [intro], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' }, overrides: { deleteSong: vi.fn(async () => unreachable) } });
    await ctx.user.click(within(card('Band')).getByText('Intro'));
    await ctx.user.click(screen.getByRole('button', { name: 'Song löschen' }));
    await ctx.user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    expect(within(stack()).getByRole('alert')).toHaveTextContent('Der Server ist nicht erreichbar.');
    vi.mocked(ctx.account.logout).mockResolvedValue({ ok: false, error: 'unreachable' });
    const appHeader = document.querySelector<HTMLElement>('.app-header')!;
    await ctx.user.click(within(appHeader).getByRole('button', { name: /^Konto/ }));
    await ctx.user.click(within(appHeader).getByRole('button', { name: 'Abmelden' }));
    await waitFor(() => expect(within(stack()).getAllByRole('alert')).toHaveLength(2));
    expect(within(appHeader).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Hinweise zu einem Zustand lassen sich nicht schließen', () => {
    const { setOffline } = setup({ storagePersisted: false });
    act(() => setOffline(true));
    expect(within(stack()).getByRole('note')).toBeInTheDocument();
    expect(within(stack()).getByRole('status')).toHaveTextContent('Keine Verbindung');
    expect(within(stack()).queryByRole('button', { name: 'Meldung schließen' })).not.toBeInTheDocument();
  });

  it('Eingabefehler bleiben am Formular', async () => {
    const { user } = setup({ workbooks: [workbook('Band')], overrides: { invite: vi.fn(async (): Promise<ActionResult> => ({ ok: false, error: 'invalid-email' })) } });
    await user.click(membersOf('Band'));
    await user.click(within(popover('Band')).getByRole('button', { name: 'Einladen' }));
    expect(within(popover('Band')).getByRole('alert')).toBeInTheDocument();
    expect(within(stack()).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Der Stapel klebt oben, das Kreuz steht rechts, und die Seite erlaubt das Kleben', () => {
    expect(rule('.app-notes')).toMatch(/position: sticky/);
    expect(rule('.app-notes')).toMatch(/top: 0/);
    expect(rule('.app-notes > .message > span')).toMatch(/flex: 1/);
    expect(rule('.app')).toMatch(/display: flex/);
  });
});

describe('Spec server-limits › Meldungen (UI)', () => {
  const fail = (error: SyncError) => ({ ok: false as const, error });

  it('Zu viele Workbooks', async () => {
    const { user } = setup({ overrides: { createWorkbook: vi.fn(async () => fail('too-many-workbooks')) } });
    await user.click(screen.getByRole('button', { name: '+ Workbook' }));
    expect(within(stack()).getByRole('alert')).toHaveTextContent('Du hast die Höchstzahl an Workbooks erreicht.');
  });

  it('Zu viele Mitglieder: am Formular', async () => {
    const { user } = setup({ workbooks: [workbook('Band')], overrides: { invite: vi.fn(async () => fail('too-many-members')) } });
    await user.click(membersOf('Band'));
    await user.click(within(popover('Band')).getByRole('button', { name: 'Einladen' }));
    expect(within(popover('Band')).getByRole('alert')).toHaveTextContent('Dieses Workbook hat die Höchstzahl an Mitgliedern erreicht.');
  });

  it('Verschieben in ein volles Workbook', async () => {
    const song = songWith({ title: 'Eigen' });
    const { user } = setup({ songs: [song], workbooks: [workbook('Band')], overrides: { moveSong: vi.fn(async () => fail('quota-exceeded')) } });
    await user.click(within(tileOf('Meine Songs', 'Eigen')).getByRole('button', { name: 'Zu Workbook …' }));
    await user.click(screen.getByRole('menuitem', { name: 'Band' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Verschieben' }));
    expect(within(stack()).getByRole('alert')).toHaveTextContent('Der Speicher dieses Workbooks ist voll.');
    expect(within(card('Meine Songs')).getByText('Eigen')).toBeInTheDocument();
  });

  it('Der Server ist voll', async () => {
    const { user } = setup({ workbooks: [workbook('Band')], overrides: { createSongIn: vi.fn(async () => fail('server-full')) } });
    await user.click(within(card('Band')).getByRole('button', { name: '+ Song' }));
    expect(within(stack()).getByRole('alert')).toHaveTextContent('Der Server ist voll.');
  });
});

describe('Spec workbook-sync › Abmelden mit Workbook-Songs (UI)', () => {
  const accountButton = () => within(screen.getByRole('banner')).getByRole('button', { name: /^Konto/ });
  const logout = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(accountButton());
    await user.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Abmelden' }));
  };
  const placedSetup = (overrides: Partial<WorkbookActions> = {}) => {
    const intro = songWith({ title: 'Intro' });
    const skizze = songWith({ title: 'Skizze' });
    return setup({ songs: [intro, skizze], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' }, overrides });
  };

  it('Abmelden', async () => {
    const { user, sync, account, store } = placedSetup();
    await logout(user);
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Workbooks' })).not.toBeInTheDocument());
    expect(sync.prepareLogout).toHaveBeenCalled();
    expect(account.logout).toHaveBeenCalled();
    expect(sync.afterLogout).toHaveBeenCalled();
    expect(store.getState().songs.map((s) => s.title)).toEqual(['Skizze']);
    expect(within(screen.getByRole('banner')).getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
  });

  it('Abmelden mit nicht übertragenen Änderungen: Ablehnen lässt angemeldet', async () => {
    const { user, sync, account } = placedSetup({ prepareLogout: vi.fn(async () => false) });
    await logout(user);
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('nicht übertragen');
    expect(dialog).toHaveTextContent('verloren');
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
    expect(account.logout).not.toHaveBeenCalled();
    expect(sync.afterLogout).not.toHaveBeenCalled();
    expect(workbookTitles()).toEqual(['Band']);
    expect(accountButton()).toBeInTheDocument();
  });

  it('Abmelden mit nicht übertragenen Änderungen: Bestätigen meldet ab', async () => {
    const { user, account, sync } = placedSetup({ prepareLogout: vi.fn(async () => false) });
    await logout(user);
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Bestätigen' }));
    await waitFor(() => expect(sync.afterLogout).toHaveBeenCalled());
    expect(account.logout).toHaveBeenCalled();
  });

  it('Abmelden im Menü mit nicht übertragenen Änderungen (app-header)', async () => {
    const { user, account } = placedSetup({ prepareLogout: vi.fn(async () => false) });
    await user.click(screen.getByRole('button', { name: 'Menü' }));
    await user.click(screen.getByRole('menuitem', { name: 'Abmelden' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Abbrechen' }));
    expect(account.logout).not.toHaveBeenCalled();
    expect(accountButton()).toBeInTheDocument();
  });

  it('Schlägt das Abmelden am Server fehl, bleiben die Songs', async () => {
    const intro = songWith({ title: 'Intro' });
    const ctx = setup({ songs: [intro], workbooks: [workbook('Band')], placement: { [intro.id]: 'wb-Band' } });
    vi.mocked(ctx.account.logout).mockResolvedValue({ ok: false, error: 'unreachable' });
    await logout(ctx.user);
    expect(await screen.findByRole('alert')).toHaveTextContent('Der Server ist nicht erreichbar.');
    expect(ctx.sync.afterLogout).not.toHaveBeenCalled();
    expect(workbookTitles()).toEqual(['Band']);
  });
});
