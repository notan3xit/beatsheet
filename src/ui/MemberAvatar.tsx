import { initialsOfName } from '../domain/profile';
import type { MemberProfile } from '../domain/types';
import { patternStyle } from './patternStyle';

/** Kürzel einer Mail-Adresse: Anfangsbuchstaben der Teile vor dem @. */
export function initials(email: string): string {
  const parts = email.split('@')[0]!.split(/[._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0]![0]! + parts[1]![0]! : (parts[0] ?? email).slice(0, 2)).toUpperCase();
}

/**
 * Kürzel eines Accounts: mit Profil aus dem Namen in seiner Farbe, sonst grau aus der Adresse
 * (member-profiles, design.md D6, D8). Überall gleich: Kopf des Workbooks, Mitgliederliste, Konto-Symbol.
 */
export function MemberAvatar({ email, profile }: { email: string; profile?: MemberProfile | null }) {
  return profile ? (
    <span className="avatar colored" style={patternStyle(profile.color)} aria-hidden="true">
      {/* Ältere Server und lokal gespeicherte Workbooks kennen kein Kürzel (design.md D6) */}
      {profile.initials || initialsOfName(profile.name)}
    </span>
  ) : (
    <span className="avatar" aria-hidden="true">
      {initials(email)}
    </span>
  );
}
