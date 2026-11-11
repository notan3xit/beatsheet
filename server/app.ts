import type { IncomingMessage, RequestListener, ServerResponse } from 'node:http';
import { endSession, requestCode, SESSION_TTL, sessionAccount, verifyCode, type AuthDeps } from './auth.ts';
import { createEvents } from './events.ts';
import { HttpError } from './http.ts';
import { createQuota, DEFAULT_LIMITS, type Limits } from './limits.ts';
import { parseProfile, profileOf, saveProfile } from './profile.ts';
import { serveStatic } from './static.ts';
import { handleWorkbookRequest } from './workbooks.ts';
import { PACKAGE_VERSION, VERSION_HEADER } from './version.ts';

export interface AppDeps extends AuthDeps {
  /** `false` nur für Tests über reines HTTP (`--insecure-cookie`, design.md D7). */
  secureCookie: boolean;
  /** Adresse der App für Links in Einladungsmails. */
  appUrl?: string;
  /** Verzeichnis der gebauten Oberfläche; ohne Angabe nur die API. */
  staticDir?: string;
  /** Abweichende Grenzen, für Tests. */
  limits?: Partial<Limits>;
  /** Version des Servers, ohne Angabe aus `package.json`; ältere Apps dürfen keine Songs übertragen (outdated-app, design.md D2). */
  version?: string;
}

const COOKIE = 'beatsheet_session';

const headerOf = (request: IncomingMessage, name: string) => {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};
const MAX_BODY = 4096;
const MAX_WORKBOOK_BODY = 2 * 1024 * 1024;

function send(response: ServerResponse, status: number, body?: unknown, headers: Record<string, string> = {}) {
  if (body === undefined) {
    response.writeHead(status, headers).end();
  } else {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers }).end(JSON.stringify(body));
  }
}

/** JSON-Körper mit Pflicht-Content-Type und Größenbegrenzung (design.md D4). */
async function readJson(request: IncomingMessage, limit = MAX_BODY): Promise<Record<string, unknown>> {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'unsupported-media-type');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, 'too-large');
    chunks.push(chunk);
  }
  try {
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (typeof body === 'object' && body !== null && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fällt auf den Fehler unten
  }
  throw new HttpError(400, 'invalid-json');
}

function tokenOf(request: IncomingMessage): string | undefined {
  for (const part of (request.headers.cookie ?? '').split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === COOKIE) return value.join('=') || undefined;
  }
  return undefined;
}

function cookie(value: string, maxAge: number, secure: boolean) {
  return `${COOKIE}=${value}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export function createApp(deps: AppDeps): RequestListener {
  const limits = { ...DEFAULT_LIMITS, ...deps.limits };
  const quota = createQuota(deps.db, limits, deps.now);
  const events = createEvents(limits);

  async function handle(request: IncomingMessage, response: ServerResponse) {
    const path = (request.url ?? '/').split('?')[0];
    const route = `${request.method} ${path}`;

    if (route === 'GET /api/health') {
      const noStore = { 'Cache-Control': 'no-store' };
      try {
        deps.db.prepare('SELECT COUNT(*) FROM sqlite_master').get();
      } catch (error) {
        console.error(error);
        return send(response, 503, { error: 'unhealthy' }, noStore);
      }
      return send(response, 200, { status: 'ok' }, noStore);
    }
    if (route === 'POST /api/auth/code') {
      const body = await readJson(request);
      const result = await requestCode(deps, body.email);
      if (result === 'sent') return send(response, 204);
      return send(response, result === 'invalid-email' ? 400 : 429, { error: result });
    }
    if (route === 'POST /api/auth/verify') {
      const body = await readJson(request);
      const result = verifyCode(deps, body.email, body.code);
      if (!result.ok) return send(response, 400, { error: result.error });
      return send(response, 200, { email: result.email, account: result.account }, { 'Set-Cookie': cookie(result.token, SESSION_TTL / 1000, deps.secureCookie) });
    }
    if (route === 'GET /api/auth/session') {
      const session = sessionAccount(deps, tokenOf(request));
      return session ? send(response, 200, session) : send(response, 401, { error: 'unauthenticated' });
    }
    if (route === 'GET /api/auth/profile' || route === 'PUT /api/auth/profile') {
      const email = sessionAccount(deps, tokenOf(request))?.email;
      if (!email) return send(response, 401, { error: 'unauthenticated' });
      if (request.method === 'GET') return send(response, 200, { profile: profileOf(deps.db, email) });
      const profile = parseProfile(await readJson(request));
      return send(response, 200, { profile: saveProfile({ db: deps.db, events }, email, profile) });
    }
    if (route === 'POST /api/auth/logout') {
      await readJson(request);
      endSession(deps, tokenOf(request));
      return send(response, 204, undefined, { 'Set-Cookie': cookie('', 0, deps.secureCookie) });
    }
    if (route === 'GET /api/events') {
      const email = sessionAccount(deps, tokenOf(request))?.email;
      if (!email) return send(response, 401, { error: 'unauthenticated' });
      if (!events.connect(email, response)) send(response, 429, { error: 'too-many-connections' });
      return;
    }
    if (path === '/api/workbooks' || path?.startsWith('/api/workbooks/')) {
      const session = sessionAccount(deps, tokenOf(request));
      if (!session) return send(response, 401, { error: 'unauthenticated' });
      const reply = await handleWorkbookRequest({ ...deps, version: deps.version ?? PACKAGE_VERSION, events, limits, quota }, {
        ...session,
        method: request.method ?? 'GET',
        version: headerOf(request, VERSION_HEADER),
        path: path.split('/').slice(3),
        body: () => readJson(request, MAX_WORKBOOK_BODY),
      });
      return send(response, reply.status, reply.body);
    }
    if (deps.staticDir && (request.method === 'GET' || request.method === 'HEAD') && (await serveStatic(deps.staticDir, path ?? '/', request.method, response))) return;
    send(response, 404, { error: 'not-found' });
  }

  return (request, response) => {
    handle(request, response).catch((error: unknown) => {
      if (error instanceof HttpError) return send(response, error.status, { error: error.message });
      console.error(error);
      send(response, 500, { error: 'internal' });
    });
  };
}
