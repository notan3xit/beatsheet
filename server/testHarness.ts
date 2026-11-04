import type { AddressInfo } from 'node:net';
import { createServer } from 'node:http';
import { createApp } from './app.ts';
import type { Limits } from './limits.ts';
import { openDatabase } from './db.ts';
import type { Mail } from './mail.ts';

const SECRET = Buffer.alloc(32, 7);

export interface Harness {
  url: string;
  mails: Mail[];
  db: ReturnType<typeof openDatabase>;
  advance(ms: number): void;
  /** Meldet die Adresse an (Code anfordern und bestätigen); liefert das Sitzungs-Cookie. */
  login(email: string): Promise<string>;
  /** JSON-Anfrage an die API; ohne `cookie` ohne Sitzung. */
  api(method: string, path: string, options?: { cookie?: string; body?: unknown }): Promise<Response>;
  close(): Promise<void>;
}

/** Server mit In-Memory-Datenbank, fester Uhr und gesammelten Mails auf einem freien Port. */
export async function startServer({ appUrl, limits, staticDir }: { appUrl?: string; limits?: Partial<Limits>; staticDir?: string } = {}): Promise<Harness> {
  let time = Date.parse('2026-11-04T12:00:00.000Z');
  const mails: Mail[] = [];
  const db = openDatabase(':memory:');
  let counter = 0;
  const server = createServer(
    createApp({
      db,
      secret: SECRET,
      now: () => new Date(time),
      newCode: () => String(100000 + ++counter),
      mail: { send: async (mail) => void mails.push(mail) },
      secureCookie: false,
      appUrl,
      limits,
      staticDir,
    }),
  );
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${port}`;

  const api: Harness['api'] = (method, path, { cookie, body } = {}) =>
    fetch(`${url}${path}`, {
      method,
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  return {
    url,
    mails,
    db,
    advance: (ms) => void (time += ms),
    api,
    async login(email) {
      // Über die Sperre für erneute Codes an dieselbe Adresse hinweg
      time += 31_000;
      const before = mails.length;
      await api('POST', '/api/auth/code', { body: { email } });
      const code = /\b(\d{6})\b/.exec(mails[before]!.text)![1]!;
      mails.splice(before);
      const response = await api('POST', '/api/auth/verify', { body: { email, code } });
      return response.headers.get('set-cookie')!.split(';')[0]!;
    },
    close() {
      const closed = new Promise<void>((resolve) => server.close(() => resolve()));
      server.closeAllConnections();
      return closed;
    },
  };
}

export const errorOf = async (response: Response) => ((await response.json()) as { error: string }).error;
