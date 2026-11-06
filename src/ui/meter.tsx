import { meterLabel, patternMeter, setPatternMeter, setSongMeter, songMeter } from '../domain/meter';
import { METERS, type Pattern } from '../domain/types';
import { MeterIcon } from './icons';
import { useNotebook, useOpenSong, useStore } from './useLibrary';

const MeterOptions = () =>
  METERS.map((m) => (
    <option key={m} value={m}>
      {meterLabel(m)}
    </option>
  ));

/** Standard-Takt im Kopf der Doppelseite; entsperrt eine Auswahl, die wie die Tempoangabe aussieht. */
export function MeterMark() {
  const store = useStore();
  const song = useOpenSong();
  const { locked } = useNotebook();
  const meter = songMeter(song);

  if (locked) {
    return (
      <span className="song-meter" role="img" aria-label={`Standard-Takt: ${meterLabel(meter)}`}>
        <MeterIcon />
        <span className="meter-mark">{meterLabel(meter)}</span>
      </span>
    );
  }
  return (
    <span className="song-meter">
      <MeterIcon />
      <select
        className="meter-mark"
        aria-label="Standard-Takt"
        title="Standard-Takt des Songs"
        value={meter}
        onChange={(e) => store.updateSong((s) => setSongMeter(s, Number(e.target.value)))}
      >
        <MeterOptions />
      </select>
    </span>
  );
}

/** Taktart im Pattern-Editor: Symbol (entsperrt der Umschalter „Eigene Taktart“) und Wert, beide auf festem Platz. */
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
      {own && !locked ? (
        <select
          className="value-control value-meter"
          aria-label="Taktart"
          value={pattern.meter}
          onChange={(e) => set(Number(e.target.value))}
        >
          <MeterOptions />
        </select>
      ) : (
        <span className={own ? 'value-control value-meter' : 'value-control value-meter follows'} title={own ? undefined : 'Taktart des Songs'}>
          {label}
        </span>
      )}
    </span>
  );
}
