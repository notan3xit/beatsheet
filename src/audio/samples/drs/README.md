# DRSKit-Einzelschläge

Je Instrument ein normaler und ein leiser Schlag (`<instrument>-normal`, `<instrument>-soft`), dazu Rim Shot (`snare-rim`), Cross-Stick (`snare-cross`) und Ride-Glocke (`ride-bell`), als Opus in WebM (`.webm`) und AAC in MP4 (`.m4a`).

## Herkunft und Lizenz

- Set: DRSKit von DrumGizmo.org (https://drumgizmo.org/wiki/doku.php?id=kits:drskit), Schlagzeug von Jes Eiler (DRSDrums), aufgenommen vom DrumGizmo-Team
- Quelle: SFZ-Fassung https://github.com/sfzinstruments/DrumGizmo.DRSKit, Commit `b01448990a31f722542f1812e56159a97a6a2a82`
- Lizenz: Creative Commons Attribution 4.0 International (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/

## Bearbeitung

Ausgewählte Aufnahmen (Tabelle in `scripts/drs-samples.mjs`) wurden aus den Mikrofonspuren zu Stereo gemischt, gekürzt, ausgeblendet und mit einem gemeinsamen Faktor im Pegel angepasst (`openspec/changes/archive/*-drum-samples/design.md`, D4).

Der Rim Shot ist keine Einzelaufnahme: Er mischt eine laute Snare mit dem Randschlag `Snare_rim`, hebt Mitten und Höhen an und sättigt das Ergebnis. Der Cross-Stick ist die lauteste Aufnahme aus `Snare_rim`. Rezept und Pegel: `openspec/changes/archive/*-hit-types/design.md`, D6.

## Neu erzeugen

```
node scripts/drs-samples.mjs [--cache <Verzeichnis>]
```

Braucht `ffmpeg` mit `libopus` im `PATH`. Das Skript lädt die benötigten FLAC-Dateien (etwa 15 MB) in den Cache und erzeugt die Dateien bitgleich neu.

## Zeitlicher Einsatz

Im Headless-Chromium dekodiert setzt AAC 0,5 ms nach Opus ein (Kreuzkorrelation über Snare, Bassdrum, Tom 1 und Hi-Hat), es braucht also keinen Startversatz. Safari ist nicht gemessen.
