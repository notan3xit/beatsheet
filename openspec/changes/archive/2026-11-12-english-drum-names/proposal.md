# Proposal

## Why

Instrumente und Spielweisen heißen in der App englisch (Crash, Ride, Hi-Hat, Snare, Ghost Note, Rim Shot), nur Bassdrum, Standtom und Glocke nicht. Die Namen sollen einheitlich sein, in Oberfläche, Specs und Tests.

## What Changes

- „Bassdrum“ heißt „Kick Drum“, „Standtom“ heißt „Floor Tom“, die Spielweise „Glocke“ heißt „Bell“: im Sequencer, im Akzent-Editor, in den Namen der Zellen für Screenreader.
- Die Akzent-Markierung der Kick Drum zeigt „K“ statt „BD“, die der Floor Tom „F“ statt „FT“, wie die Zeichen `k` und `f` der Fill-Kurzschrift.
- Specs und Tests verwenden die neuen Namen.
- Keine Änderung an Daten-IDs (`kick`, `floorTom`, `bell`), Dateiformat, gespeicherten Songs, Abgleich oder Server.

## Capabilities

### New Capabilities

### Modified Capabilities
- `pattern-sequencer`: Instrumentliste, Spielweisen und Szenarien mit den neuen Namen.
- `songbook-view`: Kürzel „K“ und „F“ der Akzent-Markierungen; Szenarien mit den neuen Namen.
- `drum-notation`: Systempositionen, Stimmen, Pausen, Bell und Betonung mit den neuen Namen.
- `pattern-playback`: Klänge mit den neuen Namen.
- `playback-sound`: Aufnahme der Ride-Bell.
- `song-playback`: Szenarien mit „Kick Drum“.
- `song-merge`: Szenarien mit „Kick Drum“ und „Bell“.
- `library-persistence`: Szenario mit „Ride-Bell“.

## Impact

- `src/domain/types.ts` (`INSTRUMENT_LABELS`, `ARTICULATION_LABELS`), `src/songbook/layout.ts` (`ACCENT_LABELS`), `src/audio/samples/drs/README.md`
- Tests, die Zellen und Zeilen über ihren Namen finden, und Testtitel, die Szenarien folgen
- Frühere Einträge in „Was ist neu“ bleiben unverändert
