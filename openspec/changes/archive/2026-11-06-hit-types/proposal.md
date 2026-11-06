# Proposal

## Why

Das Notenbuch kennt nur Flam und Ghost Note. Rim Shots, Cross-Sticks, Drags, Ride-Glocke, gestoppte Crashes und Betonungen lassen sich nicht notieren und nicht anhören. Die Auswahl und ihre Klänge sind mit einer Hörprobe abgestimmt.

## What Changes

- **Neue Spielweisen:** Drag (Snare, Toms), Rim Shot und Cross-Stick (Snare), Glocke (Ride), Choke (Crash).
- **Betonung:** eine eigene Eigenschaft neben der Spielweise, pro Instrument und Position. Sie gilt für alle Instrumente und lässt sich mit jeder Spielweise außer Ghost Note kombinieren.
- **Sequencer:** Shift-Klick schaltet die für das Instrument zulässigen Spielweisen durch, Strg-Klick (Mac: Cmd) schaltet die Betonung um. Die Zelle zeigt beides an.
- **Notation:** Drag als zwei Vorschläge mit Bogen, Rim Shot als durchgestrichene Note, Cross-Stick als X auf der Snare-Position, Glocke als Raute, Choke als Punkt über der Note, Betonung als ein `>` je Spalte auf einheitlicher Höhe oberhalb von System und Balken.
- **Klang:** neue DRSKit-Aufnahmen für Rim Shot, Cross-Stick und Glocke, Choke als abgeschnittener Crash, Betonung als lauterer Schlag; alles auch mit dem Synth.
- **Dateiformat:** Schemaversion 4. **BREAKING:** Ältere App-Versionen weisen Dateien mit den neuen Spielweisen als beschädigt ab.

Nicht enthalten: halboffene Hi-Hat, Buzz, Rim Shot auf Toms, Eingabe-Leiste, Eingabe per Touch.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `pattern-sequencer`: Spielweisen je Instrument, Eingabe und Anzeige der Betonung.
- `drum-notation`: Darstellung der neuen Spielweisen und der Betonung.
- `pattern-playback`: Klang der neuen Spielweisen und der Betonung.
- `playback-sound`: Aufnahmen für Rim Shot, Cross-Stick und Glocke.
- `library-persistence`: Schemaversion 4, Betonung im Export, Prüfung beim Import.
- `song-merge`: Zusammenführen von Betonungen, Vorrang der Ghost Note.
- `songbook-view`: Neue Spielweisen in der Fill-Kurzschrift.

## Impact

- `src/domain`: `types`, `sequencer`, `normalize`, `playback`
- `src/notation`: `model`, `render/vexflow`; `shorthand` nur über Tests
- `src/audio`: `scheduler`, `voices`, `sampleVoices`, `switchingVoices`, `sampleLoader`, `samples/drs`
- `src/persistence`: `fileFormat`, `songDoc`
- `src/ui`: `Sequencer`, `styles.css`
- `scripts/drs-samples.mjs`: neue Aufnahmen; lädt dafür weitere Dateien aus dem DRSKit-Repository
- Gebautes Paket: drei Aufnahmen mehr in zwei Formaten
