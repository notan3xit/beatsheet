import type { Member } from './types';

/**
 * Mitglied hinter einem Autor: über die Kennung, bei älteren Änderungen über die Adresse
 * (account-id-authorship, design.md D3). Ohne Mitgliedschaft unbekannt.
 */
export function memberOf(members: readonly Member[], author: string | null): Member | undefined {
  if (!author) return undefined;
  return members.find((m) => m.account === author) ?? members.find((m) => m.email === author);
}
