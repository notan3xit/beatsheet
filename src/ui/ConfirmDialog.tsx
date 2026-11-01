import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Confirm = (message: string) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('ConfirmProvider fehlt');
  return confirm;
}

interface Pending {
  message: string;
  resolve: (ok: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback<Confirm>(
    (message) => new Promise((resolve) => setPending({ message, resolve })),
    [],
  );

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="backdrop">
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-message" className="dialog">
            <p id="confirm-message">{pending.message}</p>
            <div className="dialog-actions">
              <button type="button" onClick={() => close(false)}>
                Abbrechen
              </button>
              <button type="button" className="primary" autoFocus onClick={() => close(true)}>
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
