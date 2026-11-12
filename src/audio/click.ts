import type { Click } from './scheduler';

/** Tonhöhe und Pegel des Klicks; betont höher und lauter (practice-click, design.md D4). */
export const CLICK_ACCENTED = { frequency: 1760, level: 0.8 };
export const CLICK_PLAIN = { frequency: 1320, level: 0.6 };
/** Zeitkonstante des Abklingens; kürzer ging der Klick neben den Schlägen unter. */
export const CLICK_TIME_CONSTANT = 0.02;
/** Danach ist der Ton unhörbar und wird beendet. */
export const CLICK_LENGTH = 0.12;

/** Klick von Metronom und Einzählen: kurzer Sinuston, unabhängig von der Klangwahl. */
export function createClick(ctx: BaseAudioContext): Click {
  const newMaster = () => {
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    return gain;
  };
  let master = newMaster();

  return {
    click(time, accented) {
      const { frequency, level } = accented ? CLICK_ACCENTED : CLICK_PLAIN;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, time);
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(level, time);
      envelope.gain.setTargetAtTime(0, time, CLICK_TIME_CONSTANT);
      osc.connect(envelope).connect(master);
      osc.start(time);
      osc.stop(time + CLICK_LENGTH);
    },
    silence() {
      master.disconnect();
      master = newMaster();
    },
  };
}
