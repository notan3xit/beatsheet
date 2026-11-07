import { describe, expect, it, vi } from 'vitest';
import { INSTRUMENTS } from '../domain/types';
import { browserFetch, createSampleLoader, FetchStatusError, SAMPLE_KEYS, type SampleFormat } from './sampleLoader';

const format = (name: string): SampleFormat => ({
  name,
  urls: Object.fromEntries(SAMPLE_KEYS.map((key) => [key, `${name}/${key}`])) as SampleFormat['urls'],
});
const OPUS = format('opus');
const AAC = format('aac');
const noWait = async () => {};

/** Abruf liefert die URL als Inhalt; Dekodieren kennt nur die genannten Formate. */
function setup({ decodable = ['opus', 'aac'], failingUrl }: { decodable?: string[]; failingUrl?: string } = {}) {
  const fetchData = vi.fn(async (url: string) => {
    if (url === failingUrl) throw new Error('offline');
    return new TextEncoder().encode(url).buffer as ArrayBuffer;
  });
  const decode = vi.fn(async (data: ArrayBuffer) => {
    const url = new TextDecoder().decode(data);
    if (!decodable.includes(url.split('/')[0]!)) throw new Error('EncodingError');
    return { url } as unknown as AudioBuffer;
  });
  const loader = createSampleLoader({ formats: [OPUS, AAC], fetchData, decode, wait: noWait });
  return { loader, fetchData, decode };
}

describe('Spec playback-sound › Laden im Hintergrund', () => {
  it('Ablauf idle → loading → ready mit allen Aufnahmen des ersten Formats', async () => {
    const { loader } = setup();
    const states: string[] = [];
    loader.subscribe(() => states.push(loader.state()));
    expect(loader.state()).toBe('idle');
    expect(loader.buffers()).toBeNull();
    const done = loader.load();
    expect(loader.state()).toBe('loading');
    await done;
    expect(states).toEqual(['loading', 'ready']);
    const buffers = loader.buffers()!;
    expect(Object.keys(buffers).sort()).toEqual([...SAMPLE_KEYS].sort());
    expect(SAMPLE_KEYS).toHaveLength(INSTRUMENTS.length * 2 + 3);
    expect((buffers['snare-soft'] as unknown as { url: string }).url).toBe('opus/snare-soft');
  });

  it('load() ist idempotent', async () => {
    const { loader, fetchData } = setup();
    const first = loader.load();
    const second = loader.load();
    await Promise.all([first, second]);
    await loader.load();
    expect(fetchData).toHaveBeenCalledTimes(SAMPLE_KEYS.length);
  });
});

describe('Spec playback-sound › Grund der Nichtverfügbarkeit', () => {
  /** Abruf und Dekodieren je Aufnahme steuerbar, in der Form, die die Spec benennt. */
  function failing({ fetchFails = {}, decodeFails = {} }: { fetchFails?: Record<string, unknown>; decodeFails?: Record<string, unknown> }) {
    return createSampleLoader({
      formats: [OPUS, AAC],
      wait: noWait,
      fetchData: async (url) => {
        if (url in fetchFails) throw fetchFails[url];
        return new TextEncoder().encode(url).buffer as ArrayBuffer;
      },
      decode: async (data) => {
        const url = new TextDecoder().decode(data);
        if (url in decodeFails) throw decodeFails[url];
        return { url } as unknown as AudioBuffer;
      },
    });
  }
  const encodingError = () => new DOMException('Decoding failed', 'EncodingError');

  it('Abruf scheitert: Schritt, Aufnahme, Format und Fehlertext', async () => {
    const loader = failing({ fetchFails: { 'opus/crash-soft': new Error('HTTP 404') } });
    await loader.load();
    expect(loader.failures()).toEqual(['Abruf, crash-soft (opus): HTTP 404']);
  });

  it('Beide Formate nicht dekodierbar: je Format eine Zeile', async () => {
    const loader = failing({ decodeFails: { 'opus/snare-normal': encodingError(), 'aac/snare-normal': encodingError() } });
    await loader.load();
    expect(loader.failures()).toEqual([
      'Dekodieren, snare-normal (opus): EncodingError: Decoding failed',
      'Dekodieren, snare-normal (aac): EncodingError: Decoding failed',
    ]);
  });

  it('Mehrere Aufnahmen scheitern: die erste und die Anzahl', async () => {
    const [first, second, third] = SAMPLE_KEYS.filter((key) => key !== 'snare-normal');
    const loader = failing({
      fetchFails: { [`opus/${third}`]: new TypeError('Load failed') },
      decodeFails: { [`opus/${second}`]: encodingError(), [`opus/${first}`]: encodingError() },
    });
    await loader.load();
    expect(loader.state()).toBe('unavailable');
    expect(loader.failures()).toEqual([`Dekodieren, ${first} (opus): EncodingError: Decoding failed (3 Aufnahmen gescheitert)`]);
  });

  it('Fehlerantwort des Servers: nur der Status, ohne URL', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })));
    await expect(browserFetch('/assets/crash-soft-abc.webm')).rejects.toThrow(/^HTTP 404$/);
    vi.unstubAllGlobals();
  });

  it('Ablehnung ohne Fehlerobjekt bleibt sichtbar', async () => {
    const loader = failing({ decodeFails: { 'opus/snare-normal': null, 'aac/snare-normal': null } });
    await loader.load();
    expect(loader.failures()).toEqual(['Dekodieren, snare-normal (opus): null', 'Dekodieren, snare-normal (aac): null']);
  });

  it('Zweites Format: kein Grund, obwohl das erste scheiterte', async () => {
    const loader = failing({ decodeFails: { 'opus/snare-normal': encodingError() } });
    await loader.load();
    expect(loader.state()).toBe('ready');
    expect(loader.failures()).toEqual([]);
  });

  it('Der Grund steht fest, wenn der Zustand wechselt, und bleibt als Snapshot stabil', async () => {
    const loader = failing({ fetchFails: { 'opus/crash-soft': new Error('HTTP 404') } });
    expect(loader.failures()).toEqual([]);
    const seen: (readonly string[])[] = [];
    loader.subscribe(() => seen.push(loader.failures()));
    await loader.load();
    expect(seen.at(-1)).toHaveLength(1);
    expect(loader.failures()).toBe(loader.failures());
  });
});

describe('Spec playback-sound › Hinweis auf Neuladen', () => {
  function reloadMayHelp({ fetchFails = {}, decodeFails = [] }: { fetchFails?: Record<string, unknown>; decodeFails?: string[] }) {
    const loader = createSampleLoader({
      formats: [OPUS, AAC],
      wait: noWait,
      fetchData: async (url) => {
        if (url in fetchFails) throw fetchFails[url];
        return new TextEncoder().encode(url).buffer as ArrayBuffer;
      },
      decode: async (data) => {
        const url = new TextDecoder().decode(data);
        if (decodeFails.includes(url)) throw new Error('nicht dekodierbar');
        return { url } as unknown as AudioBuffer;
      },
    });
    return loader.load().then(() => loader.reloadMayHelp());
  }

  it.each([
    [404, true],
    [408, true],
    [429, true],
    [500, true],
    [502, true],
    [403, false],
  ])('Status %i: %s', async (status, expected) => {
    expect(await reloadMayHelp({ fetchFails: { 'opus/crash-soft': new FetchStatusError(status) } })).toBe(expected);
  });

  it('Keine Antwort des Servers', async () => {
    expect(await reloadMayHelp({ fetchFails: { 'opus/crash-soft': new TypeError('Load failed') } })).toBe(true);
  });

  it('Nicht dekodierbar', async () => {
    expect(await reloadMayHelp({ decodeFails: ['opus/snare-normal', 'aac/snare-normal'] })).toBe(false);
  });

  it('Eine von mehreren Ursachen genügt, auch wenn die erste nicht zu ihnen gehört', async () => {
    const [first, second] = SAMPLE_KEYS.filter((key) => key !== 'snare-normal');
    expect(await reloadMayHelp({ decodeFails: [`opus/${first}`], fetchFails: { [`opus/${second}`]: new FetchStatusError(502) } })).toBe(true);
  });

  it('browserFetch trägt den Status der Fehlerantwort', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 502 })));
    await expect(browserFetch('/assets/x.webm')).rejects.toMatchObject({ status: 502 });
    vi.unstubAllGlobals();
  });
});

describe('Spec playback-sound › Wiederholung beim Abruf', () => {
  /** Abruf wirft je URL der Reihe nach die genannten Fehler und gelingt danach. */
  function flaky(errors: Record<string, unknown[]>, decodeFails: string[] = []) {
    const remaining = new Map(Object.entries(errors).map(([url, list]) => [url, [...list]]));
    const fetchData = vi.fn(async (url: string) => {
      const list = remaining.get(url);
      if (list?.length) throw list.shift();
      return new TextEncoder().encode(url).buffer as ArrayBuffer;
    });
    const decode = async (data: ArrayBuffer) => {
      const url = new TextDecoder().decode(data);
      if (decodeFails.includes(url)) throw new Error('nicht dekodierbar');
      return { url } as unknown as AudioBuffer;
    };
    const wait = vi.fn(noWait);
    const loader = createSampleLoader({ formats: [OPUS, AAC], fetchData, decode, wait });
    const calls = (url: string) => fetchData.mock.calls.filter(([called]) => called === url).length;
    return { loader, wait, calls };
  }
  const URL = 'opus/crash-soft';
  const status = (code: number) => new FetchStatusError(code);

  it('Wiederholung gelingt', async () => {
    const { loader, calls } = flaky({ [URL]: [status(502)] });
    await loader.load();
    expect(loader.state()).toBe('ready');
    expect(loader.failures()).toEqual([]);
    expect(calls(URL)).toBe(2);
  });

  it('Alle Versuche scheitern', async () => {
    const { loader, calls } = flaky({ [URL]: [status(502), status(502), status(502)] });
    await loader.load();
    expect(loader.state()).toBe('unavailable');
    expect(loader.failures()).toHaveLength(1);
    expect(loader.reloadMayHelp()).toBe(true);
    expect(calls(URL)).toBe(3);
  });

  it('Keine Antwort des Servers', async () => {
    const { loader, calls } = flaky({ [URL]: [new TypeError('Load failed')] });
    await loader.load();
    expect(loader.state()).toBe('ready');
    expect(calls(URL)).toBe(2);
  });

  it('Die Probe wird ebenfalls wiederholt', async () => {
    const { loader, calls } = flaky({ 'opus/snare-normal': [status(503)] });
    await loader.load();
    expect(loader.state()).toBe('ready');
    expect(calls('opus/snare-normal')).toBe(2);
  });

  it.each([408, 429, 500, 504])('Status %i wird wiederholt', async (code) => {
    const { loader, calls } = flaky({ [URL]: [status(code)] });
    await loader.load();
    expect(calls(URL)).toBe(2);
    expect(loader.state()).toBe('ready');
  });

  it.each([404, 403])('Status %i wird nicht wiederholt', async (code) => {
    const { loader, wait, calls } = flaky({ [URL]: [status(code)] });
    await loader.load();
    expect(calls(URL)).toBe(1);
    expect(wait).not.toHaveBeenCalled();
    expect(loader.state()).toBe('unavailable');
  });

  it('Nicht dekodierbar: kein erneuter Abruf', async () => {
    const { loader, calls } = flaky({}, [URL]);
    await loader.load();
    expect(calls(URL)).toBe(1);
    expect(loader.state()).toBe('unavailable');
  });

  it('Wartezeiten vor den Wiederholungen', async () => {
    const { loader, wait } = flaky({ [URL]: [status(502), status(502), status(502)] });
    await loader.load();
    expect(wait.mock.calls).toEqual([[300], [1000]]);
  });
});

describe('Spec playback-sound › Begrenzte gleichzeitige Abrufe', () => {
  it.each([
    ['ohne Fehler', false],
    ['mit Wiederholungen', true],
  ])('Laden aller Aufnahmen %s', async (_, withRetries) => {
    let running = 0;
    let highest = 0;
    const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 1));
    const failedOnce = new Set<string>();
    const loader = createSampleLoader({
      formats: [OPUS, AAC],
      fetchData: async (url) => {
        running += 1;
        highest = Math.max(highest, running);
        await pause();
        running -= 1;
        if (withRetries && !failedOnce.has(url)) {
          failedOnce.add(url);
          throw new FetchStatusError(502);
        }
        return new TextEncoder().encode(url).buffer as ArrayBuffer;
      },
      decode: async (data) => ({ url: new TextDecoder().decode(data) }) as unknown as AudioBuffer,
      wait: pause,
    });
    await loader.load();
    expect(highest).toBeGreaterThan(1);
    expect(highest).toBeLessThanOrEqual(4);
    expect(loader.state()).toBe('ready');
    expect(Object.keys(loader.buffers()!).sort()).toEqual([...SAMPLE_KEYS].sort());
  });
});

describe('Spec playback-sound › Ersatz durch den Synth', () => {
  it('Zweites Format: erstes nicht dekodierbar, zweites schon', async () => {
    const { loader, fetchData } = setup({ decodable: ['aac'] });
    await loader.load();
    expect(loader.state()).toBe('ready');
    expect((loader.buffers()!['kick-normal'] as unknown as { url: string }).url).toBe('aac/kick-normal');
    // vom ersten Format nur die Probe
    expect(fetchData.mock.calls.filter(([url]) => url.startsWith('opus/'))).toEqual([['opus/snare-normal']]);
  });

  it('Aufnahmen nicht dekodierbar: Zustand unavailable', async () => {
    const { loader } = setup({ decodable: [] });
    await loader.load();
    expect(loader.state()).toBe('unavailable');
    expect(loader.buffers()).toBeNull();
  });

  it('Abruffehler bei der Probe: unavailable, ohne zweites Format', async () => {
    const { loader, fetchData } = setup({ failingUrl: 'opus/snare-normal' });
    await loader.load();
    expect(loader.state()).toBe('unavailable');
    expect(fetchData.mock.calls.some(([url]) => url.startsWith('aac/'))).toBe(false);
  });

  it('Abruffehler bei einer späteren Datei: unavailable', async () => {
    const { loader } = setup({ failingUrl: 'opus/crash-soft' });
    await loader.load();
    expect(loader.state()).toBe('unavailable');
    expect(loader.buffers()).toBeNull();
  });
});
