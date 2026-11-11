import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AccountApi, AccountError } from '../account/api';
import { createNotebookStore } from '../state/notebookStore';
import { fakePlayer } from '../test/fakePlayer';
import { songWith } from '../test/songs';
import { App } from './App';
import { signedInAs } from '../test/accounts';

const fail = (error: AccountError) => ({ ok: false as const, error });

function fakeAccount(overrides: Partial<AccountApi> = {}): AccountApi {
  return {
    session: vi.fn(async () => null),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async (email: string) => ({ ok: true as const, ...signedInAs(email.trim().toLowerCase()) })),
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
const accountButton = (email = 'ich@example.com') => within(header()).getByRole('button', { name: `Konto ${email}` });
const signedIn = () => setup(fakeAccount({ session: vi.fn(async () => signedInAs('ich@example.com')) }));

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
    expect(accountButton()).toHaveAttribute('title', 'ich@example.com');
    expect(screen.queryByRole('form', { name: 'Anmelden' })).not.toBeInTheDocument();
  });
});

describe('Spec account-auth › Falscher oder abgelaufener Code (UI)', () => {
  it('Falscher Code', async () => {
    const { user } = setup(fakeAccount({ verify: vi.fn(async () => fail('wrong-code')) }));
    await requestCodeFor(user, 'ich@example.com');
    await enterCode(user, '999999');
    expect(within(form()).getByRole('alert')).toHaveTextContent('Der Code stimmt nicht.');
    expect(within(header()).queryByRole('button', { name: /^Konto/ })).not.toBeInTheDocument();
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
    expect(within(form()).getByRole('button', { name: 'Neu senden' })).toBeInTheDocument();
  });
});

describe('Spec account-auth › Begrenzung der Code-Anforderungen (UI)', () => {
  it('Zweite Anforderung innerhalb von 30 Sekunden', async () => {
    const requestCode = vi.fn().mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce(fail('rate-limited'));
    const { user } = setup(fakeAccount({ requestCode }));
    await requestCodeFor(user, 'ich@example.com');
    await user.click(within(form()).getByRole('button', { name: 'Neu senden' }));
    expect(within(form()).getByRole('alert')).toHaveTextContent('Bitte warte kurz, bevor du einen neuen Code anforderst.');
  });
});

describe('Spec account-auth › Sitzung (UI)', () => {
  it('Neuladen', async () => {
    signedIn();
    await waitFor(() => expect(accountButton()).toHaveAttribute('title', 'ich@example.com'));
  });
});

describe('Spec account-auth › Abmelden (UI)', () => {
  it('Abmelden', async () => {
    const { user, store, account } = signedIn();
    const before = store.getState().songs;
    await user.click(await within(header()).findByRole('button', { name: /^Konto/ }));
    await user.click(within(header()).getByRole('button', { name: 'Abmelden' }));
    expect(account.logout).toHaveBeenCalled();
    expect(within(header()).getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
    expect(within(header()).queryByRole('button', { name: /^Konto/ })).not.toBeInTheDocument();
    expect(store.getState().songs).toBe(before);
    expect(screen.getByRole('button', { name: 'Hysteria' })).toBeInTheDocument();
  });
});

describe('Spec account-auth › Nutzung ohne Anmeldung (UI)', () => {
  it('Server nicht erreichbar', async () => {
    const { user, store, account } = setup(fakeAccount({ session: vi.fn(async () => null) }));
    await waitFor(() => expect(account.session).toHaveBeenCalled());
    expect(within(header()).getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '+ Song' }));
    expect(store.getState().songs.map((s) => s.title)).toContain('Neuer Song');
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

describe('Spec app-header › Konto-Symbol', () => {
  const anmelden = () => within(header()).getByRole('button', { name: 'Anmelden' });

  it('Abgemeldet', async () => {
    const { account } = setup();
    await waitFor(() => expect(account.session).toHaveBeenCalled());
    expect(anmelden()).toHaveAttribute('title', 'Anmelden');
    expect(anmelden()).toHaveTextContent('');
    expect(anmelden().querySelector('svg')).not.toHaveClass('filled');
  });

  it('Angemeldet', async () => {
    signedIn();
    const button = await within(header()).findByRole('button', { name: 'Konto ich@example.com' });
    expect(button).toHaveAttribute('title', 'ich@example.com');
    expect(button).toHaveTextContent('');
    expect(button.querySelector('svg')).toHaveClass('filled');
  });

  it('Kreis mit Silhouette', () => {
    setup();
    expect(anmelden().querySelector('svg circle[r="6.5"]')).toBeInTheDocument();
  });

  it('Symbol bleibt beim Öffnen', async () => {
    const { user } = signedIn();
    await user.click(await within(header()).findByRole('button', { name: /^Konto/ }));
    expect(within(header()).getByRole('button', { name: 'Abmelden' })).toBeInTheDocument();
    expect(accountButton()).toBeInTheDocument();
  });

  it('Symbol schließt das Popover', async () => {
    const { user } = signedIn();
    await user.click(await within(header()).findByRole('button', { name: /^Konto/ }));
    await user.click(accountButton());
    expect(within(header()).queryByRole('button', { name: 'Abmelden' })).not.toBeInTheDocument();
  });
});

describe('Spec app-header › Konto-Popover angemeldet', () => {
  const open = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await within(header()).findByRole('button', { name: /^Konto/ }));
  };

  it('Inhalt', async () => {
    const { user } = signedIn();
    await open(user);
    expect(header()).toHaveTextContent('ich@example.com');
    expect(within(header()).getByRole('button', { name: 'Abmelden' })).toBeInTheDocument();
  });

  it('Vor dem Öffnen steht die Adresse nicht als Text in der Kopfzeile', async () => {
    signedIn();
    await within(header()).findByRole('button', { name: /^Konto/ });
    expect(header()).not.toHaveTextContent('ich@example.com');
  });

  it('Abmelden im Popover', async () => {
    const { user, account } = signedIn();
    await open(user);
    await user.click(within(header()).getByRole('button', { name: 'Abmelden' }));
    expect(account.logout).toHaveBeenCalled();
    expect(within(header()).queryByRole('button', { name: 'Abmelden' })).not.toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Anmelden' })).not.toBeInTheDocument();
  });
});

describe('Spec app-header › Anmeldedialog', () => {
  it('Über das Konto-Symbol', async () => {
    const { user } = setup();
    await user.click(within(header()).getByRole('button', { name: 'Anmelden' }));
    const dialog = screen.getByRole('dialog', { name: 'Anmelden' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog.parentElement).toHaveClass('backdrop');
    expect(within(dialog).getByRole('form', { name: 'Anmelden' })).toBeInTheDocument();
  });
});

describe('Spec account-auth › Anmeldeformular schließen', () => {
  const anmelden = () => within(header()).getByRole('button', { name: 'Anmelden' });
  const backdrop = () => document.querySelector<HTMLElement>('.backdrop')!;

  it('Klick auf den Hintergrund', async () => {
    const { user } = setup();
    await user.click(anmelden());
    await user.click(backdrop());
    expect(form()).toBeInTheDocument();
  });

  it('Klick in den Dialog schließt nicht', async () => {
    const { user } = setup();
    await user.click(anmelden());
    await user.click(screen.getByRole('heading', { name: 'Anmelden' }));
    expect(form()).toBeInTheDocument();
  });

  it('Escape im Code-Schritt', async () => {
    const { user } = setup();
    await requestCodeFor(user, 'ich@example.com');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('form', { name: 'Anmelden' })).not.toBeInTheDocument();
    await user.click(anmelden());
    expect(within(form()).getByLabelText('Code')).toBeInTheDocument();
    expect(form()).toHaveTextContent('ich@example.com');
  });

  it('Escape ohne Fokus im Dialog', async () => {
    const { user } = setup();
    await user.click(anmelden());
    await user.click(backdrop());
    (document.activeElement as HTMLElement).blur();
    expect(document.body).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('form', { name: 'Anmelden' })).not.toBeInTheDocument();
  });

  it('Escape im Schritt der Mail-Adresse', async () => {
    const { user } = setup();
    await user.click(anmelden());
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('form', { name: 'Anmelden' })).not.toBeInTheDocument();
  });

  it('Abbrechen im Code-Schritt', async () => {
    const { user } = setup();
    await requestCodeFor(user, 'ich@example.com');
    await user.click(within(form()).getByRole('button', { name: 'Abbrechen' }));
    await user.click(anmelden());
    expect(within(form()).getByLabelText('Mail-Adresse')).toBeInTheDocument();
  });
});

describe('Spec account-auth › Stabile Anordnung im Anmeldedialog', () => {
  const message = () => form().querySelector('.login-message')!;
  const order = () => [...form().children].map((child) => child.tagName + (child.className ? `.${child.className}` : ''));

  it('Schritt wechselt', async () => {
    const { user } = setup();
    await user.click(within(header()).getByRole('button', { name: 'Anmelden' }));
    const before = order();
    expect(message()).toHaveTextContent('');
    await user.type(within(form()).getByLabelText('Mail-Adresse'), 'ich@example.com');
    await user.click(within(form()).getByRole('button', { name: 'Code senden' }));
    expect(order()).toEqual(before);
    expect(within(message() as HTMLElement).getByRole('status')).toHaveTextContent('ich@example.com');
  });

  it('Fokus nach einer Antwort des Servers: abgelehnter Code', async () => {
    const { user } = setup(fakeAccount({ verify: vi.fn(async () => fail('wrong-code')) }));
    await requestCodeFor(user, 'ich@example.com');
    await enterCode(user, '999999');
    expect(within(form()).getByLabelText('Code')).toHaveFocus();
  });

  it('Fokus nach einer Antwort des Servers: abgelehnte Adresse', async () => {
    const { user } = setup(fakeAccount({ requestCode: vi.fn(async () => fail('invalid-email')) }));
    await requestCodeFor(user, 'keine-adresse');
    expect(within(form()).getByLabelText('Mail-Adresse')).toHaveFocus();
  });

  it('Fokus nach einer Antwort des Servers: Neu senden', async () => {
    const { user } = setup();
    await requestCodeFor(user, 'ich@example.com');
    await user.click(within(form()).getByRole('button', { name: 'Neu senden' }));
    expect(within(form()).getByLabelText('Code')).toHaveFocus();
  });

  it('Fehler ersetzt den Hinweis', async () => {
    const { user } = setup(fakeAccount({ verify: vi.fn(async () => fail('wrong-code')) }));
    await requestCodeFor(user, 'ich@example.com');
    const before = order();
    await enterCode(user, '999999');
    expect(order()).toEqual(before);
    expect(within(message() as HTMLElement).getByRole('alert')).toHaveTextContent('Der Code stimmt nicht.');
    expect(within(form()).queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('Spec account-auth › Code neu senden', () => {
  it('Neu senden', async () => {
    const { user, account } = setup();
    await requestCodeFor(user, 'ich@example.com');
    expect(form()).not.toHaveTextContent('neuen Code');
    await user.click(within(form()).getByRole('button', { name: 'Neu senden' }));
    expect(account.requestCode).toHaveBeenCalledTimes(2);
    expect(form()).toHaveTextContent('neuen Code an ich@example.com');
  });

  it('Neu senden zu früh', async () => {
    const requestCode = vi.fn().mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce(fail('rate-limited'));
    const { user } = setup(fakeAccount({ requestCode }));
    await requestCodeFor(user, 'ich@example.com');
    await user.click(within(form()).getByRole('button', { name: 'Neu senden' }));
    expect(within(form()).getByRole('alert')).toHaveTextContent('Bitte warte kurz');
    expect(within(form()).queryByRole('status')).not.toBeInTheDocument();
  });

  it('Neu senden steht links als Textknopf vor Abbrechen und Anmelden', async () => {
    const { user } = setup();
    await requestCodeFor(user, 'ich@example.com');
    const buttons = within(form()).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Neu senden', 'Abbrechen', 'Anmelden']);
    expect(buttons[0]).toHaveClass('text-button');
  });
});
