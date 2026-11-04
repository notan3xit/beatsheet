import type { IncomingMessage, RequestListener, ServerResponse } from 'node:http';
import { endSession, requestCode, SESSION_TTL, sessionEmail, verifyCode, type AuthDeps } from './auth.ts';
import { createEvents } from './events.ts';
import { HttpError } from './http.ts';
import { createQuota, DEFAULT_LIMITS, type Limits } from './limits.ts';
import { handleWorkbookRequest } from './workbooks.ts';

export interface AppDeps extends AuthDeps {
  /** `false` nur für Tests über reines HTTP (`--insecure-cookie`, design.md D7). */
  secureCookie: boolean;
  /** Adresse der App für Links in Einladungsmails. */
  appUrl?: string;
  /** Abweichende Grenzen, für Tests. */
  limits?: Partial<Limits>;
}

const COOKIE = 'beatsheet_session';
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
      return send(response, 200, { email: result.email }, { 'Set-Cookie': cookie(result.token, SESSION_TTL / 1000, deps.secureCookie) });
    }
    if (route === 'GET /api/auth/session') {
      const email = sessionEmail(deps, tokenOf(request));
      return email ? send(response, 200, { email }) : send(response, 401, { error: 'unauthenticated' });
    }
    if (route === 'POST /api/auth/logout') {
      await readJson(request);
      endSession(deps, tokenOf(request));
      return send(response, 204, undefined, { 'Set-Cookie': cookie('', 0, deps.secureCookie) });
    }
    if (route === 'GET /api/events') {
      const email = sessionEmail(deps, tokenOf(request));
      if (!email) return send(response, 401, { error: 'unauthenticated' });
      if (!events.connect(email, response)) send(response, 429, { error: 'too-many-connections' });
      return;
    }
    if (path === '/api/workbooks' || path?.startsWith('/api/workbooks/')) {
      const email = sessionEmail(deps, tokenOf(request));
      if (!email) return send(response, 401, { error: 'unauthenticated' });
      const reply = await handleWorkbookRequest({ ...deps, events, limits, quota }, {
        email,
        method: request.method ?? 'GET',
        path: path.split('/').slice(3),
        body: () => readJson(request, MAX_WORKBOOK_BODY),
      });
      return send(response, reply.status, reply.body);
    }
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
