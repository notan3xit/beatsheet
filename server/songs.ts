import * as A from '@automerge/automerge/slim';
import { parseNotebookFile, serializeNotebook } from '../src/persistence/fileFormat.ts';
import { initAutomerge, songOf, type SongDocument } from '../src/persistence/songDoc.ts';
import { changesAllowed, createWorkbookDoc, isValidWorkbookDoc, withOrder, type WorkbookDocument } from '../src/persistence/workbookDoc.ts';
import type { Database } from './db.ts';
import { HttpError, type Reply } from './http.ts';
import { SONG_OVERHEAD, type QuotaProblem } from './limits.ts';

interface SongRow {
  id: string;
  doc: Uint8Array;
  deleted: number;
}

interface ClientSong {
  id: string;
  base: A.Heads;
  changes?: string;
}

const toBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
const fromBase64 = (text: string) => new Uint8Array(Buffer.from(text, 'base64'));

/** Fragt die Grenzen des Workbook-Besitzers ab; `growth` in Byte. */
type QuotaCheck = (growth: number) => QuotaProblem | null;

/** Jeder Automerge-Block beginnt damit. `loadIncremental` überspringt Unlesbares sonst stillschweigend. */
const CHUNK_MAGIC = [0x85, 0x6f, 0x4a, 0x83];
const isChunkData = (bytes: Uint8Array) => CHUNK_MAGIC.every((byte, i) => bytes[i] === byte);

/** Prüfung vor dem Speichern (design.md D5). */
function isValid(doc: SongDocument, id: string, now: Date): boolean {
  try {
    if (A.getMissingDeps(doc, []).length > 0) return false;
    const song = songOf(doc);
    return song.id === id && parseNotebookFile(serializeNotebook([song], now)).ok;
  } catch {
    return false;
  }
}

/** Heads prüft nur, wer sie auch kennt: Unbekannte oder unlesbare Heads gelten als getrennte Herkunft. */
function knowsHeads(doc: SongDocument, heads: A.Heads): boolean {
  try {
    return heads.length > 0 && A.hasHeads(doc, heads);
  } catch {
    return false;
  }
}

/** `POST /songs`: bringt das vollständige Dokument mit; Grabsteine belegen ihre ID weiter. */
export async function addSong(db: Database, workbookId: string, body: Record<string, unknown>, now: Date, quota: QuotaCheck): Promise<Reply> {
  await initAutomerge();
  const { id, doc } = body;
  if (typeof id !== 'string' || !id || typeof doc !== 'string') throw new HttpError(400, 'invalid-body');
  if (db.prepare('SELECT 1 FROM songs WHERE id = ?').get(id)) throw new HttpError(409, 'exists');
  let loaded: SongDocument;
  try {
    loaded = A.load(fromBase64(doc));
  } catch {
    throw new HttpError(422, 'invalid-song');
  }
  if (!isValid(loaded, id, now)) throw new HttpError(422, 'invalid-song');
  const saved = A.save(loaded);
  const problem = quota(saved.length + SONG_OVERHEAD);
  if (problem) throw new HttpError(409, problem);
  db.prepare('INSERT INTO songs (id, workbook_id, doc, deleted, updated_at) VALUES (?, ?, ?, 0, ?)').run(id, workbookId, saved, now.getTime());
  return { status: 201, body: { heads: A.getHeads(loaded) } };
}

export function deleteSong(db: Database, workbookId: string, id: string, now: Date): Reply {
  const { changes } = db
    .prepare('UPDATE songs SET deleted = 1, doc = ?, updated_at = ? WHERE id = ? AND workbook_id = ? AND deleted = 0')
    .run(new Uint8Array(), now.getTime(), id, workbookId);
  if (changes === 0) throw new HttpError(404, 'not-found');
  return { status: 204 };
}

/** Verschiebt einen Song; Dokument und Heads bleiben (account-songs, design.md D7). */
export async function moveSong(db: Database, from: string, to: string, id: string, now: Date, quota: QuotaCheck): Promise<Reply> {
  await initAutomerge();
  const row = db.prepare('SELECT doc FROM songs WHERE id = ? AND workbook_id = ? AND deleted = 0').get(id, from) as { doc: Uint8Array } | undefined;
  if (!row) throw new HttpError(404, 'not-found');
  const problem = quota(row.doc.length + SONG_OVERHEAD);
  if (problem) throw new HttpError(409, problem);
  db.prepare('UPDATE songs SET workbook_id = ?, updated_at = ? WHERE id = ?').run(to, now.getTime(), id);
  return { status: 200, body: { heads: A.getHeads(A.load(row.doc)) } };
}

function parseSongs(body: Record<string, unknown>): ClientSong[] {
  const { songs } = body;
  const valid =
    Array.isArray(songs) &&
    songs.every(
      (s: Partial<ClientSong> | null) =>
        typeof s?.id === 'string' &&
        Array.isArray(s.base) &&
        s.base.every((head) => typeof head === 'string') &&
        (s.changes === undefined || typeof s.changes === 'string'),
    ) &&
    new Set(songs.map((s: ClientSong) => s.id)).size === songs.length;
  if (!valid) throw new HttpError(400, 'invalid-body');
  return songs as ClientSong[];
}

/** Das Workbook, in dem der Song jetzt liegt, sofern die Adresse dort Mitglied ist. */
function movedTo(db: Database, id: string, email: string): string | undefined {
  const row = db
    .prepare('SELECT s.workbook_id AS id FROM songs s JOIN members m ON m.workbook_id = s.workbook_id WHERE s.id = ? AND s.deleted = 0 AND m.email = ?')
    .get(id, email) as { id: string } | undefined;
  return row?.id;
}

/** Abgleich mit Heads (design.md D4); `changed` meldet, ob sich der Stand des Workbooks geändert hat. */
export async function syncSongs(db: Database, workbookId: string, email: string, body: Record<string, unknown>, now: Date, quota: QuotaCheck): Promise<Reply & { changed: boolean }> {
  await initAutomerge();
  const client = parseSongs(body);
  const rows = db.prepare('SELECT id, doc, deleted FROM songs WHERE workbook_id = ?').all(workbookId) as unknown as SongRow[];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const named = new Set(client.map((s) => s.id));
  const replies: unknown[] = [];
  let changed = false;

  for (const row of rows) {
    if (!named.has(row.id) && !row.deleted) replies.push({ id: row.id, status: 'new', doc: toBase64(row.doc) });
  }

  for (const { id, base, changes } of client) {
    const row = byId.get(id);
    if (!row || row.deleted) {
      const to = row ? undefined : movedTo(db, id, email);
      replies.push(to ? { id, status: 'moved', to } : { id, status: 'deleted' });
      continue;
    }
    const server: SongDocument = A.load(row.doc);
    if (!knowsHeads(server, base)) {
      replies.push({ id, status: 'unrelated', doc: toBase64(row.doc) });
      continue;
    }

    const bytes = fromBase64(changes ?? '');
    let merged = server;
    let clientHeads = base;
    if (bytes.length > 0) {
      try {
        if (!isChunkData(bytes)) throw new Error('keine Automerge-Daten');
        merged = A.loadIncremental(A.clone(server), bytes);
        // Der Client-Stand: base plus seine Änderungen, ohne das, was andere inzwischen geschrieben haben
        clientHeads = A.getHeads(A.loadIncremental(A.clone(A.view(server, base)), bytes));
      } catch {
        replies.push({ id, status: 'invalid', doc: toBase64(row.doc) });
        continue;
      }
      if (!isValid(merged, id, now)) {
        replies.push({ id, status: 'invalid', doc: toBase64(row.doc) });
        continue;
      }
      if (A.getHeads(merged).join() !== A.getHeads(server).join()) {
        const saved = A.save(merged);
        const problem = quota(saved.length - row.doc.length);
        if (problem) {
          // Der Stand bleibt; Änderungen anderer erreichen das Gerät trotzdem (design.md D3)
          const foreign = A.saveSince(server, base);
          replies.push({ id, status: 'quota', reason: problem, ...(foreign.length > 0 ? { changes: toBase64(foreign) } : {}), heads: A.getHeads(server) });
          continue;
        }
        db.prepare('UPDATE songs SET doc = ?, updated_at = ? WHERE id = ?').run(saved, now.getTime(), id);
        changed = true;
      }
    }

    const foreign = A.saveSince(merged, clientHeads);
    replies.push({ id, status: 'ok', ...(foreign.length > 0 ? { changes: toBase64(foreign) } : {}), heads: A.getHeads(merged) });
  }
  return { status: 200, body: { songs: replies }, changed };
}

interface ClientWorkbookDoc {
  base: A.Heads;
  changes?: string;
}

/** Der optionale Teil `workbook` des Abgleichs; `undefined`, wenn er fehlt (design.md D3). */
export function parseWorkbookPart(body: Record<string, unknown>): ClientWorkbookDoc | undefined {
  const { workbook } = body;
  if (workbook === undefined) return undefined;
  const part = workbook as Partial<ClientWorkbookDoc> | null;
  const valid =
    typeof part === 'object' &&
    part !== null &&
    Array.isArray(part.base) &&
    part.base.every((head) => typeof head === 'string') &&
    (part.changes === undefined || typeof part.changes === 'string');
  if (!valid) throw new HttpError(400, 'invalid-body');
  return part as ClientWorkbookDoc;
}

/** Gleicht das Workbook-Dokument ab; legt es beim ersten Mal an (design.md D2, D3). */
export async function syncWorkbookDoc(
  db: Database,
  workbookId: string,
  account: string,
  { base, changes }: ClientWorkbookDoc,
  quota: QuotaCheck,
  personal: boolean,
): Promise<{ reply: unknown; changed: boolean }> {
  await initAutomerge();
  const row = db.prepare('SELECT doc FROM workbook_docs WHERE workbook_id = ?').get(workbookId) as { doc: Uint8Array } | undefined;
  let server: WorkbookDocument;
  let stored: Uint8Array;
  if (row) {
    // Ältere Dokumente erhalten die Reihenfolge hier, nie beim Client (sort-songs, design.md D2)
    const loaded = A.load<{ v: number }>(row.doc);
    server = withOrder(loaded);
    stored = server === loaded ? row.doc : A.save(server);
    if (server !== loaded) db.prepare('UPDATE workbook_docs SET doc = ? WHERE workbook_id = ?').run(stored, workbookId);
  } else {
    server = createWorkbookDoc();
    stored = A.save(server);
    db.prepare('INSERT INTO workbook_docs (workbook_id, doc) VALUES (?, ?)').run(workbookId, stored);
  }
  const bytes = fromBase64(changes ?? '');
  const serverHeads = A.getHeads(server);

  // Ein Gerät ohne Dokument erhält es als Changes seit dem Anfang
  if (base.length === 0 && bytes.length === 0) return { reply: { status: 'ok', changes: toBase64(A.saveSince(server, [])), heads: serverHeads }, changed: false };
  if (!knowsHeads(server, base)) return { reply: { status: 'unrelated', doc: toBase64(stored) }, changed: false };

  let merged = server;
  let clientHeads = base;
  if (bytes.length > 0) {
    try {
      if (!isChunkData(bytes)) throw new Error('keine Automerge-Daten');
      merged = A.loadIncremental(A.clone(server), bytes);
      clientHeads = A.getHeads(A.loadIncremental(A.clone(A.view(server, base)), bytes));
      if (!isValidWorkbookDoc(merged) || !changesAllowed(merged, serverHeads, A.getHeads(merged), account, personal)) throw new Error('ungültig');
    } catch {
      return { reply: { status: 'invalid', doc: toBase64(stored) }, changed: false };
    }
  }

  let changed = false;
  if (A.getHeads(merged).join() !== serverHeads.join()) {
    const saved = A.save(merged);
    const problem = quota(saved.length - stored.length);
    if (problem) {
      const foreign = A.saveSince(server, base);
      return { reply: { status: 'quota', reason: problem, ...(foreign.length > 0 ? { changes: toBase64(foreign) } : {}), heads: serverHeads }, changed: false };
    }
    db.prepare('UPDATE workbook_docs SET doc = ? WHERE workbook_id = ?').run(saved, workbookId);
    changed = true;
  }
  const foreign = A.saveSince(merged, clientHeads);
  return { reply: { status: 'ok', ...(foreign.length > 0 ? { changes: toBase64(foreign) } : {}), heads: A.getHeads(merged) }, changed };
}
