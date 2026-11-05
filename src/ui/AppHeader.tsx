import { useState } from 'react';
import type { AccountSession } from '../account/session';
import { AccountMenu, useLogout } from './AccountMenu';
import { AppMenu } from './AppMenu';

/** App-Kopfzeile; Menü und Konto-Symbol teilen sich Konto-Popover und Abmelden. */
export function AppHeader({ session }: { session: AccountSession }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const { logout, loggingOut } = useLogout(session);
  return (
    <header className="app-header">
      <AppMenu onLogin={() => setAccountOpen(true)} onLogout={() => void logout()} loggingOut={loggingOut} />
      <h1>Beatsheet</h1>
      <AccountMenu session={session} open={accountOpen} onOpenChange={setAccountOpen} logout={logout} loggingOut={loggingOut} />
    </header>
  );
}
