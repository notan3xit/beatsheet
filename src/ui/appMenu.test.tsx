import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AccountApi } from '../account/api';
import { createAccountSession } from '../account/session';
import { serializeNotebook } from '../persistence/fileFormat';
import { createNotebookStore } from '../state/notebookStore';
import { fakePlayer } from '../test/fakePlayer';
import { songWith } from '../test/songs';
import { App } from './App';
import * as download from './download';

const ME = 'ich@example.com';

function setup(email: string | null = null) {
  const account: AccountApi = {
    session: vi.fn(async () => email),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async () => ({ ok: true as const, email: ME })),
    logout: vi.fn(async () => ({ ok: true as const })),
  };
  const session = createAccountSession(account);
  session.setEmail(email);
  const user = userEvent.setup();
  render(<App store={createNotebookStore([songWith({ title: 'Hysteria' })])} session={session} player={fakePlayer().player} />);
  return { user, account, session };
}

const menuButton = () => screen.getByRole('button', { name: 'Menü' });
const menu = () => screen.getByRole('menu');
const entries = () => within(menu()).getAllByRole('menuitem').map((item) => item.textContent);
const item = (name: string) => within(menu()).getByRole('menuitem', { name });
const expectClosed = () => expect(screen.queryByRole('menu')).not.toBeInTheDocument();

describe('Spec app-header › Menü', () => {
  it('Knopf mit Symbol und ohne Text, links vom Titel', () => {
    setup();
    expect(menuButton()).toHaveTextContent('');
    expect(menuButton()).toHaveAttribute('title', 'Menü');
    expect(menuButton().querySelector('svg')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: 'Beatsheet' });
    expect(menuButton().compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('Menü abgemeldet', async () => {
    const { user } = setup();
    expectClosed();
    await user.click(menuButton());
    expect(entries()).toEqual(['Exportieren', 'Importieren', 'Anmelden']);
  });

  it('Menü angemeldet', async () => {
    const { user } = setup(ME);
    await user.click(menuButton());
    expect(entries()).toEqual(['Exportieren', 'Importieren', 'Abmelden']);
  });

  it('Trennstrich', async () => {
    const { user } = setup();
    await user.click(menuButton());
    const separator = within(menu()).getByRole('separator');
    expect(item('Importieren').compareDocumentPosition(separator) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(separator.compareDocumentPosition(item('Anmelden')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('Jeder Eintrag hat ein Symbol', async () => {
    const { user } = setup();
    await user.click(menuButton());
    for (const entry of within(menu()).getAllByRole('menuitem')) expect(entry.querySelector('svg')).toBeInTheDocument();
  });
});

describe('Spec app-header › Menü schließen', () => {
  it('Klick außerhalb', async () => {
    const { user } = setup();
    await user.click(menuButton());
    await user.click(screen.getByRole('heading', { name: 'Beatsheet' }));
    expectClosed();
  });

  it('Escape', async () => {
    const { user } = setup();
    await user.click(menuButton());
    await user.keyboard('{Escape}');
    expectClosed();
  });
});

describe('Spec app-header › Export und Import über das Menü', () => {
  it('Exportieren', async () => {
    const save = vi.spyOn(download, 'downloadFile').mockImplementation(() => {});
    const { user } = setup();
    await user.click(menuButton());
    await user.click(item('Exportieren'));
    expect(save).toHaveBeenCalledTimes(1);
    expectClosed();
    save.mockRestore();
  });

  it('Importieren', async () => {
    const { user } = setup();
    const input = screen.getByLabelText<HTMLInputElement>('Importieren');
    const openPicker = vi.spyOn(input, 'click');
    await user.click(menuButton());
    await user.click(item('Importieren'));
    expect(openPicker).toHaveBeenCalledTimes(1);
    expectClosed();
    const content = serializeNotebook([songWith({ title: 'Aus der Datei' })], new Date());
    await user.upload(input, new File([content], 'songs.json', { type: 'application/json' }));
    expect(await screen.findByRole('dialog', { name: 'Songs importieren' })).toHaveTextContent('Aus der Datei');
    expectClosed();
  });
});

describe('Spec app-header › Anmelden und Abmelden über das Menü', () => {
  it('Anmelden im Menü', async () => {
    const { user } = setup();
    await user.click(menuButton());
    await user.click(item('Anmelden'));
    expect(within(screen.getByRole('dialog', { name: 'Anmelden' })).getByRole('form', { name: 'Anmelden' })).toBeInTheDocument();
    expectClosed();
  });

  it('Schritt bleibt über beide Wege', async () => {
    const { user } = setup();
    await user.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Anmelden' }));
    await user.type(screen.getByLabelText('Mail-Adresse'), ME);
    await user.click(screen.getByRole('button', { name: 'Code senden' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Anmelden' })).not.toBeInTheDocument();
    await user.click(menuButton());
    await user.click(item('Anmelden'));
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
  });

  it('Abmelden im Menü', async () => {
    const { user, account, session } = setup(ME);
    await user.click(menuButton());
    await user.click(item('Abmelden'));
    await waitFor(() => expect(session.getEmail()).toBeNull());
    expect(account.logout).toHaveBeenCalled();
    expectClosed();
  });
});
