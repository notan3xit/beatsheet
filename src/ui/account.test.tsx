import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AccountApi, AccountError } from '../account/api';
import { createNotebookStore } from '../state/notebookStore';
import { fakePlayer } from '../test/fakePlayer';
import { songWith } from '../test/songs';
import { App } from './App';

const fail = (error: AccountError) => ({ ok: false as const, error });

function fakeAccount(overrides: Partial<AccountApi> = {}): AccountApi {
  return {
    session: vi.fn(async () => null),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async (email: string) => ({ ok: true as const, email: email.trim().toLowerCase() })),
    logout: vi.fn(async () => ({ ok: true as const })),
    ...overrides,
  };
}

function setup(account: AccountApi = fakeAccount()) {
  const store = createNotebookStore([songWith({ title: 'Hysteria', bars: 2 })]);
  const user = userEvent.setup();
  render(<App store={store} player={fakePlayer().player} account={account} />);
  return { store, user, account };
}

const header = () => screen.getByRole('banner');
const form = () => screen.getByRole('form', { name: 'Anmelden' });

async function requestCodeFor(user: ReturnType<typeof userEvent.setup>, email: string) {
  await user.click(within(header()).getByRole('button', { name: 'Anmelden' }));
  await user.type(within(form()).getByLabelText('Mail-Adresse'), email);
  await user.click(within(form()).getByRole('button', { name: 'Code senden' }));
}

async function enterCode(user: ReturnType<typeof userEvent.setup>, code: string) {
  await user.type(within(form()).getByLabelText('Code'), code);
  await user.click(within(form()).getByRole('button', { name: 'Anmelden' }));
}

describe('Spec account-auth › Anmeldecode anfordern (UI)', () => {
  it('Code anfordern', async () => {
    const { user, account } = setup();
    await requestCodeFor(user, 'ich@example.com');
    expect(account.requestCode).toHaveBeenCalledWith('ich@example.com');
    expect(within(form()).getByLabelText('Code')).toBeInTheDocument();
    expect(form()).toHaveTextContent('ich@example.com');
  });

  it('Ungültige Adresse', async () => {
    const { user } = setup(fakeAccount({ requestCode: vi.fn(async () => fail('invalid-email')) }));
    await requestCodeFor(user, 'keine-adresse');
    expect(within(form()).getByRole('alert')).toHaveTextContent('Bitte gib eine gültige Mail-Adresse ein.');
    expect(within(form()).queryByLabelText('Code')).not.toBeInTheDocument();
  });
});

describe('Spec account-auth › Mit Code anmelden (UI)', () => {
  it('Erste Anmeldung', async () => {
    const { user, account } = setup();
    await requestCodeFor(user, 'ich@example.com');
    await enterCode(user, '012345');
    expect(account.verify).toHaveBeenCalledWith('ich@example.com', '012345');
    expect(header()).toHaveTextContent('ich@example.com');
    expect(within(header()).getByRole('button', { name: 'Abmelden' })).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Anmelden' })).not.toBeInTheDocument();
  });
});

describe('Spec account-auth › Falscher oder abgelaufener Code (UI)', () => {
  it('Falscher Code', async () => {
    const { user } = setup(fakeAccount({ verify: vi.fn(async () => fail('wrong-code')) }));
    await requestCodeFor(user, 'ich@example.com');
    await enterCode(user, '999999');
    expect(within(form()).getByRole('alert')).toHaveTextContent('Der Code stimmt nicht.');
    expect(within(header()).queryByRole('button', { name: 'Abmelden' })).not.toBeInTheDocument();
  });

  it('Abgelaufener Code', async () => {
    const { user } = setup(fakeAccount({ verify: vi.fn(async () => fail('expired')) }));
    await requestCodeFor(user, 'ich@example.com');
    await enterCode(user, '012345');
    expect(within(form()).getByRole('alert')).toHaveTextContent('Der Code ist abgelaufen. Bitte fordere einen neuen an.');
  });

  it('Zu viele Fehlversuche', async () => {
    const { user } = setup(fakeAccount({ verify: vi.fn(async () => fail('too-many-attempts')) }));
    await requestCodeFor(user, 'ich@example.com');
    await enterCode(user, '012345');
    expect(within(form()).getByRole('alert')).toHaveTextContent('Zu viele Fehlversuche. Bitte fordere einen neuen Code an.');
    expect(within(form()).getByRole('button', { name: 'Neuen Code anfordern' })).toBeInTheDocument();
  });
});

describe('Spec account-auth › Begrenzung der Code-Anforderungen (UI)', () => {
  it('Zweite Anforderung innerhalb von 30 Sekunden', async () => {
    const requestCode = vi.fn().mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce(fail('rate-limited'));
    const { user } = setup(fakeAccount({ requestCode }));
    await requestCodeFor(user, 'ich@example.com');
    await user.click(within(form()).getByRole('button', { name: 'Neuen Code anfordern' }));
    expect(within(form()).getByRole('alert')).toHaveTextContent('Bitte warte kurz, bevor du einen neuen Code anforderst.');
  });
});

describe('Spec account-auth › Sitzung (UI)', () => {
  it('Neuladen', async () => {
    setup(fakeAccount({ session: vi.fn(async () => 'ich@example.com') }));
    await waitFor(() => expect(header()).toHaveTextContent('ich@example.com'));
    expect(within(header()).getByRole('button', { name: 'Abmelden' })).toBeInTheDocument();
  });
});

describe('Spec account-auth › Abmelden (UI)', () => {
  it('Abmelden', async () => {
    const { user, store, account } = setup(fakeAccount({ session: vi.fn(async () => 'ich@example.com') }));
    const before = store.getState().songs;
    await user.click(await within(header()).findByRole('button', { name: 'Abmelden' }));
    expect(account.logout).toHaveBeenCalled();
    expect(within(header()).getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
    expect(header()).not.toHaveTextContent('ich@example.com');
    expect(store.getState().songs).toBe(before);
    expect(screen.getByRole('button', { name: 'Hysteria' })).toBeInTheDocument();
  });
});

describe('Spec account-auth › Nutzung ohne Anmeldung (UI)', () => {
  it('Server nicht erreichbar', async () => {
    const { user, store, account } = setup(fakeAccount({ session: vi.fn(async () => null) }));
    await waitFor(() => expect(account.session).toHaveBeenCalled());
    expect(within(header()).getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Titel des neuen Songs'), 'Neu');
    await user.click(screen.getByRole('button', { name: 'Song anlegen' }));
    expect(store.getState().songs.map((s) => s.title)).toContain('Neu');
  });

  it('Anmelden ohne Server', async () => {
    const { user } = setup(fakeAccount({ requestCode: vi.fn(async () => fail('unreachable')) }));
    await requestCodeFor(user, 'ich@example.com');
    expect(within(form()).getByRole('alert')).toHaveTextContent('Der Server ist nicht erreichbar.');
  });

  it('Abbrechen schließt das Formular', async () => {
    const { user } = setup();
    await user.click(within(header()).getByRole('button', { name: 'Anmelden' }));
    await user.click(within(form()).getByRole('button', { name: 'Abbrechen' }));
    expect(screen.queryByRole('form', { name: 'Anmelden' })).not.toBeInTheDocument();
  });
});
