import { nextColor } from '../domain/pattern';
import { allBars } from '../domain/songPatterns';
import { assignPlaceholder, setBarProps } from '../domain/structure';
import type { PatternKind, Song } from '../domain/types';
import { beatsLabel, patternStyle } from './patternStyle';
import { songPatternOrder } from '../songbook/layout';
import { useOpenSong } from './useLibrary';

const LABELS: Record<PatternKind, { group: string; create: string; none: string }> = {
  groove: { group: 'Groove', create: 'Neuer Groove', none: 'Kein Groove' },
  fill: { group: 'Fill', create: 'Neuer Fill', none: 'Kein Fill' },
};

const MAX_CHIP = 10;
const short = (name: string) => (name.length > MAX_CHIP ? `${name.slice(0, MAX_CHIP - 1)}…` : name);

/**
 * Groove oder Fill der ausgewählten Takte als Farbchips (design.md D5): bestehende Patterns,
 * „neu“ in der nächsten freien Farbe, „kein“. data-pattern-* dient später als Ziehquelle.
 */
export function PatternChips({
  kind,
  barIds,
  apply,
}: {
  kind: PatternKind;
  barIds: readonly string[];
  apply: (change: (song: Song) => Song) => void;
}) {
  const song = useOpenSong();
  const labels = LABELS[kind];
  const key = kind === 'groove' ? 'grooveId' : 'fillId';
  const values = allBars(song)
    .filter((bar) => barIds.includes(bar.id))
    .map((bar) => bar[key]);
  const common = values.every((v) => v === values[0]) ? values[0] : undefined;
  const set = (id: string | null) => apply((s) => setBarProps(s, barIds, { [key]: id }));

  return (
    <div role="group" aria-label={labels.group} className="chips">
      <span className="chips-label" aria-hidden="true">
        {labels.group}
      </span>
      <button
        type="button"
        className="chip none step-button"
        aria-label={labels.none}
        aria-pressed={common === null}
        title={labels.none}
        onClick={() => set(null)}
      >
        −
      </button>
      <button
        type="button"
        className="chip new step-button"
        aria-label={labels.create}
        title={labels.create}
        data-pattern-new={kind}
        style={patternStyle(nextColor(song.patterns))}
        onClick={() => apply((s) => assignPlaceholder(s, barIds, kind))}
      >
        +
      </button>
      {songPatternOrder(song)
        .filter((p) => p.kind === kind)
        .map((p) => (
          <button
            key={p.id}
            type="button"
            className="chip"
            aria-label={p.name}
            aria-pressed={common === p.id}
            title={kind === 'fill' ? `${p.name} (${beatsLabel(p.beats.length)})` : p.name}
            data-pattern-id={p.id}
            style={patternStyle(p.color)}
            onClick={() => set(p.id)}
          >
            {common === p.id && (
              <span className="chip-check" aria-hidden="true">
                ✓
              </span>
            )}
            {short(p.name)}
          </button>
        ))}
    </div>
  );
}
