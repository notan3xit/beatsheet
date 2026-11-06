import { describe, expect, it, vi } from 'vitest';
import { INSTRUMENTS } from '../domain/types';
import { createSampleLoader, SAMPLE_KEYS, type SampleFormat } from './sampleLoader';

const format = (name: string): SampleFormat => ({
  name,
  urls: Object.fromEntries(SAMPLE_KEYS.map((key) => [key, `${name}/${key}`])) as SampleFormat['urls'],
});
const OPUS = format('opus');
const AAC = format('aac');

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
  const loader = createSampleLoader({ formats: [OPUS, AAC], fetchData, decode });
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
