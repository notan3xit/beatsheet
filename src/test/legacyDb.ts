import { openDB } from 'idb';

/** Legt eine Datenbank im Format der Vorversion (v2, Store "songs", ein Song als JSON pro Datensatz) an. */
export async function createV2Database(name: string, songs: object[]) {
  const db = await openDB(name, 2, {
    upgrade(database) {
      database.createObjectStore('songs', { keyPath: 'id' });
    },
  });
  for (const song of songs) await db.put('songs', song);
  db.close();
}
