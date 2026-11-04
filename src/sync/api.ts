import type { Workbook } from '../domain/types';

/** Fehler einer Aktion; `unreachable` steht für Netzwerkfehler und jede unerwartete Antwort. */
export type SyncError =
  | 'unreachable'
  | 'unauthenticated'
  | 'gone'
  | 'invalid-title'
  | 'invalid-email'
  | 'already-member'
  | 'rate-limited'
  | 'not-owner'
  | 'not-empty'
  | 'exists'
  | 'invalid-song'
  | 'too-large'
  | 'personal'
  | 'not-personal'
  | QuotaReason
  | 'too-many-workbooks'
  | 'too-many-members';

/** Warum der Server Speicher verweigert: Grenze des Workbook-Besitzers oder aller Accounts. */
export type QuotaReason = 'quota-exceeded' | 'server-full';

export type SyncResult<T = object> = ({ ok: true } & T) | { ok: false; error: SyncError };

export interface OutgoingSong {
  id: string;
  base: string[];
  changes: Uint8Array;
}

export type SyncReply =
  | { id: string; status: 'new' | 'unrelated' | 'invalid'; doc: Uint8Array }
  | { id: string; status: 'deleted' }
  | { id: string; status: 'moved'; to: string }
  | { id: string; status: 'ok'; changes?: Uint8Array; heads: string[] }
  | { id: string; status: 'quota'; reason: QuotaReason; changes?: Uint8Array; heads: string[] };

/** Schnittstelle zum Server (workbook-sync, design.md D3). */
export interface SyncApi {
  listWorkbooks(): Promise<SyncResult<{ workbooks: Workbook[] }>>;
  createWorkbook(title: string): Promise<SyncResult>;
  renameWorkbook(id: string, title: string): Promise<SyncResult>;
  deleteWorkbook(id: string): Promise<SyncResult>;
  invite(id: string, email: string): Promise<SyncResult>;
  removeMember(id: string, email: string): Promise<SyncResult>;
  addSong(workbookId: string, songId: string, doc: Uint8Array): Promise<SyncResult<{ heads: string[] }>>;
  deleteSong(workbookId: string, songId: string): Promise<SyncResult>;
  moveSong(from: string, songId: string, to: string): Promise<SyncResult>;
  sync(workbookId: string, songs: OutgoingSong[]): Promise<SyncResult<{ songs: SyncReply[] }>>;
}

export type SyncFetch = (path: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<Response>;

const KNOWN_ERRORS = new Set<SyncError>(['invalid-title', 'invalid-email', 'already-member', 'rate-limited', 'not-owner', 'not-empty', 'exists', 'invalid-song', 'too-large', 'personal', 'not-personal', 'quota-exceeded', 'server-full', 'too-many-workbooks', 'too-many-members']);

function toBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(binary);
}

const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

type RawReply = { id: string; status: SyncReply['status']; doc?: string; changes?: string; heads?: string[]; to?: string; reason?: QuotaReason };

function decodeReply({ id, status, doc, changes, heads, to, reason }: RawReply): SyncReply {
  if (status === 'deleted') return { id, status };
  if (status === 'moved') return { id, status, to: to! };
  if (status === 'ok') return { id, status, heads: heads!, ...(changes ? { changes: fromBase64(changes) } : {}) };
  if (status === 'quota') return { id, status, reason: reason!, heads: heads!, ...(changes ? { changes: fromBase64(changes) } : {}) };
  return { id, status, doc: fromBase64(doc!) };
}

export function createSyncApi(fetcher: SyncFetch = (path, init) => fetch(path, init)): SyncApi {
  async function request<T extends object = object>(method: string, path: string, body?: unknown): Promise<SyncResult<T>> {
    try {
      const response = await fetcher(`/api/${path}`, {
        method,
        ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      });
      if (response.ok) return { ok: true, ...(response.status === 204 ? {} : ((await response.json()) as T)) } as SyncResult<T>;
      if (response.status === 401) return { ok: false, error: 'unauthenticated' };
      if (response.status === 404) return { ok: false, error: 'gone' };
      const { error } = (await response.json()) as { error?: SyncError };
      return { ok: false, error: response.status < 500 && error && KNOWN_ERRORS.has(error) ? error : 'unreachable' };
    } catch {
      return { ok: false, error: 'unreachable' };
    }
  }

  const member = (id: string, email: string) => `workbooks/${encodeURIComponent(id)}/members/${encodeURIComponent(email)}`;
  const workbook = (id: string) => `workbooks/${encodeURIComponent(id)}`;

  return {
    listWorkbooks: () => request('GET', 'workbooks'),
    createWorkbook: (title) => request('POST', 'workbooks', { title }),
    renameWorkbook: (id, title) => request('PATCH', workbook(id), { title }),
    deleteWorkbook: (id) => request('DELETE', workbook(id)),
    invite: (id, email) => request('POST', `${workbook(id)}/members`, { email }),
    removeMember: (id, email) => request('DELETE', member(id, email)),
    addSong: (workbookId, songId, doc) => request('POST', `${workbook(workbookId)}/songs`, { id: songId, doc: toBase64(doc) }),
    deleteSong: (workbookId, songId) => request('DELETE', `${workbook(workbookId)}/songs/${encodeURIComponent(songId)}`),
    moveSong: (from, songId, to) => request('POST', `${workbook(from)}/songs/${encodeURIComponent(songId)}/move`, { to }),
    async sync(workbookId, songs) {
      const result = await request<{ songs: RawReply[] }>('POST', `${workbook(workbookId)}/sync`, {
        songs: songs.map(({ id, base, changes }) => ({ id, base, ...(changes.length > 0 ? { changes: toBase64(changes) } : {}) })),
      });
      return result.ok ? { ok: true, songs: result.songs.map(decodeReply) } : result;
    },
  };
}

export type ServerEvent = 'workbook' | 'workbooks';

export interface EventsConnection {
  close(): void;
  /** Endgültig beendet: `EventSource` versucht es etwa nach einer Fehlerantwort nicht erneut. */
  isClosed(): boolean;
}

export type EventsOpener = (onEvent: (event: ServerEvent, data: { id?: string }) => void, onOpen?: () => void) => EventsConnection;

export const openEventSource: EventsOpener = (onEvent, onOpen) => {
  const source = new EventSource('/api/events');
  for (const event of ['workbook', 'workbooks'] as const) {
    source.addEventListener(event, (e) => onEvent(event, JSON.parse((e as MessageEvent<string>).data) as { id?: string }));
  }
  if (onOpen) source.addEventListener('open', onOpen);
  return { close: () => source.close(), isClosed: () => source.readyState === EventSource.CLOSED };
};
