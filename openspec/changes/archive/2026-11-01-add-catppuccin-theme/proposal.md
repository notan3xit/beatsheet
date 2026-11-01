# Proposal

## Why

Die App nutzt bisher fest verdrahtete Einzelfarben und hat nur ein helles Erscheinungsbild. Für das Tablet im Proberaum oder auf der Bühne braucht es einen dunklen Modus. Außerdem sollen Grooves in der Song-Struktur (`add-song-structure`) eigene Farben bekommen, und dafür ist eine durchgängige Palette mit genug unterscheidbaren Akzentfarben nötig. Catppuccin liefert beides: eine helle und eine dunkle Variante mit identischen Farbnamen und 14 Akzentfarben.

## What Changes

- Die App übernimmt das Catppuccin-Farbschema: **Latte** bei heller, **Mocha** bei dunkler Systemeinstellung. Ein Wechsel der Systemeinstellung greift sofort, ohne Neuladen.
- Alle Oberflächenfarben (Hintergründe, Flächen, Text, Rahmen, aktive Sequencer-Zellen, Meldungen, Dialoge) stammen aus der Palette der aktiven Variante.
- Rot ist für Fehler und destruktive Aktionen (Löschen) reserviert.
- Das Notenbild zeichnet Linien, Notenköpfe, Hälse, Balken, Pausen und Beschriftungen in der Textfarbe des Schemas und ist damit auch im Dunkelmodus lesbar.

Nicht in diesem Change: manueller Umschalter Hell/Dunkel, die Varianten Frappé und Macchiato, die Zuordnung von Farben zu Patterns (folgt in `add-song-structure`).

## Capabilities

### New Capabilities
- `color-theme`: Farbschema der App (Catppuccin Latte/Mocha nach Systemeinstellung), Herkunft aller UI-Farben, Reservierung von Rot

### Modified Capabilities
- `drum-notation`: zusätzliche Anforderung, dass das Notenbild in der Textfarbe des aktiven Farbschemas gezeichnet wird

## Impact

- Neue Laufzeitabhängigkeit `@catppuccin/palette` (MIT) als einzige Quelle der Farbwerte
- `src/ui/styles.css`: Farb-Tokens werden ersetzt, fest codierte Farben entfallen
- `src/notation/render/vexflow.ts`: Zeichenfarbe des Renderers
- Kein Einfluss auf Datenmodell, Speicherformat oder bestehende Fachlogik
