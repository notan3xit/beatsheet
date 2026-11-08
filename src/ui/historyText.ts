import { patternIdOf, type EditDiff, type SegmentChange, type Subject } from '../domain/history';
import type { Pattern, Song } from '../domain/types';

const DAY = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'long' });
const TIME = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });

/** Tag einer Unixzeit, z. B. „Mo., 2. November“. */
export const formatDay = (time: number) => DAY.format(time * 1000);
/** Uhrzeit einer Unixzeit, z. B. „20:31“. */
export const formatTime = (time: number) => TIME.format(time * 1000);
export const formatMoment = (time: number) => `${formatDay(time)}, ${formatTime(time)}`;

export const kindLabel = (pattern: Pattern) => (pattern.kind === 'fill' ? 'Fill' : 'Groove');
export const patternLabel = (pattern: Pattern) => `${kindLabel(pattern)} „${pattern.name}“`;

const findPattern = (song: Song | null, id: string) => song?.patterns.find((p) => p.id === id);

/** Gegenstand einer Bearbeitung als Text, z. B. „Groove „Verse““. */
export function subjectLabel(subject: Subject, before: Song | null, after: Song | null): string {
  const id = patternIdOf(subject);
  if (id) {
    const pattern = findPattern(after, id) ?? findPattern(before, id);
    return pattern ? patternLabel(pattern) : 'Pattern';
  }
  if (subject === 'structure') return 'Struktur';
  return before ? 'Song' : 'Song angelegt';
}

/** Art des Gegenstands für „<Art> auf diesen Stand“; das Pattern wird der Reihe nach in den Ständen gesucht. */
export function subjectKind(subject: Subject, ...songs: (Song | null)[]): string {
  const id = patternIdOf(subject);
  if (id) {
    const pattern = songs.map((song) => findPattern(song, id)).find(Boolean);
    return pattern?.kind === 'fill' ? 'Fill' : 'Groove';
  }
  return subject === 'structure' ? 'Struktur' : 'Song-Daten';
}

const schlag = (n: number) => `${n} ${n === 1 ? 'Schlag' : 'Schläge'}`;
const takte = (n: number) => `${n} ${n === 1 ? 'Takt' : 'Takte'}`;

function segmentText(change: SegmentChange): string {
  switch (change.type) {
    case 'added':
      return `Segment „${change.name}“ neu (${takte(change.bars)})`;
    case 'removed':
      return `Segment „${change.name}“ entfernt`;
    case 'renamed':
      return `„${change.from}“ → „${change.to}“`;
    case 'bars':
      return `${change.name}: ${change.from} → ${takte(change.to)}`;
    case 'blocks':
      return `${change.name}: ${change.from} → ${change.to} Blöcke`;
    case 'reassigned':
      return `${change.name}: ${takte(change.count)} neu belegt`;
    case 'moved':
      return 'Reihenfolge geändert';
  }
}

/** Zusammenfassung des Nettounterschieds für die Liste; leer, wenn sich netto nichts ändert. */
export function summaryText(diff: EditDiff, before: Song | null, after: Song): string {
  if (diff.kind === 'song') {
    if (diff.created) return `„${after.title}“, ${after.tempo} BPM`;
    const parts: string[] = [];
    if (diff.title) parts.push(`Titel „${diff.title.from}“ → „${diff.title.to}“`);
    if (diff.tempo) parts.push(`Tempo ${diff.tempo.from} → ${diff.tempo.to}`);
    if (diff.meter) parts.push(`Takt ${diff.meter.from}/4 → ${diff.meter.to}/4`);
    return parts.join(' · ');
  }
  if (diff.kind === 'structure') return diff.segments.map(segmentText).join(' · ');
  if (diff.status === 'removed') return 'gelöscht';
  const { added, removed, changed } = diff.hits;
  const hits = [added && `+${added}`, removed && `−${removed}`].filter(Boolean).join(' / ');
  const hitText = (hits ? `${hits} ${Math.max(added, removed) === 1 ? 'Schlag' : 'Schläge'}` : '') + (changed ? `${hits ? ', ' : ''}${hits ? changed : schlag(changed)} geändert` : '');
  if (diff.status === 'added') {
    const source = diff.copyOf ? (findPattern(before, diff.copyOf) ?? findPattern(after, diff.copyOf)) : undefined;
    if (source) return hitText ? `neu, Kopie von „${source.name}“ · ${hitText}` : `neu, Kopie von „${source.name}“`;
    return `neu · ${schlag(added)}`;
  }
  const parts: string[] = [];
  if (diff.name) parts.push(`umbenannt von „${diff.name.from}“`);
  if (diff.length) parts.push(`Länge ${diff.length.from} → ${diff.length.to} Beats`);
  if (diff.color) parts.push('Farbe');
  if (diff.meter) parts.push('Taktart');
  if (diff.grid) parts.push('Raster');
  if (hitText) parts.push(hitText);
  return parts.join(' · ');
}
