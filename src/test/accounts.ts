import type { Account } from '../account/api';
import type { Member, MemberProfile } from '../domain/types';

/** Feste Kennung je Adresse in Form einer UUID, damit Sitzung, Mitglieder und Autoren in Tests zusammenpassen. */
export function accountOf(email: string): string {
  let hex = '';
  for (let round = 0; hex.length < 32; round++) {
    let hash = 0x811c9dc5 ^ round;
    for (const char of email) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193) >>> 0;
    hex += hash.toString(16).padStart(8, '0');
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** Konto zu einer Adresse, wie es der Server liefert. */
export const signedInAs = (email: string): Account => ({ email, account: accountOf(email) });

/** Mitgliederliste wie in der Workbook-Antwort: jedes Mitglied mit Konto, Profile nach Adresse. */
export const memberList = (emails: readonly string[], profiles: Record<string, MemberProfile> = {}): Member[] =>
  emails.map((email) => ({ email, account: accountOf(email), ...(profiles[email] ? { profile: profiles[email] } : {}) }));
