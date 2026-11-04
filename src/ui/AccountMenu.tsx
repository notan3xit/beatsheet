import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import type { AccountError } from '../account/api';
import type { AccountSession } from '../account/session';
import { useConfirm } from './ConfirmDialog';
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

type Step = { kind: 'closed' } | { kind: 'email' } | { kind: 'code'; email: string };

/** Anmelden/Abmelden im App-Kopf (server-auth, design.md D8); der Anmeldestatus gehört nicht zum Notebook. */
export function AccountMenu({ session }: { session: AccountSession }) {
  const { api } = session;
  const sync = useSync();
  const confirm = useConfirm();
  const email = useSyncExternalStore(session.subscribe, session.getEmail);
  const [step, setStep] = useState<Step>({ kind: 'closed' });
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<AccountError | null>(null);
  const [busy, setBusy] = useState(false);
  const emailId = useId();
  const codeId = useId();

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
    }
  };

  const close = () => {
    setStep({ kind: 'closed' });
    setCode('');
    setError(null);
  };

  const sendCode = (address: string) =>
    run(async () => {
      const result = await api.requestCode(address);
      if (!result.ok) return setError(result.error);
      setCode('');
      setStep({ kind: 'code', email: address });
    });

  const verify = (address: string) =>
    run(async () => {
      const result = await api.verify(address, code);
      if (!result.ok) return setError(result.error);
      session.setEmail(result.email);
      setInput('');
      close();
    });

  const logout = () =>
    run(async () => {
      // Reihenfolge nach workbook-sync, design.md D13
      if (sync && !(await sync.prepareLogout())) {
        const discard = await confirm('Einige Änderungen an Workbook-Songs wurden nicht übertragen und gehen beim Abmelden verloren. Trotzdem abmelden?');
        if (!discard) return;
      }
      const result = await api.logout();
      if (!result.ok) return setError(result.error);
      await sync?.afterLogout();
      session.setEmail(null);
    });

  if (email) {
    return (
      <div className="account">
        <span className="account-email">{email}</span>
        <button type="button" onClick={() => void logout()} disabled={busy}>
          Abmelden
        </button>
        {error && (
          <p role="alert" className="message alert">
            {MESSAGES[error]}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="account">
      {step.kind === 'closed' ? (
        <button type="button" onClick={() => setStep({ kind: 'email' })}>
          Anmelden
        </button>
      ) : (
        <form
          aria-label="Anmelden"
          className="account-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void (step.kind === 'email' ? sendCode(input) : verify(step.email));
          }}
        >
          {step.kind === 'email' ? (
            <label className="field" htmlFor={emailId}>
              Mail-Adresse
              <input id={emailId} type="email" autoComplete="email" value={input} onChange={(e) => setInput(e.target.value)} autoFocus />
            </label>
          ) : (
            <>
              <p className="hint">Wir haben einen Code an {step.email} geschickt.</p>
              <label className="field" htmlFor={codeId}>
                Code
                <input
                  id={codeId}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                />
              </label>
            </>
          )}
          {error && (
            <p role="alert" className="message alert">
              {MESSAGES[error]}
            </p>
          )}
          <div className="dialog-actions">
            <button type="button" onClick={close}>
              Abbrechen
            </button>
            {step.kind === 'code' && (
              <button type="button" onClick={() => void sendCode(step.email)} disabled={busy}>
                Neuen Code anfordern
              </button>
            )}
            <button type="submit" className="primary" disabled={busy}>
              {step.kind === 'email' ? 'Code senden' : 'Anmelden'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
