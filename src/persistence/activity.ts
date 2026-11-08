import * as A from '@automerge/automerge/slim';
import type { Song } from '../domain/types';
import { readChangeMessage, sameSong, songOf, type SongDocument } from './songDoc';

/** Zeit (Unixzeit in Sekunden, Uhr des schreibenden Geräts) und Autor der neuesten Änderung (song-activity, design.md D5). */
export interface LastChange {
  time: number;
  author: string | null;
}

export function lastChange(doc: SongDocument): LastChange | null {
  let latest: LastChange | null = null;
  for (const hash of A.getHeads(doc)) {
    const change = A.inspectChange(doc, hash);
    if (!change || (latest && change.time <= latest.time)) continue;
    latest = { time: change.time, author: readChangeMessage(change.message).by ?? null };
  }
  return latest;
}

/** Inhalt ohne `revision` und `updatedAt`, die jede Änderung mitbringt. */
const content = (song: Song): Song => ({
  ...song,
  revision: 0,
  updatedAt: '',
  patterns: song.patterns.map((p) => ({ ...p, revision: 0, updatedAt: '' })),
});

const byOthers = (changes: A.ChangeMetadata[], me: string) => changes.some((c) => readChangeMessage(c.message).by !== me);

/**
 * Haben andere seit `seen` sichtbar geändert (design.md D6)? Ohne gesehenen Stand: Enthält der Song Änderungen anderer?
 * Ist ein gesehener Head unbekannt, lässt sich sicher Neues nicht bestimmen: nicht neu.
 */
export function isNew(doc: SongDocument, seen: A.Heads | null, me: string): boolean {
  if (!seen) return byOthers(A.getChangesMetaSince(doc, []), me);
  if (!seen.every((head) => A.hasHeads(doc, [head]))) return false;
  if (!byOthers(A.getChangesMetaSince(doc, seen), me)) return false;
  return !sameSong(content(songOf(A.view(doc, seen))), content(songOf(doc)));
}
