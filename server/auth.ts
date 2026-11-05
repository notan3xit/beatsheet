import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Database } from './db.ts';
import type { Mailer } from './mail.ts';

export interface AuthDeps {
  db: Database;
  /** Schlüssel für die Code-Hashes (design.md D5). */
  secret: Buffer;
  now: () => Date;
  /** Sechsstelliger Code mit führenden Nullen. */
  newCode: () => string;
  mail: Mailer;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const CODE_TTL = 10 * MINUTE;
export const SESSION_TTL = 90 * 24 * HOUR;
const MAX_ATTEMPTS = 5;
const PER_ADDRESS_INTERVAL = 30 * SECOND;
const PER_ADDRESS_PER_HOUR = 10;
export const TOTAL_PER_HOUR = 50;

/** Getrimmt und klein geschrieben; `null`, wenn keine gültige Adresse (design.md D5). */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@\p{Cc}]+@[^\s@\p{Cc}]+\.[^\s@\p{Cc}]+$/u.test(email) ? email : null;
}

const hashCode = (secret: Buffer, email: string, code: string) => createHmac('sha256', secret).update(`${email}\n${code}`).digest('hex');
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

type Row = Record<string, unknown>;

/** Mails der letzten Stunde über alle Adressen: Anmeldecodes und Einladungen. */
export function mailsLastHour(db: Database, now: number): number {
  const count = (table: string) => Number((db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE at > ?`).get(now - HOUR) as Row).n);
  return count('code_requests') + count('invitations');
}

export type RequestCodeResult = 'sent' | 'invalid-email' | 'rate-limited';

export async function requestCode(deps: AuthDeps, rawEmail: unknown): Promise<RequestCodeResult> {
  const email = normalizeEmail(rawEmail);
  if (!email) return 'invalid-email';
  const { db } = deps;
  const now = deps.now().getTime();
  db.prepare('DELETE FROM code_requests WHERE at <= ?').run(now - HOUR);
  const count = (sql: string, ...params: (string | number)[]) => Number((db.prepare(sql).get(...params) as Row).n);
  if (
    count('SELECT COUNT(*) AS n FROM code_requests WHERE email = ? AND at > ?', email, now - PER_ADDRESS_INTERVAL) > 0 ||
    count('SELECT COUNT(*) AS n FROM code_requests WHERE email = ?', email) >= PER_ADDRESS_PER_HOUR ||
    mailsLastHour(db, now) >= TOTAL_PER_HOUR
  ) {
    return 'rate-limited';
  }

  const code = deps.newCode();
  db.prepare('INSERT INTO code_requests (email, at) VALUES (?, ?)').run(email, now);
  db.prepare(
    `INSERT INTO login_codes (email, code_hash, expires_at, attempts) VALUES (?, ?, ?, 0)
     ON CONFLICT (email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0`,
  ).run(email, hashCode(deps.secret, email, code), now + CODE_TTL);
  await deps.mail.send({
    to: email,
    subject: `${code} ist dein Anmeldecode für beatsheet`,
    text: `Dein Anmeldecode für beatsheet: ${code}\n\nEr gilt 10 Minuten. Wenn du keinen Code angefordert hast, kannst du diese Mail ignorieren.\n`,
  });
  return 'sent';
}

export type VerifyError = 'wrong-code' | 'expired' | 'too-many-attempts' | 'no-code';
export type VerifyResult = { ok: true; email: string; token: string } | { ok: false; error: VerifyError };

export function verifyCode(deps: AuthDeps, rawEmail: unknown, rawCode: unknown): VerifyResult {
  const email = normalizeEmail(rawEmail);
  const row = email && (deps.db.prepare('SELECT * FROM login_codes WHERE email = ?').get(email) as Row | undefined);
  if (!email || !row) return { ok: false, error: 'no-code' };
  const now = deps.now().getTime();
  const attempts = Number(row.attempts);
  if (attempts >= MAX_ATTEMPTS) return { ok: false, error: 'too-many-attempts' };
  if (Number(row.expires_at) <= now) return { ok: false, error: 'expired' };

  const code = typeof rawCode === 'string' ? rawCode.replace(/\s/g, '') : '';
  const expected = Buffer.from(String(row.code_hash), 'hex');
  if (!timingSafeEqual(expected, Buffer.from(hashCode(deps.secret, email, code), 'hex'))) {
    deps.db.prepare('UPDATE login_codes SET attempts = ? WHERE email = ?').run(attempts + 1, email);
    return { ok: false, error: attempts + 1 >= MAX_ATTEMPTS ? 'too-many-attempts' : 'wrong-code' };
  }

  deps.db.prepare('DELETE FROM login_codes WHERE email = ?').run(email);
  deps.db.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT (email) DO NOTHING').run(randomUUID(), email, now);
  const user = deps.db.prepare('SELECT id FROM users WHERE email = ?').get(email) as Row;
  const token = randomBytes(32).toString('base64url');
  deps.db
    .prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(token), String(user.id), now, now + SESSION_TTL);
  return { ok: true, email, token };
}

/** Adresse zur Sitzung, oder `null`, wenn unbekannt oder abgelaufen. */
export function sessionEmail(deps: AuthDeps, token: string | undefined): string | null {
  if (!token) return null;
  const row = deps.db
    .prepare('SELECT users.email AS email FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?')
    .get(hashToken(token), deps.now().getTime()) as Row | undefined;
  return row ? String(row.email) : null;
}

export function endSession(deps: AuthDeps, token: string | undefined): void {
  if (token) deps.db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}
