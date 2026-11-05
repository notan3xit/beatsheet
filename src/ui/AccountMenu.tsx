import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import type { AccountError } from '../account/api';
import type { AccountSession } from '../account/session';
import { useConfirm } from './ConfirmDialog';
import type { MemberProfile } from '../domain/types';
import { PersonIcon } from './icons';
import { MemberAvatar } from './MemberAvatar';
import { useReport } from './messages';
import { useDismiss, useEscape } from './useDismiss';
import { useSync } from './useWorkbooks';

const MESSAGES: Record<AccountError, string> = {
  'invalid-email': 'Bitte gib eine gültige Mail-Adresse ein.',
  'rate-limited': 'Bitte warte kurz, bevor du einen neuen Code anforderst.',
  'wrong-code': 'Der Code stimmt nicht.',
  expired: 'Der Code ist abgelaufen. Bitte fordere einen neuen an.',
  'too-many-attempts': 'Zu viele Fehlversuche. Bitte fordere einen neuen Code an.',
  'no-code': 'Bitte fordere einen neuen Code an.',
  unreachable: 'Der Server ist nicht erreichbar. Deine Songs bleiben auf diesem Gerät.',
};

type Step = { kind: 'email' } | { kind: 'code'; email: string; resent: boolean };

/** Abmelden mit Nachfrage bei nicht übertragenen Änderungen; Reihenfolge nach workbook-sync, design.md D13. */
export function useLogout(session: AccountSession) {
  const sync = useSync();
  const confirm = useConfirm();
  const report = useReport();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      if (sync && !(await sync.prepareLogout())) {
        const discard = await confirm('Einige Änderungen an Workbook-Songs wurden nicht übertragen und gehen beim Abmelden verloren. Trotzdem abmelden?');
        if (!discard) return;
      }
      report();
      const result = await session.api.logout();
      if (!result.ok) return report('alert', MESSAGES[result.error]);
      await sync?.afterLogout();
      session.setEmail(null);
    } finally {
      setLoggingOut(false);
    }
  };

  return { logout, loggingOut };
}

/** Konto-Symbol im App-Kopf mit Anmeldedialog bzw. Popover (header-cleanup, design.md D2); der Anmeldestatus gehört nicht zum Notebook. */
export function AccountMenu({
  session,
  open,
  onOpenChange,
  logout,
  loggingOut,
  onEditProfile,
  profile,
}: {
  session: AccountSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logout: () => Promise<void>;
  loggingOut: boolean;
  /** Öffnet den Dialog „Profil“; fehlt, solange das Profil unbekannt ist. */
  onEditProfile?: () => void;
  /** Eigenes Profil; ohne bekanntes Profil zeigt das Symbol die Silhouette (design.md D8). */
  profile?: MemberProfile | null;
}) {
  const { api } = session;
  const email = useSyncExternalStore(session.subscribe, session.getEmail);
  const [step, setStep] = useState<Step>({ kind: 'email' });
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<AccountError | null>(null);
  const [busy, setBusy] = useState(false);
  const emailId = useId();
  const codeId = useId();
  const titleId = useId();
  const area = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useDismiss(open && email !== null, area, close);
  useEscape(open && email === null, close);

  useEffect(() => {
    void session.refresh();
  }, [session]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } finally {
      setBusy(false);
      // Ein geklickter Knopf ist währenddessen deaktiviert und verliert den Fokus
      field.current?.focus();
    }
  };

  const reset = () => {
    onOpenChange(false);
    setStep({ kind: 'email' });
    setCode('');
    setError(null);
  };

  const sendCode = (address: string) =>
    run(async () => {
      const result = await api.requestCode(address);
      if (!result.ok) return setError(result.error);
      setCode('');
      setStep({ kind: 'code', email: address, resent: step.kind === 'code' });
    });

  const verify = (address: string) =>
    run(async () => {
      const result = await api.verify(address, code);
      if (!result.ok) return setError(result.error);
      session.setEmail(result.email);
      setInput('');
      reset();
    });

  return (
    <div className="account" ref={area}>
      <button
        type="button"
        className="icon-button"
        aria-label={email ? `Konto ${email}` : 'Anmelden'}
        aria-expanded={open}
        title={email ?? 'Anmelden'}
        onClick={() => onOpenChange(!open)}
      >
        {email && profile ? <MemberAvatar email={email} profile={profile} /> : <PersonIcon filled={email !== null} />}
      </button>
      {open && email && (
        <div className="account-form">
          <div className="account-identity">
            {profile && <strong className="account-name">{profile.name}</strong>}
            <span className="account-email">{email}</span>
          </div>
          <div className="dialog-actions">
            {onEditProfile && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onEditProfile();
                }}
              >
                Profil bearbeiten
              </button>
            )}
            <button
              type="button"
              disabled={loggingOut}
              onClick={() => {
                onOpenChange(false);
                void logout();
              }}
            >
              Abmelden
            </button>
          </div>
        </div>
      )}
      {open && !email && (
        <div className="backdrop anchored">
          <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="dialog login-dialog">
            <h2 id={titleId}>Anmelden</h2>
            <form
              aria-label="Anmelden"
              className="login-form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void (step.kind === 'email' ? sendCode(input) : verify(step.email));
              }}
            >
              {step.kind === 'email' ? (
                <label key="email" className="field" htmlFor={emailId}>
                  Mail-Adresse
                  <input ref={field} id={emailId} type="email" autoComplete="email" value={input} onChange={(e) => setInput(e.target.value)} autoFocus />
                </label>
              ) : (
                <label key="code" className="field" htmlFor={codeId}>
                  Code
                  <input
                    ref={field}
                    id={codeId}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoFocus
                  />
                </label>
              )}
              {/* Einzige Stelle für Hinweise und Fehler; ihr Platz bleibt immer frei (design.md D10) */}
              <div className="login-message">
                {error ? (
                  <p role="alert">{MESSAGES[error]}</p>
                ) : (
                  step.kind === 'code' && (
                    <p role="status">
                      Wir haben einen {step.resent ? 'neuen ' : ''}Code an {step.email} geschickt.
                    </p>
                  )
                )}
              </div>
              <div className="dialog-actions">
                {step.kind === 'code' && (
                  <button type="button" className="text-button" onClick={() => void sendCode(step.email)} disabled={busy}>
                    Neu senden
                  </button>
                )}
                <button type="button" onClick={reset}>
                  Abbrechen
                </button>
                <button type="submit" className="primary" disabled={busy}>
                  {step.kind === 'email' ? 'Code senden' : 'Anmelden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
