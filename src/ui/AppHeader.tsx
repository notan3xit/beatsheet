import { useEffect, useState, useSyncExternalStore } from 'react';
import { initialsOfName, suggestedColor, suggestedName, type ProfileApi } from '../account/profile';
import type { AccountSession } from '../account/session';
import type { MemberProfile } from '../domain/types';
import { AccountMenu, useLogout } from './AccountMenu';
import { AppMenu } from './AppMenu';
import { Logo } from './Logo';
import { ProfileDialog } from './ProfileDialog';

/** Profil des angemeldeten Accounts; `undefined`, solange unbekannt (Server nicht erreichbar), `null` ohne Profil. */
function useOwnProfile(session: AccountSession, api: ProfileApi) {
  const email = useSyncExternalStore(session.subscribe, session.getEmail);
  const [loaded, setLoaded] = useState<{ email: string; profile: MemberProfile | null } | null>(null);
  useEffect(() => {
    if (!email) return;
    let current = true;
    void api.load().then((result) => {
      if (current && result.ok) setLoaded({ email, profile: result.profile });
    });
    return () => {
      current = false;
    };
  }, [email, api]);
  const profile = email && loaded?.email === email ? loaded.profile : undefined;
  return { email, profile, setProfile: (next: MemberProfile) => email && setLoaded({ email, profile: next }) };
}

/** Vorbelegung ohne Profil: Name und Farbe aus der Adresse, das Kürzel einmal aus diesem Namen. */
function suggestedProfile(email: string): MemberProfile {
  const name = suggestedName(email);
  return { name, initials: initialsOfName(name), color: suggestedColor(email) };
}

/** App-Kopfzeile; Menü und Konto-Symbol teilen sich Konto-Popover, Abmelden und den Dialog „Profil“. */
export function AppHeader({ session, profileApi }: { session: AccountSession; profileApi: ProfileApi }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const { logout, loggingOut } = useLogout(session);
  const { email, profile, setProfile } = useOwnProfile(session, profileApi);
  const required = email !== null && profile === null;

  const save = async (next: MemberProfile) => {
    const result = await profileApi.save(next);
    if (result.ok && result.profile) {
      setProfile(result.profile);
      setEditing(false);
    }
    return result;
  };

  return (
    <header className="app-header">
      <AppMenu onLogin={() => setAccountOpen(true)} onLogout={() => void logout()} loggingOut={loggingOut} />
      <Logo />
      <AccountMenu
        session={session}
        open={accountOpen}
        onOpenChange={setAccountOpen}
        logout={logout}
        loggingOut={loggingOut}
        onEditProfile={profile ? () => setEditing(true) : undefined}
        profile={profile}
      />
      {email && (required || (editing && profile)) && (
        <ProfileDialog
          key={required ? 'required' : 'edit'}
          initial={profile ?? suggestedProfile(email)}
          required={required}
          onSave={save}
          onCancel={() => setEditing(false)}
          onLogout={() => void logout()}
        />
      )}
    </header>
  );
}
