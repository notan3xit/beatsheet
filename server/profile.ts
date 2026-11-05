import { initialsOfName } from '../src/domain/profile.ts';
import { PATTERN_COLORS, type MemberProfile, type PatternColor } from '../src/domain/types.ts';
import type { Database } from './db.ts';
import type { Events } from './events.ts';
import { HttpError } from './http.ts';

const MAX_NAME = 40;

/** Kürzel: 1–2 Zeichen ohne Leer- und Steuerzeichen. */
export const validInitials = (initials: string) => {
  const length = [...initials].length;
  return length >= 1 && length <= 2 && !/[\s\p{Cc}]/u.test(initials);
};

/** Name, Kürzel und Farbe aus dem Anfragekörper (member-profiles, design.md D2); sonst `invalid-profile`. */
export function parseProfile(body: Record<string, unknown>): MemberProfile {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const initials = typeof body.initials === 'string' ? body.initials.trim() : '';
  const color = body.color;
  const validName = name.length > 0 && name.length <= MAX_NAME && !/[\p{Cc}\p{Zl}\p{Zp}]/u.test(name);
  const validColor = typeof color === 'string' && (PATTERN_COLORS as readonly string[]).includes(color);
  if (!validName || !validInitials(initials) || !validColor) throw new HttpError(400, 'invalid-profile');
  return { name, initials, color: color as PatternColor };
}

/** Profil eines Accounts; `null`, solange keines gespeichert ist. */
export function profileOf(db: Database, email: string): MemberProfile | null {
  const row = db.prepare('SELECT name, initials, color FROM users WHERE email = ?').get(email) as
    | { name: string | null; initials: string | null; color: string | null }
    | undefined;
  // Vor dem Kürzel gespeicherte Profile erhalten es aus dem Namen (design.md D6)
  return row?.name && row.color ? { name: row.name, initials: row.initials || initialsOfName(row.name), color: row.color as PatternColor } : null;
}

/** Speichert das Profil und benachrichtigt den Nutzer und alle Mitglieder seiner Workbooks. */
export function saveProfile(deps: { db: Database; events: Events }, email: string, profile: MemberProfile): MemberProfile {
  deps.db.prepare('UPDATE users SET name = ?, initials = ?, color = ? WHERE email = ?').run(profile.name, profile.initials, profile.color, email);
  const others = deps.db
    .prepare('SELECT DISTINCT other.email AS email FROM members mine JOIN members other ON other.workbook_id = mine.workbook_id WHERE mine.email = ?')
    .all(email) as unknown as { email: string }[];
  deps.events.send([...new Set([email, ...others.map((row) => row.email)])], 'workbooks');
  return profile;
}
