# Design

## Context

Die Daten-IDs sind schon englisch (`kick`, `floorTom`, `bell`); die Namen stehen nur in `INSTRUMENT_LABELS` und `ARTICULATION_LABELS` (`src/domain/types.ts`), die Kürzel der Akzent-Markierungen in `ACCENT_LABELS` (`src/songbook/layout.ts`). Sequencer und Akzent-Editor lesen die Namen von dort, auch für die Namen der Zellen, über die Tests sie finden. Die Spalte der Instrumentnamen im Sequencer richtet sich nach „Hi-Hat (geschlossen)“; die neuen Namen sind kürzer.

## Goals / Non-Goals

**Goals:**
- Dieselben Namen in Oberfläche, Specs, Tests, Testtiteln und Kommentaren.

**Non-Goals:**
- Daten-IDs, Dateiformat, Kurzschrift-Zeichen (`k`, `f`, `b`) und Klänge.
- Frühere Einträge in „Was ist neu“ (`src/ui/changelog.ts`) und archivierte Changes; sie beschreiben, was damals galt.

## Decisions

**D1 Nur Beschriftungen.** Geändert werden die drei Einträge in `INSTRUMENT_LABELS` und `ARTICULATION_LABELS` sowie `kick: 'K'` und `floorTom: 'F'` in `ACCENT_LABELS`. Gespeicherte Songs und ältere App-Versionen sind nicht betroffen, weil nur die IDs gespeichert werden.

**D2 Kürzel wie die Kurzschrift.** „K“ und „F“ entsprechen den Zeichen `k` und `f` der Fill-Kurzschrift. Alternative: „KD“ und „FT“. Verworfen, weil dann dasselbe Instrument in Kurzschrift und Akzent-Markierung verschieden abgekürzt wäre.

**D3 Szenario-Titel vorab.** OpenSpec kann Szenarien in einem Change nicht umbenennen. Die sieben Titel mit den alten Namen sind deshalb schon vor diesem Change in den Haupt-Specs umbenannt, zusammen mit den gleichnamigen Testtiteln. Der Titel „Floor Tom vor Kick vor Pedal“ bleibt; er kürzt Kick Drum und Hi-Hat-Pedal gleichermaßen ab.

**D4 Grammatik.** Die Floor Tom ist feminin wie die Kick Drum („die Floor Tom“, „zur Floor Tom“), die Bell ebenso. Zusammensetzungen mit Bindestrich: „Kick-Drum-Schlag“, „Kick-Drum-Akzent“, „Ride-Bell“.

## Risks / Trade-offs

- [Gewohnte deutsche Namen fehlen] → Gewollt; die übrigen Instrumente und Spielweisen heißen schon englisch.
