import { INSTRUMENTS, type Instrument } from '../domain/types';

export type SampleLevel = 'normal' | 'soft';
/** Aufnahmen der Spielweisen mit eigenem Klang. */
export const TECHNIQUE_SAMPLES = { rim: 'snare-rim', cross: 'snare-cross', bell: 'ride-bell' } as const;
export type SampleKey = `${Instrument}-${SampleLevel}` | (typeof TECHNIQUE_SAMPLES)[keyof typeof TECHNIQUE_SAMPLES];
export const SAMPLE_KEYS: readonly SampleKey[] = [
  ...INSTRUMENTS.flatMap((instrument) => (['normal', 'soft'] as const).map((level): SampleKey => `${instrument}-${level}`)),
  ...Object.values(TECHNIQUE_SAMPLES),
];

/** Ein Satz Aufnahmen in einem Format: URL je Aufnahme. */
export interface SampleFormat {
  name: string;
  urls: Record<SampleKey, string>;
}

export type SampleBuffers = Record<SampleKey, AudioBuffer>;
export type LoaderState = 'idle' | 'loading' | 'ready' | 'unavailable';

export interface SampleLoader {
  state(): LoaderState;
  /** Dekodierte Aufnahmen, sobald der Zustand `ready` ist. */
  buffers(): SampleBuffers | null;
  /** Je gescheitertem Format eine Zeile; leer außer im Zustand `unavailable`. */
  failures(): readonly string[];
  /** Lädt einmal; weitere Aufrufe liefern denselben Vorgang. */
  load(): Promise<void>;
  subscribe(listener: () => void): () => void;
}

export interface LoaderDeps {
  /** In Reihenfolge des Versuchs. */
  formats: readonly SampleFormat[];
  fetchData(url: string): Promise<ArrayBuffer>;
  decode(data: ArrayBuffer): Promise<AudioBuffer>;
}

/** Probe je Format, bevor die übrigen Dateien geladen werden. */
const PROBE: SampleKey = 'snare-normal';

const NO_FAILURES: readonly string[] = [];

interface Failure {
  step: 'Abruf' | 'Dekodieren';
  key: SampleKey;
  error: unknown;
}

/** Auch eine Ablehnung ohne Fehlerobjekt bleibt lesbar (sample-load-reason, design.md D4). */
function errorText(error: unknown): string {
  const { name, message } = (error ?? {}) as Partial<Error>;
  return [name !== 'Error' && name, message].filter(Boolean).join(': ') || String(error);
}

/**
 * Lädt die Aufnahmen im ersten dekodierbaren Format (drum-samples, design.md D3). Ein Abruffehler
 * beendet das Laden, weil er nichts über den Codec aussagt.
 */
export function createSampleLoader({ formats, fetchData, decode }: LoaderDeps): SampleLoader {
  let state: LoaderState = 'idle';
  let buffers: SampleBuffers | null = null;
  let failures = NO_FAILURES;
  let running: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const setState = (next: LoaderState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  const loadSample = async (format: SampleFormat, key: SampleKey): Promise<AudioBuffer | Failure> => {
    let step: Failure['step'] = 'Abruf';
    try {
      const data = await fetchData(format.urls[key]);
      step = 'Dekodieren';
      return await decode(data);
    } catch (error) {
      return { step, key, error };
    }
  };
  const isFailure = (result: AudioBuffer | Failure): result is Failure => 'step' in result;
  const lineOf = ({ step, key, error }: Failure, format: SampleFormat, count = 1) =>
    `${step}, ${key} (${format.name}): ${errorText(error)}${count > 1 ? ` (${count} Aufnahmen gescheitert)` : ''}`;

  const run = async () => {
    setState('loading');
    const lines: string[] = [];
    for (const format of formats) {
      const probe = await loadSample(format, PROBE);
      if (isFailure(probe)) {
        lines.push(lineOf(probe, format));
        if (probe.step === 'Abruf') break;
        continue;
      }
      const others = SAMPLE_KEYS.filter((key) => key !== PROBE);
      const results = await Promise.all(others.map((key) => loadSample(format, key)));
      const failed = results.filter(isFailure);
      if (failed.length > 0) {
        lines.push(lineOf(failed[0]!, format, failed.length));
        break;
      }
      buffers = Object.fromEntries([[PROBE, probe], ...others.map((key, i) => [key, results[i]])]) as SampleBuffers;
      setState('ready');
      return;
    }
    failures = lines;
    setState('unavailable');
  };

  return {
    state: () => state,
    buffers: () => buffers,
    failures: () => failures,
    load() {
      running ??= run();
      return running;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

type OfflineWindow = { OfflineAudioContext?: typeof OfflineAudioContext; webkitOfflineAudioContext?: typeof OfflineAudioContext };

/** Dekodieren ohne den echten AudioContext, der erst beim ersten Abspielen entsteht (design.md D3). */
export function browserDecode(win: OfflineWindow = globalThis as OfflineWindow): LoaderDeps['decode'] {
  const Offline = win.OfflineAudioContext ?? win.webkitOfflineAudioContext;
  if (!Offline) return () => Promise.reject(new Error('OfflineAudioContext fehlt'));
  let ctx: OfflineAudioContext | null = null;
  return (data) => {
    ctx ??= new Offline(2, 1, 48000);
    return ctx.decodeAudioData(data);
  };
}

export async function browserFetch(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.arrayBuffer();
}
