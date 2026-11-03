import type { Deps } from '../domain/pattern';
import type { Song } from '../domain/types';

/** Song der Datei, dessen ID lokal unbekannt ist. */
export interface NewEntry {
  kind: 'new';
  song: Song;
  choice: 'add' | 'skip';
}

/** Song der Datei, dessen ID lokal existiert. */
export interface ExistingEntry {
  kind: 'existing';
  song: Song;
  existing: Song;
  /** Welche Fassung nach Revision und Änderungszeitpunkt neuer ist. */
  newer: 'file' | 'local';
  choice: 'replace' | 'copy' | 'skip';
}

export type ImportEntry = NewEntry | ExistingEntry;

export interface ImportSummary {
  added: number;
  replaced: number;
  copied: number;
  skipped: number;
}

export interface ImportResult {
  /** Zu übernehmende Songs (für `store.importSongs`). */
  songs: Song[];
  summary: ImportSummary;
}

const isNewer = (candidate: Song, current: Song) =>
  candidate.revision !== current.revision
    ? candidate.revision > current.revision
    : candidate.updatedAt > current.updatedAt;

/** Ein Eintrag je Song der Datei, mit Vorbelegung (design.md D2). */
export function planImport(
  local: readonly Song[],
  incoming: readonly Song[],
  { fromNewerVersion }: { fromNewerVersion: boolean },
): ImportEntry[] {
  const byId = new Map(local.map((song) => [song.id, song]));
  return incoming.map((song): ImportEntry => {
    const existing = byId.get(song.id);
    if (!existing) return { kind: 'new', song, choice: 'add' };
    const newer = isNewer(song, existing) ? 'file' : 'local';
    const choice = fromNewerVersion ? 'copy' : newer === 'file' ? 'replace' : 'skip';
    return { kind: 'existing', song, existing, newer, choice };
  });
}

/** Wendet die Auswahl an; der lokale Bestand selbst bleibt unberührt. */
export function applyImport(plan: readonly ImportEntry[], deps: Deps): ImportResult {
  const songs: Song[] = [];
  const summary: ImportSummary = { added: 0, replaced: 0, copied: 0, skipped: 0 };
  const now = () => deps.now().toISOString();

  for (const entry of plan) {
    if (entry.choice === 'skip') {
      summary.skipped++;
    } else if (entry.kind === 'new') {
      summary.added++;
      songs.push(entry.song);
    } else if (entry.choice === 'replace') {
      summary.replaced++;
      // Eine bewusst übernommene ältere Fassung gilt als jüngste Änderung.
      songs.push(
        entry.newer === 'file' ? entry.song : { ...entry.song, revision: entry.existing.revision + 1, updatedAt: now() },
      );
    } else {
      summary.copied++;
      const timestamp = now();
      songs.push({
        ...entry.song,
        id: deps.newId(),
        title: `${entry.song.title} (Kopie)`,
        revision: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }
  return { songs, summary };
}
