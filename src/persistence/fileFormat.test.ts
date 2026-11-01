import { describe, expect, it } from 'vitest';
import { emptyBeats, patternOf } from '../test/patterns';
import { exportFileName, parseLibraryFile, serializeLibrary } from './fileFormat';

const NOW = new Date('2026-11-01T12:00:00.000Z');

function library() {
  const groove = patternOf([
    { hits: { kick: [1, 3], hihat: [1, 2, 3, 4] } },
    { sub: 3, hits: { snare: [1, 2, 3] } },
    { sub: 2, hits: { hihatOpen: [1] } },
    { sub: 6, hits: { tom1: [1, 6] } },
  ]);
  groove.name = 'Verse';
  groove.revision = 7;
  const fill = patternOf(emptyBeats(2), 'fill');
  return [groove, fill];
}

function fileWith(overrides: Record<string, unknown>, patternOverrides: Record<string, unknown> = {}) {
  const file = JSON.parse(serializeLibrary(library(), NOW));
  file.patterns[0] = { ...file.patterns[0], ...patternOverrides };
  return JSON.stringify({ ...file, ...overrides });
}

describe('Spec library-persistence › Export der Bibliothek', () => {
  it('Export herunterladen: Dateiname und Inhalt', () => {
    expect(exportFileName(NOW)).toBe('drumstuff-2026-11-01.drumbook.json');
    const file = JSON.parse(serializeLibrary(library(), NOW));
    expect(file.format).toBe('drumstuff.library');
    expect(file.schemaVersion).toBe(1);
    expect(file.exportedAt).toBe(NOW.toISOString());
    expect(file.patterns).toHaveLength(2);
    expect(Object.keys(file.patterns[0]).sort()).toEqual(
      ['beats', 'createdAt', 'id', 'kind', 'name', 'revision', 'updatedAt'].sort(),
    );
  });

  it('Export ist verlustfrei', () => {
    const patterns = library();
    const parsed = parseLibraryFile(serializeLibrary(patterns, NOW));
    expect(parsed).toEqual({ ok: true, patterns });
  });
});

describe('Spec library-persistence › Ungültige Importdateien', () => {
  it('Neuere Schemaversion', () => {
    const result = parseLibraryFile(fileWith({ schemaVersion: 2 }));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/neueren Version/);
  });

  it('Beschädigte Datei: Länge 0', () => {
    const result = parseLibraryFile(fileWith({}, { beats: [] }));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/beschädigt/);
  });

  it('Kein gültiges JSON', () => {
    const result = parseLibraryFile('{ nope');
    expect(!result.ok && result.error).toMatch(/kein gültiges JSON/);
  });

  it('Fremde Formatkennung', () => {
    const result = parseLibraryFile(JSON.stringify({ format: 'something.else', schemaVersion: 1, patterns: [] }));
    expect(!result.ok && result.error).toMatch(/keine Drumstuff-Bibliothek/);
  });

  it.each([
    ['Länge 17', { beats: Array.from({ length: 17 }, () => ({ subdivision: 4, hits: {} })) }],
    ['unbekannte Unterteilung', { beats: [{ subdivision: 5, hits: {} }] }],
    ['Position außerhalb des Rasters', { beats: [{ subdivision: 2, hits: { kick: [2] } }] }],
    ['Position nicht ganzzahlig', { beats: [{ subdivision: 4, hits: { kick: [0.5] } }] }],
    ['unbekanntes Instrument', { beats: [{ subdivision: 4, hits: { cowbell: [0] } }] }],
    ['offene und geschlossene Hi-Hat zugleich', { beats: [{ subdivision: 4, hits: { hihat: [0], hihatOpen: [0] } }] }],
    ['leerer Name', { name: '  ' }],
    ['unbekannter Typ', { kind: 'solo' }],
  ])('Strukturregel verletzt: %s', (_, override) => {
    const result = parseLibraryFile(fileWith({}, override));
    expect(!result.ok && result.error).toMatch(/beschädigt/);
  });
});
