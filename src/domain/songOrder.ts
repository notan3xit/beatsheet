import { generateNKeysBetween } from 'fractional-indexing';

/** Position je Song-ID nach Fractional Indexing (sort-songs, design.md D1). */
export type Positions = Record<string, string>;

/** Rechteck einer Kachel in Anzeigereihenfolge. */
export interface TileRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title, 'de', { sensitivity: 'base' });
/** Positionen vergleicht die Bibliothek nach Codepunkten, nicht nach Sprache. */
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Anzeige: Songs mit Position danach, Gleichstand nach ID; dann die übrigen nach Titel (design.md D1). */
export function ordered<T extends { id: string; title: string }>(songs: readonly T[], positions: Positions | null): T[] {
  const at = (song: T) => positions?.[song.id];
  const placed = songs.filter((s) => at(s) !== undefined).sort((a, b) => compare(at(a)!, at(b)!) || compare(a.id, b.id));
  const rest = songs.filter((s) => at(s) === undefined).sort(byTitle);
  return [...placed, ...rest];
}

/**
 * Positionen, die `songId` an den Platz `slot` der angezeigten Liste `list` (ohne den Song) stellen.
 * Liegt der Platz hinter Songs ohne Position, erhalten diese ebenfalls Positionen (design.md D5).
 */
export function placeAt(list: readonly string[], positions: Positions, songId: string, slot: number): Positions {
  const placed = list.findIndex((id) => positions[id] === undefined);
  const prefix = placed === -1 ? list.length : placed;
  const last = prefix > 0 ? positions[list[prefix - 1]!]! : null;

  if (slot > prefix) {
    const tail = list.slice(prefix, slot);
    const keys = generateNKeysBetween(last, null, tail.length + 1);
    return Object.fromEntries([...tail, songId].map((id, i) => [id, keys[i]!]));
  }

  const low = slot > 0 ? positions[list[slot - 1]!]! : null;
  // Folgende Songs mit gleicher oder kleinerer Position rücken mit, sonst ließe sich nicht dazwischen einfügen
  let end = slot;
  while (end < prefix && low !== null && compare(positions[list[end]!]!, low) <= 0) end++;
  const high = end < prefix ? positions[list[end]!]! : null;
  const moved = [songId, ...list.slice(slot, end)];
  const keys = generateNKeysBetween(low, high, moved.length);
  return Object.fromEntries(moved.map((id, i) => [id, keys[i]!]));
}

/**
 * Platz unter dem Zeiger: vor der ersten Kachel, deren Zeile tiefer liegt oder deren linke Hälfte
 * in der Zeile des Zeigers rechts von ihm beginnt; sonst das Ende (design.md D5).
 */
export function slotAt(rects: readonly TileRect[], x: number, y: number): number {
  const index = rects.findIndex((r) => y < r.top || (y <= r.top + r.height && x < r.left + r.width / 2));
  return index === -1 ? rects.length : index;
}
