import { initialsOfName } from '../domain/profile';
import { PATTERN_COLORS, type MemberProfile, type PatternColor } from '../domain/types';

export { initialsOfName };

/** Höchstlänge eines Namens, wie auf dem Server (member-profiles, design.md D2). */
export const MAX_NAME = 40;

export type ProfileError = 'invalid-profile' | 'unauthenticated' | 'unreachable';
export type ProfileResult = { ok: true; profile: MemberProfile | null } | { ok: false; error: ProfileError };

/** Profil des angemeldeten Accounts auf dem Server. */
export interface ProfileApi {
  load(): Promise<ProfileResult>;
  save(profile: MemberProfile): Promise<ProfileResult>;
}

/** Name aus der Adresse: Teil vor dem @, Trenner als Leerzeichen, Wörter groß beginnend. */
export function suggestedName(email: string): string {
  const local = email.split('@')[0] ?? email;
  const words = local.split(/[._-]+/).filter(Boolean);
  const name = words.length > 0 ? words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ') : local;
  return name.slice(0, MAX_NAME);
}

/** Farbe aus der Adresse, für dieselbe Adresse immer dieselbe (FNV-1a, design.md D4). */
export function suggestedColor(email: string): PatternColor {
  let hash = 0x811c9dc5;
  for (const char of email) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return PATTERN_COLORS[hash % PATTERN_COLORS.length]!;
}

const unreachable = { ok: false as const, error: 'unreachable' as const };

async function resultOf(response: Response): Promise<ProfileResult> {
  try {
    const body = (await response.json()) as { profile?: MemberProfile | null; error?: string };
    if (response.ok && body.profile === null) return { ok: true, profile: null };
    if (response.ok && body.profile) {
      // Ein Server vor dem Kürzel liefert keines; es kommt dann aus dem Namen (design.md D6)
      const { name, color, initials } = body.profile;
      return { ok: true, profile: { name, color, initials: initials || initialsOfName(name) } };
    }
    if (response.status === 401) return { ok: false, error: 'unauthenticated' };
    if (response.status === 400 && body.error === 'invalid-profile') return { ok: false, error: 'invalid-profile' };
  } catch {
    // keine JSON-Antwort: nicht unser Server
  }
  return unreachable;
}

export function createHttpProfileApi(path = '/api/auth/profile'): ProfileApi {
  const run = async (init?: RequestInit) => {
    try {
      return await resultOf(init ? await fetch(path, init) : await fetch(path));
    } catch {
      return unreachable;
    }
  };
  return {
    load: () => run(),
    save: (profile) => run({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) }),
  };
}
