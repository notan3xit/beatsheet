import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Database = DatabaseSync;

/** Schema nach design.md D5; Zeitpunkte als Millisekunden seit 1970. */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS login_codes (
    email TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS code_requests (
    email TEXT NOT NULL,
    at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS code_requests_at ON code_requests (at);
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id),
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workbooks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    owner TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS members (
    workbook_id TEXT NOT NULL REFERENCES workbooks (id),
    email TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    PRIMARY KEY (workbook_id, email)
  );
  CREATE INDEX IF NOT EXISTS members_email ON members (email);
  CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,
    workbook_id TEXT NOT NULL REFERENCES workbooks (id),
    doc BLOB NOT NULL,
    deleted INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS songs_workbook ON songs (workbook_id);
  CREATE TABLE IF NOT EXISTS invitations (
    owner TEXT NOT NULL,
    at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS invitations_at ON invitations (at);
`;

export function openDatabase(path: string): Database {
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}

/** Server-Geheimnis für die Code-Hashes; beim ersten Start im Datenverzeichnis angelegt. */
export function loadSecret(dataDir: string): Buffer {
  const path = join(dataDir, 'secret');
  if (!existsSync(path)) writeFileSync(path, randomBytes(32), { mode: 0o600 });
  return readFileSync(path);
}
