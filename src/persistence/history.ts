import * as A from '@automerge/automerge/slim';
import { patternSubject, type Subject } from '../domain/history';
import type { Song } from '../domain/types';
import { readChangeMessage, songOf, type SongDocument } from './songDoc';

/** Eine Änderung des Dokuments in kausaler Reihenfolge (song-history, design.md D4). */
export interface HistoryStep {
  hash: string;
  /** Heads des Stands nach dieser Änderung: sie und alle davor. */
  heads: A.Heads;
  /** Unixzeit in Sekunden, nach der Uhr des schreibenden Geräts. */
  time: number;
  author: string | null;
  /** Bei einer Wiederherstellung die Zeit des Zielstands. */
  restore?: number;
  subject: Subject;
}

export interface SongHistory {
  steps: HistoryStep[];
  /** Stand nach der Änderung an Position `index`; `null` vor der ersten. */
  songAt(index: number): Song | null;
}

/** Felder der Song-Daten; `revision`, `updatedAt` und Kennungen gelten nicht als sichtbare Wirkung. */
const SONG_FIELDS = new Set<A.Prop>(['title', 'tempo', 'meter']);
const PATTERN_METADATA = new Set<A.Prop>(['revision', 'updatedAt']);

/** Platz eines Patterns in der Liste, über Einfügen und Löschen hinweg verfolgt. */
interface Slot {
  id: string | null;
}

/**
 * Bestimmt den Gegenstand aus den Patches einer Änderung (design.md D4). Die Reihenfolge der Patterns wird mitgeführt,
 * weil Patches Listenindizes nennen; neue Plätze erhalten ihre ID aus dem Stand nach der Änderung.
 */
function createSubjectTracker() {
  let slots: Slot[] = [];
  return (patches: A.Patch[], patternIds: () => string[]): Subject | null => {
    let song = false;
    let structure = false;
    /** Nur Verweise auf Patterns in Takten geleert: Folge des Löschens eines Patterns (song-history). */
    let onlyClearedReferences = true;
    const touched = new Set<Slot>();
    const removed: string[] = [];
    for (const patch of patches) {
      const [key, index, field] = patch.path;
      if (SONG_FIELDS.has(key!)) song = true;
      else if (key === 'segments') {
        structure = true;
        const last = patch.path.at(-1);
        if (!(patch.action === 'put' && patch.value === null && (last === 'grooveId' || last === 'fillId'))) onlyClearedReferences = false;
      }
      else if (key === 'patterns' && typeof index === 'number') {
        if (patch.path.length === 2 && patch.action === 'insert') {
          const added = patch.values.map((): Slot => ({ id: null }));
          slots.splice(index, 0, ...added);
          added.forEach((slot) => touched.add(slot));
        } else if (patch.path.length === 2 && patch.action === 'del') {
          for (const slot of slots.splice(index, patch.length ?? 1)) {
            touched.delete(slot);
            if (slot.id) removed.push(slot.id);
          }
        } else if (patch.path.length === 2 && patch.action === 'put') {
          const slot: Slot = { id: null };
          slots[index] = slot;
          touched.add(slot);
        } else if (!PATTERN_METADATA.has(field!)) {
          const slot = slots[index];
          if (slot) touched.add(slot);
        }
      }
    }
    const ids = patternIds();
    if (ids.length !== slots.length) slots = ids.map((): Slot => ({ id: null }));
    slots.forEach((slot, i) => (slot.id = ids[i]!));
    if (song) return 'song';
    if (structure && !(onlyClearedReferences && removed.length > 0)) return 'structure';
    if (structure) return patternSubject(removed[0]!);
    const first = [...touched][0]?.id ?? removed[0];
    return first ? patternSubject(first) : null;
  };
}

/** Liest die Historie eines Dokuments durch einmaliges Nachspielen seiner Änderungen. */
export function readHistory(doc: SongDocument): SongHistory {
  const steps: HistoryStep[] = [];
  const heads = new Set<string>();
  let replay = A.init<{ v: number; patterns?: { id: unknown }[] }>();
  const subjectOf = createSubjectTracker();
  let lastSubject: Subject = 'song';

  for (const bytes of A.getAllChanges(doc)) {
    const change = A.decodeChange(bytes);
    let patches: A.Patch[] = [];
    [replay] = A.applyChanges(replay, [bytes], { patchCallback: (p) => (patches = patches.concat(p)) });
    for (const dep of change.deps) heads.delete(dep);
    heads.add(change.hash);

    const ids = () => (replay.patterns ?? []).map((p) => String(p.id));
    const found = subjectOf(patches, ids);
    const subject: Subject = steps.length === 0 ? 'song' : (found ?? lastSubject);
    lastSubject = subject;

    const { by, restore } = readChangeMessage(change.message);
    steps.push({
      hash: change.hash,
      heads: [...heads],
      time: change.time,
      author: by ?? null,
      ...(restore === undefined ? {} : { restore }),
      subject,
    });
  }

  const cache = new Map<number, Song>();
  return {
    steps,
    songAt(index) {
      const step = steps[index];
      if (!step) return null;
      let song = cache.get(index);
      if (!song) {
        song = songOf(A.view(doc, step.heads));
        cache.set(index, song);
      }
      return song;
    },
  };
}
