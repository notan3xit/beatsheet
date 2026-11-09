import { meterLabel, patternMeter, setPatternMeter, setSongMeter, songMeter } from '../domain/meter';
import { METERS, type Pattern } from '../domain/types';
import { MeterIcon } from './icons';
import { ValueSelect } from './ValueSelect';
import { useNotebook, useOpenSong, useStore } from './useLibrary';

const METER_OPTIONS = METERS.map((m) => ({ value: m, label: meterLabel(m) }));

/** Standard-Takt im Kopf der Doppelseite; entsperrt eine Auswahl, die wie die Tempoangabe aussieht. */
export function MeterMark() {
  const store = useStore();
  const song = useOpenSong();
  const { locked } = useNotebook();
  const meter = songMeter(song);

  return (
    <span className="song-meter" {...(locked ? { role: 'img', 'aria-label': `Standard-Takt: ${meterLabel(meter)}` } : {})}>
      <MeterIcon />
      <ValueSelect
        className="meter-mark"
        text={meterLabel(meter)}
        name="Standard-Takt"
        title={locked ? undefined : 'Standard-Takt des Songs'}
        value={meter}
        options={METER_OPTIONS}
        readOnly={locked}
        onChange={(m) => store.updateSong((s) => setSongMeter(s, m))}
      />
    </span>
  );
}

/** Taktart im Pattern-Editor: Symbol (entsperrt der Umschalter „Eigene Taktart“) und Wert in Textbreite. */
export function PatternMeter({ pattern }: { pattern: Pattern }) {
  const store = useStore();
  const song = useOpenSong();
  const { locked } = useNotebook();
  const own = pattern.meter !== undefined;
  const label = meterLabel(patternMeter(pattern, song));
  const set = (meter: number | undefined) => store.update(pattern.id, (p) => setPatternMeter(p, meter));

  return (
    <span className="pattern-meter">
      {locked ? (
        <span
          className="meter-own"
          {...(own ? { role: 'img', 'aria-label': 'Eigene Taktart', title: 'Eigene Taktart' } : {})}
        >
          <MeterIcon />
        </span>
      ) : (
        <button
          type="button"
          className={own ? 'meter-own on' : 'meter-own'}
          aria-pressed={own}
          aria-label="Eigene Taktart"
          title="Eigene Taktart"
          onClick={() => set(own ? undefined : songMeter(song))}
        >
          <MeterIcon />
        </button>
      )}
      <ValueSelect
        className={own ? 'value-control value-meter' : 'value-control value-meter follows'}
        text={label}
        name="Taktart"
        title={own ? undefined : 'Taktart des Songs'}
        value={patternMeter(pattern, song)}
        options={METER_OPTIONS}
        readOnly={locked || !own}
        onChange={set}
      />
    </span>
  );
}
