import * as A from '@automerge/automerge/slim';
import { parseNotebookFile, serializeNotebook } from '../src/persistence/fileFormat.ts';
import { initAutomerge, songOf, type SongDocument } from '../src/persistence/songDoc.ts';
import type { Database } from './db.ts';
import { HttpError, type Reply } from './http.ts';

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
export async function addSong(db: Database, workbookId: string, body: Record<string, unknown>, now: Date): Promise<Reply> {
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
  db.prepare('INSERT INTO songs (id, workbook_id, doc, deleted, updated_at) VALUES (?, ?, ?, 0, ?)').run(id, workbookId, A.save(loaded), now.getTime());
  return { status: 201, body: { heads: A.getHeads(loaded) } };
}

export function deleteSong(db: Database, workbookId: string, id: string, now: Date): Reply {
  const { changes } = db
    .prepare('UPDATE songs SET deleted = 1, doc = ?, updated_at = ? WHERE id = ? AND workbook_id = ? AND deleted = 0')
    .run(new Uint8Array(), now.getTime(), id, workbookId);
  if (changes === 0) throw new HttpError(404, 'not-found');
  return { status: 204 };
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

/** Abgleich mit Heads (design.md D4); `changed` meldet, ob sich der Stand des Workbooks geändert hat. */
export async function syncSongs(db: Database, workbookId: string, body: Record<string, unknown>, now: Date): Promise<Reply & { changed: boolean }> {
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
      replies.push({ id, status: 'deleted' });
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
        db.prepare('UPDATE songs SET doc = ?, updated_at = ? WHERE id = ?').run(A.save(merged), now.getTime(), id);
        changed = true;
      }
    }

    const foreign = A.saveSince(merged, clientHeads);
    replies.push({ id, status: 'ok', ...(foreign.length > 0 ? { changes: toBase64(foreign) } : {}), heads: A.getHeads(merged) });
  }
  return { status: 200, body: { songs: replies }, changed };
}
