import { createContext, useContext, useSyncExternalStore } from 'react';
import type { AccountSession } from '../account/session';
import type { SyncError } from '../sync/api';
import type { WorkbookActions } from '../sync/sync';

export const SyncContext = createContext<WorkbookActions | null>(null);
export const SessionContext = createContext<AccountSession | null>(null);

/** Workbook-Aktionen; `null`, wenn die App ohne Abgleich läuft. */
export const useSync = () => useContext(SyncContext);

/** Adresse der Sitzung; `null`, wenn nicht angemeldet. */
export function useEmail(): string | null {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionContext fehlt');
  return useSyncExternalStore(session.subscribe, session.getEmail);
}

const MESSAGES: Partial<Record<SyncError, string>> & { unreachable: string } = {
  unreachable: 'Der Server ist nicht erreichbar.',
  unauthenticated: 'Bitte melde dich an.',
  'invalid-title': 'Der Titel darf nicht leer sein, keine Zeilenumbrüche enthalten und höchstens 200 Zeichen lang sein.',
  'invalid-email': 'Bitte gib eine gültige Mail-Adresse ein.',
  'already-member': 'Diese Person ist bereits Mitglied.',
  'rate-limited': 'Du hast gerade viele Einladungen verschickt. Bitte lade später erneut ein.',
  'not-owner': 'Das darf nur der Besitzer des Workbooks.',
  'not-empty': 'Das Workbook enthält noch Songs.',
  exists: 'Dieser Song liegt bereits in einem Workbook.',
  'invalid-song': 'Der Song enthält ungültige Daten und wurde nicht übertragen.',
  'too-large': 'Der Song ist zu groß für die Übertragung.',
  gone: 'Das Workbook gibt es nicht mehr.',
  'quota-exceeded': 'Der Speicher dieses Workbooks ist voll. Löschen von Songs schafft Platz.',
  'server-full': 'Der Server ist voll. Bitte versuche es später erneut.',
  'too-many-workbooks': 'Du hast die Höchstzahl an Workbooks erreicht.',
  'too-many-members': 'Dieses Workbook hat die Höchstzahl an Mitgliedern erreicht.',
};

export const syncMessage = (error: SyncError) => MESSAGES[error] ?? MESSAGES.unreachable;
