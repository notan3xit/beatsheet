/** Fehler der Anmeldung; `unreachable` steht für Netzwerkfehler und jede unerwartete Antwort. */
export type AccountError =
  | 'invalid-email'
  | 'rate-limited'
  | 'wrong-code'
  | 'expired'
  | 'too-many-attempts'
  | 'no-code'
  | 'unreachable';

export type AccountResult<T = object> = ({ ok: true } & T) | { ok: false; error: AccountError };

/** Schnittstelle zum Anmeldeserver (server-auth, design.md D8). */
export interface AccountApi {
  /** Adresse der laufenden Sitzung; `null` ohne Sitzung oder ohne erreichbaren Server. */
  session(): Promise<string | null>;
  requestCode(email: string): Promise<AccountResult>;
  verify(email: string, code: string): Promise<AccountResult<{ email: string }>>;
  logout(): Promise<AccountResult>;
}

const KNOWN_ERRORS = new Set<AccountError>(['invalid-email', 'rate-limited', 'wrong-code', 'expired', 'too-many-attempts', 'no-code']);
const unreachable = { ok: false as const, error: 'unreachable' as const };

async function errorOf(response: Response): Promise<AccountResult & { ok: false }> {
  try {
    const { error } = (await response.json()) as { error?: unknown };
    if (response.status < 500 && KNOWN_ERRORS.has(error as AccountError)) return { ok: false, error: error as AccountError };
  } catch {
    // keine JSON-Antwort: nicht unser Server
  }
  return unreachable;
}

export function createHttpAccountApi(base = '/api/auth'): AccountApi {
  const post = (path: string, body: unknown) =>
    fetch(`${base}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  return {
    async session() {
      try {
        const response = await fetch(`${base}/session`);
        if (!response.ok) return null;
        const { email } = (await response.json()) as { email?: unknown };
        return typeof email === 'string' ? email : null;
      } catch {
        return null;
      }
    },
    async requestCode(email) {
      try {
        const response = await post('code', { email });
        return response.status === 204 ? { ok: true } : await errorOf(response);
      } catch {
        return unreachable;
      }
    },
    async verify(email, code) {
      try {
        const response = await post('verify', { email, code });
        if (response.status !== 200) return await errorOf(response);
        const body = (await response.json()) as { email?: unknown };
        return typeof body.email === 'string' ? { ok: true, email: body.email } : unreachable;
      } catch {
        return unreachable;
      }
    },
    async logout() {
      try {
        const response = await post('logout', {});
        return response.status === 204 ? { ok: true } : await errorOf(response);
      } catch {
        return unreachable;
      }
    },
  };
}
