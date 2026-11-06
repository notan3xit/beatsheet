import { SAMPLE_KEYS, type SampleFormat, type SampleKey } from './sampleLoader';

// Vite legt die Dateien gehasht unter assets/ ab; dort bleiben sie im Browser-Cache (drum-samples, design.md D4)
const files = import.meta.glob<string>('./samples/drs/*.{webm,m4a}', { query: '?no-inline', import: 'default', eager: true });

function format(name: string, extension: string): SampleFormat {
  const urls = {} as Record<SampleKey, string>;
  for (const key of SAMPLE_KEYS) {
    const url = files[`./samples/drs/${key}.${extension}`];
    if (!url) throw new Error(`DRSKit-Aufnahme fehlt: ${key}.${extension}`);
    urls[key] = url;
  }
  return { name, urls };
}

/** DRSKit-Aufnahmen der Instrumente und Spielweisen in Reihenfolge des Versuchs: Opus, dann AAC. */
export const DRS_FORMATS: readonly SampleFormat[] = [format('opus', 'webm'), format('aac', 'm4a')];
