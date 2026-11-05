import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AccountApi } from '../account/api';
import { suggestedColor, type ProfileApi, type ProfileResult } from '../account/profile';
import type { MemberProfile } from '../domain/types';
import { createNotebookStore } from '../state/notebookStore';
import { fakePlayer } from '../test/fakePlayer';
import { App } from './App';

const ME = 'ich@example.com';

function setup({ signedIn = true, stored = null as MemberProfile | null, load }: { signedIn?: boolean; stored?: MemberProfile | null; load?: () => Promise<ProfileResult> } = {}) {
  let current = stored;
  const account: AccountApi = {
    session: vi.fn(async () => (signedIn ? ME : null)),
    requestCode: vi.fn(async () => ({ ok: true as const })),
    verify: vi.fn(async () => ({ ok: true as const, email: ME })),
    logout: vi.fn(async () => ({ ok: true as const })),
  };
  const profile: ProfileApi = {
    load: vi.fn(load ?? (async () => ({ ok: true as const, profile: current }))),
    save: vi.fn(async (next: MemberProfile) => {
      current = next;
      return { ok: true as const, profile: next };
    }),
  };
  const user = userEvent.setup();
  render(<App store={createNotebookStore()} player={fakePlayer().player} account={account} profile={profile} />);
  return { user, account, profile, current: () => current };
}

const dialog = () => screen.getByRole('dialog', { name: 'Profil' });
const findDialog = () => screen.findByRole('dialog', { name: 'Profil' });
const header = () => screen.getByRole('banner');

describe('Spec account-profile › Profil anlegen (UI)', () => {
  it('Erste Anmeldung', async () => {
    const { user } = setup({ signedIn: false });
    await user.click(within(header()).getByRole('button', { name: 'Anmelden' }));
    await user.type(screen.getByLabelText('Mail-Adresse'), ME);
    await user.click(screen.getByRole('button', { name: 'Code senden' }));
    await user.type(screen.getByLabelText('Code'), '012345');
    await user.click(within(screen.getByRole('form', { name: 'Anmelden' })).getByRole('button', { name: 'Anmelden' }));
    expect(await findDialog()).toHaveAttribute('aria-modal', 'true');
    await user.keyboard('{Escape}');
    await user.click(document.querySelector<HTMLElement>('.backdrop')!);
    expect(dialog()).toBeInTheDocument();
    expect(within(dialog()).queryByRole('button', { name: 'Abbrechen' })).not.toBeInTheDocument();
  });

  it('Vorbelegung: Name und Farbe aus der Adresse', async () => {
    setup();
    await findDialog();
    expect(within(dialog()).getByLabelText('Name')).toHaveValue('Ich');
    expect(within(dialog()).getByLabelText('Kürzel')).toHaveValue('IC');
    const chosen = within(dialog()).getAllByRole('button', { pressed: true });
    expect(chosen).toHaveLength(1);
    expect(chosen[0]).toHaveAttribute('data-color', suggestedColor(ME));
  });

  it('Speichern', async () => {
    const { user, profile } = setup();
    await findDialog();
    await user.click(within(dialog()).getByRole('button', { name: 'Speichern' }));
    expect(profile.save).toHaveBeenCalledWith({ name: 'Ich', initials: 'IC', color: suggestedColor(ME) });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Profil' })).not.toBeInTheDocument());
  });

  it('Nach dem Speichern erscheint der Dialog beim nächsten Start nicht', async () => {
    const { profile } = setup({ stored: { name: 'Artjom', initials: 'AR', color: 'green' } });
    await waitFor(() => expect(profile.load).toHaveBeenCalled());
    expect(screen.queryByRole('dialog', { name: 'Profil' })).not.toBeInTheDocument();
  });

  it('Abmelden statt Speichern', async () => {
    const { user, account, profile } = setup();
    await findDialog();
    await user.click(within(dialog()).getByRole('button', { name: 'Abmelden' }));
    await waitFor(() => expect(account.logout).toHaveBeenCalled());
    expect(profile.save).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Profil' })).not.toBeInTheDocument());
    expect(within(header()).getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
  });

  it('Neuladen ohne Profil', async () => {
    setup();
    expect(await findDialog()).toBeInTheDocument();
  });

  it('Server nicht erreichbar', async () => {
    const { profile } = setup({ load: async () => ({ ok: false, error: 'unreachable' }) });
    await waitFor(() => expect(profile.load).toHaveBeenCalled());
    expect(screen.queryByRole('dialog', { name: 'Profil' })).not.toBeInTheDocument();
  });
});

describe('Spec account-profile › Vorbelegung des Profils (UI)', () => {
  it('Kürzel bleibt bei geändertem Namen', async () => {
    const { user, profile } = setup();
    await findDialog();
    await user.clear(within(dialog()).getByLabelText('Name'));
    await user.type(within(dialog()).getByLabelText('Name'), 'Kai Meyer');
    expect(within(dialog()).getByLabelText('Kürzel')).toHaveValue('IC');
    await user.click(within(dialog()).getByRole('button', { name: 'Speichern' }));
    expect(profile.save).toHaveBeenCalledWith({ name: 'Kai Meyer', initials: 'IC', color: suggestedColor(ME) });
  });

  it('Die Vorschau zeigt das Kürzel', async () => {
    const { user } = setup();
    await findDialog();
    await user.clear(within(dialog()).getByLabelText('Kürzel'));
    await user.type(within(dialog()).getByLabelText('Kürzel'), 'Q');
    expect(dialog().querySelector('.profile-preview .avatar')).toHaveTextContent('Q');
  });
});

describe('Spec account-profile › Name und Farbe (UI)', () => {
  it('Ungültiges Kürzel', async () => {
    const { user, profile } = setup();
    await findDialog();
    for (const value of ['', 'A B']) {
      await user.clear(within(dialog()).getByLabelText('Kürzel'));
      if (value) await user.type(within(dialog()).getByLabelText('Kürzel'), value);
      await user.click(within(dialog()).getByRole('button', { name: 'Speichern' }));
      expect(within(dialog()).getByRole('alert')).toHaveTextContent('Das Kürzel muss 1 bis 2 Zeichen ohne Leerzeichen haben.');
    }
    expect(profile.save).not.toHaveBeenCalled();
  });

  it('Leerer Name', async () => {
    const { user, profile } = setup();
    await findDialog();
    await user.clear(within(dialog()).getByLabelText('Name'));
    await user.click(within(dialog()).getByRole('button', { name: 'Speichern' }));
    expect(within(dialog()).getByRole('alert')).toHaveTextContent('Bitte gib einen Namen ein.');
    expect(profile.save).not.toHaveBeenCalled();
  });

  it('Farbe wählen; Rot gibt es nicht', async () => {
    const { user, profile } = setup();
    await findDialog();
    expect(within(dialog()).queryByRole('button', { name: 'Rot' })).not.toBeInTheDocument();
    await user.click(within(dialog()).getByRole('button', { name: 'Grün' }));
    expect(within(dialog()).getByRole('button', { name: 'Grün' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(dialog()).getByRole('button', { name: 'Speichern' }));
    expect(profile.save).toHaveBeenCalledWith({ name: 'Ich', initials: 'IC', color: 'green' });
  });

  it('Vom Server abgelehnt', async () => {
    const { user, profile } = setup();
    vi.mocked(profile.save).mockResolvedValueOnce({ ok: false, error: 'invalid-profile' });
    await findDialog();
    await user.click(within(dialog()).getByRole('button', { name: 'Speichern' }));
    expect(await within(dialog()).findByRole('alert')).toHaveTextContent('Name oder Farbe sind ungültig.');
  });
});

describe('Spec app-header › Konto-Symbol und Popover mit Profil (UI)', () => {
  it('Angemeldet mit Profil', async () => {
    setup({ stored: { name: 'Artjom Weyand', initials: 'AW', color: 'green' } });
    const button = await within(header()).findByRole('button', { name: `Konto ${ME}` });
    await waitFor(() => expect(button.querySelector('.avatar')).not.toBeNull());
    const avatar = button.querySelector<HTMLElement>('.avatar')!;
    expect(avatar).toHaveTextContent('AW');
    expect(avatar).toHaveClass('colored');
    expect(avatar.style.getPropertyValue('--pc')).toBe('var(--ctp-green)');
    expect(button.querySelector('svg')).toBeNull();
    expect(button).toHaveAttribute('title', ME);
  });

  it('Ohne bekanntes Profil bleibt die Silhouette', async () => {
    const { profile } = setup({ load: async () => ({ ok: false, error: 'unreachable' }) });
    await waitFor(() => expect(profile.load).toHaveBeenCalled());
    const button = within(header()).getByRole('button', { name: `Konto ${ME}` });
    expect(button.querySelector('svg')).not.toBeNull();
    expect(button.querySelector('.avatar')).toBeNull();
  });

  it('Inhalt mit Profil', async () => {
    const { user } = setup({ stored: { name: 'Artjom Weyand', initials: 'AW', color: 'green' } });
    const button = await within(header()).findByRole('button', { name: `Konto ${ME}` });
    await waitFor(() => expect(button.querySelector('.avatar')).not.toBeNull());
    await user.click(button);
    const popover = header().querySelector<HTMLElement>('.account-form')!;
    const name = within(popover).getByText('Artjom Weyand');
    const address = within(popover).getByText(ME);
    const firstButton = within(popover).getAllByRole('button')[0]!;
    expect(name.compareDocumentPosition(address) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(address.compareDocumentPosition(firstButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(popover).getAllByRole('button').map((b) => b.textContent)).toEqual(['Profil bearbeiten', 'Abmelden']);
  });
});

describe('Spec account-profile › Profil ändern (UI)', () => {
  const openEditor = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await within(header()).findByRole('button', { name: `Konto ${ME}` }));
    await user.click(within(header()).getByRole('button', { name: 'Profil bearbeiten' }));
    return findDialog();
  };

  it('Name ändern', async () => {
    const { user, profile, current } = setup({ stored: { name: 'Artjom', initials: 'AR', color: 'green' } });
    await openEditor(user);
    expect(within(dialog()).getByLabelText('Name')).toHaveValue('Artjom');
    expect(within(dialog()).getByRole('button', { name: 'Grün' })).toHaveAttribute('aria-pressed', 'true');
    await user.clear(within(dialog()).getByLabelText('Name'));
    await user.type(within(dialog()).getByLabelText('Name'), 'Art');
    await user.click(within(dialog()).getByRole('button', { name: 'Speichern' }));
    expect(profile.save).toHaveBeenCalledWith({ name: 'Art', initials: 'AR', color: 'green' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Profil' })).not.toBeInTheDocument());
    expect(current()).toEqual({ name: 'Art', initials: 'AR', color: 'green' });
    await openEditor(user);
    expect(within(dialog()).getByLabelText('Name')).toHaveValue('Art');
  });

  it('Kürzel ändern', async () => {
    const { user, profile } = setup({ stored: { name: 'Artjom Weyand', initials: 'AW', color: 'green' } });
    await openEditor(user);
    expect(within(dialog()).getByLabelText('Kürzel')).toHaveValue('AW');
    await user.clear(within(dialog()).getByLabelText('Kürzel'));
    await user.type(within(dialog()).getByLabelText('Kürzel'), 'A');
    await user.click(within(dialog()).getByRole('button', { name: 'Speichern' }));
    expect(profile.save).toHaveBeenCalledWith({ name: 'Artjom Weyand', initials: 'A', color: 'green' });
    await waitFor(() => expect(within(header()).getByRole('button', { name: `Konto ${ME}` }).querySelector('.avatar')).toHaveTextContent('A'));
  });

  it('Abbrechen', async () => {
    const { user, profile } = setup({ stored: { name: 'Artjom', initials: 'AR', color: 'green' } });
    await openEditor(user);
    await user.type(within(dialog()).getByLabelText('Name'), 'xyz');
    await user.click(within(dialog()).getByRole('button', { name: 'Abbrechen' }));
    expect(screen.queryByRole('dialog', { name: 'Profil' })).not.toBeInTheDocument();
    expect(profile.save).not.toHaveBeenCalled();
    await openEditor(user);
    expect(within(dialog()).getByLabelText('Name')).toHaveValue('Artjom');
  });

  it('Escape schließt beim Ändern', async () => {
    const { user } = setup({ stored: { name: 'Artjom', initials: 'AR', color: 'green' } });
    await openEditor(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Profil' })).not.toBeInTheDocument();
  });
});
