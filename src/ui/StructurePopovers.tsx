import { useState, type ReactNode } from 'react';
import { ValidationError } from '../domain/pattern';
import { allBars } from '../domain/songPatterns';
import {
  appendBlockLike,
  canChangeBarLength,
  changeBarLength,
  deleteBar,
  deleteSegment,
  duplicateSegment,
  insertBarAfter,
  insertBarBefore,
  insertSegmentAfter,
  moveSegment,
  renameSegment,
} from '../domain/structure';
import type { Song } from '../domain/types';
import { openSongOf } from '../state/notebookStore';
import { AccentEditor } from './AccentEditor';
import { CommitField } from './CommitField';
import { useConfirm } from './ConfirmDialog';
import { PatternChips } from './PatternChips';
import { useSongPlayback } from './playback';
import { PlayButton } from './PlayButton';
import { useNotebook, useOpenSong, useStore } from './useLibrary';

/** Breite des Popovers in Beats, für die Begrenzung am rechten Zeilenrand (design.md D4). */
export const POPOVER_BEATS = 11;

/** Nicht modales Popover an der Auswahl; x in Beats relativ zur Zeile. */
export function Popover({ label, x, children }: { label: string; x: number; children: ReactNode }) {
  return (
    <div role="dialog" aria-label={label} className="structure-popover" style={{ left: `calc(var(--beat) * ${x})` }}>
      {children}
    </div>
  );
}

/** Änderung am Song mit Fehleranzeige für Validierungsfehler. */
function useApply() {
  const store = useStore();
  const [error, setError] = useState<string | null>(null);
  const apply = (change: (song: Song) => Song) => {
    try {
      store.updateSong(change);
      setError(null);
    } catch (e) {
      if (e instanceof ValidationError) setError(e.message);
      else throw e;
    }
  };
  const alert = error && (
    <p role="alert" className="message alert">
      {error}
    </p>
  );
  return { apply, alert };
}

/** Abspiel-Aktionen eines Popovers: ab dem ersten Takt bis Songende, oder vom ersten bis letzten Takt in Schleife. `onPlay` schließt das Popover. */
function PlayActions({ first, last, onPlay }: { first?: string; last?: string; onPlay: () => void }) {
  const playback = useSongPlayback();
  const disabled = !playback.available || !first || !last;
  return (
    <div className="popover-actions">
      <PlayButton
        symbol="play"
        label="Ab hier abspielen"
        disabled={disabled}
        onClick={() => {
          if (!first) return;
          playback.start({ from: first, to: 'end' }, false);
          onPlay();
        }}
      />
      <PlayButton
        symbol="loop"
        label="In Schleife abspielen"
        disabled={disabled}
        onClick={() => {
          if (!first || !last) return;
          playback.start({ from: first, to: last }, true);
          onPlay();
        }}
      />
    </div>
  );
}

export function SegmentPopover({
  segmentId,
  onSelectSegment,
  onPlay,
}: {
  segmentId: string;
  onSelectSegment: (id: string) => void;
  onPlay: () => void;
}) {
  const store = useStore();
  const song = useOpenSong();
  const { locked } = useNotebook();
  const confirm = useConfirm();
  const index = song.segments.findIndex((s) => s.id === segmentId);
  const segment = song.segments[index]!;
  const segmentBars = segment.blocks.flatMap((b) => b.bars);
  const update = (change: (s: Song) => Song) => store.updateSong(change);

  const insertAfter = () => {
    update((s) => insertSegmentAfter(s, segmentId));
    const created = openSongOf(store.getState())?.segments[index + 1];
    if (created) onSelectSegment(created.id);
  };

  const head = (
    <div className="popover-section">
      <PlayActions first={segmentBars[0]?.id} last={segmentBars.at(-1)?.id} onPlay={onPlay} />
    </div>
  );
  if (locked) return head;

  return (
    <>
      {head}
      <div className="popover-section">
        <CommitField
          key={segmentId}
          label="Segmentname"
          value={segment.name}
          onCommit={(draft) => {
            update((s) => renameSegment(s, segmentId, draft));
            return openSongOf(store.getState())?.segments.find((s) => s.id === segmentId)?.name ?? segment.name;
          }}
        />
        <div className="popover-actions">
          <button type="button" aria-label="Nach oben" title="Nach oben" disabled={index === 0} onClick={() => update((s) => moveSegment(s, segmentId, -1))}>
            ↑
          </button>
          <button
            type="button"
            aria-label="Nach unten"
            title="Nach unten"
            disabled={index === song.segments.length - 1}
            onClick={() => update((s) => moveSegment(s, segmentId, 1))}
          >
            ↓
          </button>
          <button type="button" onClick={() => update((s) => duplicateSegment(s, segmentId))}>
            Duplizieren
          </button>
          <button type="button" onClick={insertAfter}>
            Segment danach
          </button>
          <button type="button" onClick={() => update((s) => appendBlockLike(s, segmentId))}>
            Block anfügen
          </button>
          <button
            type="button"
            className="danger"
            onClick={async () => {
              if (await confirm(`Segment „${segment.name}“ mit allen Takten löschen?`)) update((s) => deleteSegment(s, segmentId));
            }}
          >
            Löschen
          </button>
        </div>
      </div>
    </>
  );
}

export function BarPopover({ barIds, onPlay }: { barIds: string[]; onPlay: () => void }) {
  const song = useOpenSong();
  const { locked } = useNotebook();
  const { apply, alert } = useApply();
  const ordered = allBars(song);
  const bars = ordered.filter((b) => barIds.includes(b.id));
  const numbers = bars.map((b) => ordered.indexOf(b) + 1);
  const title = bars.length === 1 ? `Takt ${numbers[0]}` : `Takte ${numbers[0]}–${numbers.at(-1)}`;
  const first = bars[0]!;
  const last = bars.at(-1)!;
  const beats = bars.every((b) => b.beats === first.beats) ? `${first.beats}/4` : 'gemischt';

  const head = (
    <div className="popover-section popover-head">
      <h4 className="popover-title">{title}</h4>
      <PlayActions first={first.id} last={last.id} onPlay={onPlay} />
    </div>
  );
  if (locked) return head;

  return (
    <>
      {head}
      <div className="popover-section">
        <PatternChips kind="groove" barIds={barIds} apply={apply} />
        <PatternChips kind="fill" barIds={barIds} apply={apply} />
        <div role="group" aria-label="Länge" className="popover-actions">
          <span className="chips-label" aria-hidden="true">
            Länge
          </span>
          <button
            type="button"
            className="step-button"
            aria-label="Taktlänge verringern"
            title="Taktlänge verringern"
            disabled={!canChangeBarLength(song, barIds, -1)}
            onClick={() => apply((s) => changeBarLength(s, barIds, -1))}
          >
            −
          </button>
          <button
            type="button"
            className="step-button"
            aria-label="Taktlänge erhöhen"
            title="Taktlänge erhöhen"
            disabled={!canChangeBarLength(song, barIds, 1)}
            onClick={() => apply((s) => changeBarLength(s, barIds, 1))}
          >
            +
          </button>
          <output className="bar-length" aria-label="Taktlänge">
            {beats}
          </output>
        </div>
      </div>
      {bars.length === 1 && (
        <div className="popover-section">
          <AccentEditor key={first.id} barId={first.id} beats={first.beats} accents={first.accents} />
        </div>
      )}
      <div className="popover-section">
        <div className="popover-actions">
          <button type="button" onClick={() => apply((s) => insertBarBefore(s, first.id))}>
            Takt davor
          </button>
          <button type="button" onClick={() => apply((s) => insertBarAfter(s, last.id))}>
            Takt danach
          </button>
          <button type="button" className="danger" onClick={() => apply((s) => barIds.reduce(deleteBar, s))}>
            Löschen
          </button>
        </div>
      </div>
      {alert}
    </>
  );
}
