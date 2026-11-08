import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

/** Rückfrage als Text oder mit Titel und Inhalt (song-history, design.md D8). */
export type ConfirmRequest =
  | string
  | {
      title: string;
      content: ReactNode;
      /** Beschriftung der Bestätigung; Vorgabe „Bestätigen“. */
      confirmLabel?: string;
      /** `false`: nur „Abbrechen“. */
      canConfirm?: boolean;
    };

type Confirm = (request: ConfirmRequest) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('ConfirmProvider fehlt');
  return confirm;
}

interface Pending {
  request: ConfirmRequest;
  resolve: (ok: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback<Confirm>(
    (request) => new Promise((resolve) => setPending({ request, resolve })),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  // Escape schließt nur die Rückfrage mit Titel; die Text-Rückfrage bleibt dabei offen (workbooks)
  useEffect(() => {
    if (!pending || typeof pending.request === 'string') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending, close]);

  const request = pending?.request;
  const structured = typeof request === 'object' ? request : null;
  const canConfirm = structured?.canConfirm ?? true;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="backdrop">
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-message" className="dialog">
            {structured ? (
              <>
                <h2 id="confirm-message">{structured.title}</h2>
                {structured.content}
              </>
            ) : (
              <p id="confirm-message">{request as string}</p>
            )}
            <div className="dialog-actions">
              <button type="button" autoFocus={!canConfirm} onClick={() => close(false)}>
                Abbrechen
              </button>
              {canConfirm && (
                <button type="button" className="primary" autoFocus onClick={() => close(true)}>
                  {structured?.confirmLabel ?? 'Bestätigen'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
