import { HOUR } from './auth.ts';
import type { Database } from './db.ts';

export interface Limits {
  /** Speicher je Account, Songs zählen beim Besitzer ihres Workbooks. */
  accountBytes: number;
  /** Speicher über alle Accounts. */
  totalBytes: number;
  /** Eigene Workbooks ohne den eigenen Bestand. */
  ownedWorkbooks: number;
  workbookMembers: number;
  accountConnections: number;
  totalConnections: number;
}

export const DEFAULT_LIMITS: Limits = {
  accountBytes: 20 * 1024 * 1024,
  totalBytes: 5 * 1024 * 1024 * 1024,
  ownedWorkbooks: 50,
  workbookMembers: 50,
  accountConnections: 10,
  totalConnections: 1000,
};

/** Zuschlag je Song, auch als Grabstein: begrenzt die Zeilen und nicht nur die Bytes. */
export const SONG_OVERHEAD = 1024;

export type QuotaProblem = 'quota-exceeded' | 'server-full';

export interface Quota {
  /** Reicht der Platz für `growth` zusätzliche Bytes beim Besitzer? Wer nicht wächst, passt immer. */
  check(owner: string, growth: number): QuotaProblem | null;
  /** Wie `check`, aber ohne die Gesamtgrenze: Ein Umzug ändert sie nicht. */
  checkAccount(owner: string, growth: number): QuotaProblem | null;
}

export function createQuota(db: Database, limits: Limits, now: () => Date): Quota {
  let lastLogged: number | undefined;

  const used = (sql: string, ...params: string[]) => Number((db.prepare(sql).get(...params) as { n: number | null }).n ?? 0);
  const accountUsed = (owner: string) =>
    used(`SELECT SUM(LENGTH(s.doc) + ${SONG_OVERHEAD}) AS n FROM songs s JOIN workbooks w ON w.id = s.workbook_id WHERE w.owner = ?`, owner);
  const totalUsed = () => used(`SELECT SUM(LENGTH(doc) + ${SONG_OVERHEAD}) AS n FROM songs`);

  const checkAccount: Quota['checkAccount'] = (owner, growth) => (growth > 0 && accountUsed(owner) + growth > limits.accountBytes ? 'quota-exceeded' : null);

  return {
    checkAccount,
    check(owner, growth) {
      if (growth <= 0) return null;
      const problem = checkAccount(owner, growth);
      if (problem) return problem;
      if (totalUsed() + growth <= limits.totalBytes) return null;
      const time = now().getTime();
      if (lastLogged === undefined || time - lastLogged >= HOUR) {
        lastLogged = time;
        console.error(`Gesamtgrenze für den Speicher erreicht (${limits.totalBytes} Byte)`);
      }
      return 'server-full';
    },
  };
}
