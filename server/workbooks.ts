import { randomUUID } from 'node:crypto';
import { HOUR, mailsLastHour, normalizeEmail, TOTAL_PER_HOUR, type AuthDeps } from './auth.ts';
import type { Database } from './db.ts';
import type { Events } from './events.ts';
import { HttpError, type Reply } from './http.ts';
import { profileOf } from './profile.ts';
import type { Limits, Quota } from './limits.ts';
import { isOutdated } from './version.ts';
import { addSong, deleteSong, moveSong, parseWorkbookPart, syncSongs, syncWorkbookDoc } from './songs.ts';

export interface WorkbookDeps extends AuthDeps {
  appUrl?: string;
  version: string;
  events: Events;
  limits: Limits;
  quota: Quota;
}

export interface WorkbookRequest {
  /** Adresse der Sitzung. */
  email: string;
  method: string;
  /** Version der App aus dem Header, falls gesendet. */
  version?: string;
  /** Pfadteile nach `/api/workbooks`, noch URL-kodiert. */
  path: string[];
  body: () => Promise<Record<string, unknown>>;
}

interface WorkbookRow {
  id: string;
  title: string;
  owner: string;
}

const DEFAULT_TITLE = 'Neues Workbook';
const PERSONAL_TITLE = 'Meine Songs';
const MAX_TITLE = 200;
const INVITATIONS_PER_HOUR = 20;

const notFound = () => new HttpError(404, 'not-found');

/** Getrimmter Titel. Steuerzeichen sind ausgeschlossen, weil der Titel im Betreff der Einladungsmail steht. */
function titleOf(raw: unknown): string {
  const title = typeof raw === 'string' ? raw.trim() : '';
  if (!title || title.length > MAX_TITLE || /[\p{Cc}\p{Zl}\p{Zp}]/u.test(title)) throw new HttpError(400, 'invalid-title');
  return title;
}

/** Besitzer zuerst, die übrigen in der Reihenfolge ihres Beitritts. */
export const membersOf = (db: Database, id: string, owner: string) => {
  const rows = db.prepare('SELECT email FROM members WHERE workbook_id = ? ORDER BY added_at, email').all(id) as unknown as { email: string }[];
  return [owner, ...rows.map((m) => m.email).filter((email) => email !== owner)];
};

const isPersonal = (db: Database, id: string) => db.prepare('SELECT 1 FROM personal_workbooks WHERE workbook_id = ?').get(id) !== undefined;

/** Profile der Mitglieder, die eines haben; nur Mitglieder sehen das Workbook (member-profiles, design.md D3). */
function profilesOf(db: Database, members: readonly string[]) {
  const entries = members.flatMap((email) => {
    const profile = profileOf(db, email);
    return profile ? [[email, profile] as const] : [];
  });
  return entries.length > 0 ? { profiles: Object.fromEntries(entries) } : {};
}

const present = (db: Database, row: WorkbookRow) => {
  const members = membersOf(db, row.id, row.owner);
  return {
    id: row.id,
    title: row.title,
    owner: row.owner,
    members,
    ...profilesOf(db, members),
    ...(isPersonal(db, row.id) ? { personal: true } : {}),
  };
};

/** Der eigene Bestand eines Accounts, beim ersten Abruf angelegt (account-songs, design.md D1). */
function ensurePersonal(deps: WorkbookDeps, email: string) {
  const { db } = deps;
  if (db.prepare('SELECT 1 FROM personal_workbooks WHERE owner = ?').get(email)) return;
  const id = randomUUID();
  const now = deps.now().getTime();
  db.prepare('INSERT INTO workbooks (id, title, owner, created_at) VALUES (?, ?, ?, ?)').run(id, PERSONAL_TITLE, email, now);
  db.prepare('INSERT INTO members (workbook_id, email, added_at) VALUES (?, ?, ?)').run(id, email, now);
  db.prepare('INSERT INTO personal_workbooks (owner, workbook_id) VALUES (?, ?)').run(email, id);
}

function findWorkbook(db: Database, id: string, email: string): WorkbookRow {
  const row = db
    .prepare('SELECT w.id AS id, w.title AS title, w.owner AS owner FROM workbooks w JOIN members m ON m.workbook_id = w.id WHERE w.id = ? AND m.email = ?')
    .get(id, email) as WorkbookRow | undefined;
  if (!row) throw notFound();
  return row;
}

function requireOwner(row: WorkbookRow, email: string) {
  if (row.owner !== email) throw new HttpError(403, 'not-owner');
}

function list(db: Database, email: string): Reply {
  const rows = db
    .prepare('SELECT w.id AS id, w.title AS title, w.owner AS owner FROM workbooks w JOIN members m ON m.workbook_id = w.id WHERE m.email = ? ORDER BY w.title, w.id')
    .all(email) as unknown as WorkbookRow[];
  return { status: 200, body: { workbooks: rows.map((row) => present(db, row)) } };
}

async function create(deps: WorkbookDeps, email: string, body: Record<string, unknown>): Promise<Reply> {
  const blank = body.title === undefined || (typeof body.title === 'string' && !body.title.trim());
  const row: WorkbookRow = { id: randomUUID(), title: blank ? DEFAULT_TITLE : titleOf(body.title), owner: email };
  const owned = deps.db
    .prepare('SELECT COUNT(*) AS n FROM workbooks WHERE owner = ? AND id NOT IN (SELECT workbook_id FROM personal_workbooks)')
    .get(email) as { n: number };
  if (Number(owned.n) >= deps.limits.ownedWorkbooks) throw new HttpError(409, 'too-many-workbooks');
  const now = deps.now().getTime();
  deps.db.prepare('INSERT INTO workbooks (id, title, owner, created_at) VALUES (?, ?, ?, ?)').run(row.id, row.title, email, now);
  deps.db.prepare('INSERT INTO members (workbook_id, email, added_at) VALUES (?, ?, ?)').run(row.id, email, now);
  deps.events.send([email], 'workbooks');
  return { status: 201, body: present(deps.db, row) };
}

function remove({ db, events }: WorkbookDeps, row: WorkbookRow, email: string): Reply {
  requireOwner(row, email);
  if (db.prepare('SELECT 1 FROM songs WHERE workbook_id = ? AND deleted = 0').get(row.id)) throw new HttpError(409, 'not-empty');
  const members = membersOf(db, row.id, row.owner);
  db.prepare('DELETE FROM songs WHERE workbook_id = ?').run(row.id);
  db.prepare('DELETE FROM workbook_docs WHERE workbook_id = ?').run(row.id);
  db.prepare('DELETE FROM members WHERE workbook_id = ?').run(row.id);
  db.prepare('DELETE FROM workbooks WHERE id = ?').run(row.id);
  events.send(members, 'workbooks');
  return { status: 204 };
}

async function invite(deps: WorkbookDeps, row: WorkbookRow, rawEmail: unknown): Promise<Reply> {
  const { db } = deps;
  const email = normalizeEmail(rawEmail);
  if (!email) throw new HttpError(400, 'invalid-email');
  if (db.prepare('SELECT 1 FROM members WHERE workbook_id = ? AND email = ?').get(row.id, email)) throw new HttpError(409, 'already-member');
  const members = db.prepare('SELECT COUNT(*) AS n FROM members WHERE workbook_id = ?').get(row.id) as { n: number };
  if (Number(members.n) >= deps.limits.workbookMembers) throw new HttpError(409, 'too-many-members');

  const now = deps.now().getTime();
  db.prepare('DELETE FROM invitations WHERE at <= ?').run(now - HOUR);
  const byOwner = Number((db.prepare('SELECT COUNT(*) AS n FROM invitations WHERE owner = ?').get(row.owner) as { n: number }).n);
  if (byOwner >= INVITATIONS_PER_HOUR || mailsLastHour(db, now) >= TOTAL_PER_HOUR) throw new HttpError(429, 'rate-limited');

  db.prepare('INSERT INTO invitations (owner, at) VALUES (?, ?)').run(row.owner, now);
  db.prepare('INSERT INTO members (workbook_id, email, added_at) VALUES (?, ?, ?)').run(row.id, email, now);
  // Mit Profil nennt die Mail Name und Adresse des Besitzers (design.md D7)
  const ownerProfile = profileOf(db, row.owner);
  const sender = ownerProfile ? `${ownerProfile.name} (${row.owner})` : row.owner;
  try {
    await deps.mail.send({
      to: email,
      subject: `${sender} hat dich zu „${row.title}“ eingeladen`,
      text:
        `${sender} hat dich zum Workbook „${row.title}“ in beatsheet eingeladen.\n\n` +
        `Melde dich mit dieser Adresse an, dann erscheint es auf deiner Startseite${deps.appUrl ? `: ${deps.appUrl}` : '.'}\n`,
    });
  } catch (error) {
    db.prepare('DELETE FROM members WHERE workbook_id = ? AND email = ?').run(row.id, email);
    throw error;
  }
  deps.events.send(membersOf(db, row.id, row.owner), 'workbooks');
  return { status: 204 };
}

function removeMember({ db, events }: WorkbookDeps, row: WorkbookRow, email: string, rawTarget: string): Reply {
  const target = normalizeEmail(rawTarget);
  if (target === row.owner) throw new HttpError(403, 'owner-cannot-leave');
  if (target !== email) requireOwner(row, email);
  const members = membersOf(db, row.id, row.owner);
  const { changes } = db.prepare('DELETE FROM members WHERE workbook_id = ? AND email = ?').run(row.id, target);
  if (changes === 0) throw notFound();
  // Auch an die entfernte Adresse
  events.send(members, 'workbooks');
  return { status: 204 };
}

/** Endpunkte unter `/api/workbooks` (design.md D3); die Sitzung ist bereits geprüft. */
export async function handleWorkbookRequest(deps: WorkbookDeps, request: WorkbookRequest): Promise<Reply> {
  const { db, events } = deps;
  const { email, method, body } = request;
  let path: string[];
  try {
    path = request.path.map(decodeURIComponent);
  } catch {
    throw notFound();
  }
  const [id, resource, item, action] = path;

  if (id === undefined) {
    if (method === 'GET') {
      ensurePersonal(deps, email);
      return list(db, email);
    }
    if (method === 'POST') return create(deps, email, await body());
    throw notFound();
  }

  const row = findWorkbook(db, id, email);
  // Teilen, Umbenennen und Löschen gibt es für den eigenen Bestand nicht
  if ((resource === undefined || resource === 'members') && isPersonal(db, id)) throw new HttpError(403, 'personal');
  if (resource === undefined) {
    if (method === 'PATCH') {
      requireOwner(row, email);
      const title = titleOf((await body()).title);
      db.prepare('UPDATE workbooks SET title = ? WHERE id = ?').run(title, id);
      events.send(membersOf(db, id, row.owner), 'workbooks');
      return { status: 200, body: present(db, { ...row, title }) };
    }
    if (method === 'DELETE') return remove(deps, row, email);
  }
  if (resource === 'members') {
    if (item === undefined && method === 'POST') {
      requireOwner(row, email);
      return invite(deps, row, (await body()).email);
    }
    if (item !== undefined && method === 'DELETE') return removeMember(deps, row, email, item);
  }
  const songsChanged = () => events.send(membersOf(db, id, row.owner), 'workbook', { id });
  /** Song-Inhalte nur von einer App, die nicht älter ist als der Server (design.md D2). */
  const requireCurrent = () => {
    if (isOutdated(request.version, deps.version)) throw new HttpError(409, 'outdated');
  };
  if (resource === 'songs') {
    if (item !== undefined && action === 'move' && method === 'POST') {
      const { to } = await body();
      if (typeof to !== 'string' || to === id) throw notFound();
      const target = findWorkbook(db, to, email);
      if (!isPersonal(db, id)) throw new HttpError(403, 'not-personal');
      // Beim selben Besitzer ändert sich die Belegung nicht
      const growth = target.owner === row.owner ? 0 : undefined;
      const reply = await moveSong(db, id, to, item, deps.now(), (bytes) => deps.quota.checkAccount(target.owner, growth ?? bytes));
      songsChanged();
      events.send(membersOf(db, to, target.owner), 'workbook', { id: to });
      return reply;
    }
    if (item === undefined && method === 'POST') {
      requireCurrent();
      const reply = await addSong(db, id, await body(), deps.now(), (growth) => deps.quota.check(row.owner, growth));
      songsChanged();
      return reply;
    }
    if (item !== undefined && method === 'DELETE') {
      const reply = deleteSong(db, id, item, deps.now());
      songsChanged();
      return reply;
    }
  }
  if (resource === 'sync' && item === undefined && method === 'POST') {
    requireCurrent();
    const request = await body();
    const part = parseWorkbookPart(request);
    const check = (growth: number) => deps.quota.check(row.owner, growth);
    const { changed, ...reply } = await syncSongs(db, id, email, request, deps.now(), check);
    // Der eigene Bestand hat kein Workbook-Dokument (design.md D2)
    const wb = part && !isPersonal(db, id) ? await syncWorkbookDoc(db, id, email, part, check) : undefined;
    if (changed || wb?.changed) songsChanged();
    return wb ? { ...reply, body: { ...(reply.body as object), workbook: wb.reply } } : reply;
  }
  throw notFound();
}
