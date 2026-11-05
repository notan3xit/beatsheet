import { INSTRUMENTS, type Instrument } from '../domain/types';

export type SampleLevel = 'normal' | 'soft';
export type SampleKey = `${Instrument}-${SampleLevel}`;
export const SAMPLE_KEYS: readonly SampleKey[] = INSTRUMENTS.flatMap((instrument) =>
  (['normal', 'soft'] as const).map((level): SampleKey => `${instrument}-${level}`),
);

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

class FetchError extends Error {}

/**
 * Lädt die Aufnahmen im ersten dekodierbaren Format (drum-samples, design.md D3). Ein Abruffehler
 * beendet das Laden, weil er nichts über den Codec aussagt.
 */
export function createSampleLoader({ formats, fetchData, decode }: LoaderDeps): SampleLoader {
  let state: LoaderState = 'idle';
  let buffers: SampleBuffers | null = null;
  let running: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const setState = (next: LoaderState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  const fetchChecked = (url: string) =>
    fetchData(url).catch((error: unknown) => {
      throw new FetchError(String(error));
    });

  const loadFormat = async (format: SampleFormat): Promise<SampleBuffers | null> => {
    let probe: AudioBuffer;
    const probeData = await fetchChecked(format.urls[PROBE]);
    try {
      probe = await decode(probeData);
    } catch {
      return null;
    }
    const rest = await Promise.all(
      SAMPLE_KEYS.filter((key) => key !== PROBE).map(async (key) => [key, await decode(await fetchChecked(format.urls[key]))] as const),
    );
    return Object.fromEntries([[PROBE, probe], ...rest]) as SampleBuffers;
  };

  const run = async () => {
    setState('loading');
    try {
      for (const format of formats) {
        const loaded = await loadFormat(format);
        if (loaded) {
          buffers = loaded;
          setState('ready');
          return;
        }
      }
    } catch {
      // Abruffehler oder späterer Dekodierfehler
    }
    setState('unavailable');
  };

  return {
    state: () => state,
    buffers: () => buffers,
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
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.arrayBuffer();
}
