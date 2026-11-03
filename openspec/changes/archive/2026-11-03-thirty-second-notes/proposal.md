# Proposal

## Why

Die feinste Unterteilung eines Beats sind heute Sechzehntel bzw. Sechzehnteltriolen. Schnelle Fills (Snare-Rolls, Tom-Läufe), Ruffs und Hi-Hat-Figuren in Grooves lassen sich damit nicht notieren.

## What Changes

- **Neue Unterteilungen „Zweiunddreißigstel“ (8 Positionen je Beat) und „Zweiunddreißigsteltriolen“ (12 Positionen je Beat)** im Sequencer, für jeden Beat einzeln wählbar wie die bisherigen.
- **Kurze Bezeichnungen in der Auswahl:** „8tel“, „16tel“, „32tel“, „8tel-Triolen“, „16tel-Triolen“, „32tel-Triolen“, in dieser Reihenfolge. Die ausgeschriebenen Namen („Zweiunddreißigstel“, „Sechzehnteltriolen“) waren in der schmalen Auswahl schwer lesbar.
- **Wechsel der Unterteilung:** Es gilt die bestehende Regel, dass Schläge nach ihrer zeitlichen Lage übertragen werden. Von Sechzehnteln oder Achteln nach Zweiunddreißigsteln geht nichts verloren. Zurück oder nach Triolen fragt das System bei Verlust wie bisher nach.
- **Notenbild:** Zweiunddreißigstelnoten und -pausen, punktierte Sechzehntel, dreifache Balken innerhalb des Beats; Zweiunddreißigsteltriolen mit einer „12“ über der Gruppe.
- **Sequencer-Breite:** Beats in Zweiunddreißigsteln und Zweiunddreißigsteltriolen werden so breit, dass ihre acht bzw. zwölf Zellen bedienbar bleiben.
- **Dateiformat:** Der Wert 8 ist als Unterteilung gültig, ohne neue Schemaversion. Ältere App-Versionen weisen Dateien mit Zweiunddreißigsteln ab, weil sie den Wert nicht kennen. Missverstehen können sie ihn nicht, daher steigt die Version nach der Regel in `AGENTS.md` nicht.

Wiedergabe, Fill-Kurzschrift und Mini-Darstellung rechnen bereits allgemein mit der Unterteilung und brauchen keine eigene Änderung. Die Tests weisen das nach.

Nicht enthalten: Akzente im Zweiunddreißigstel-Raster (sie bleiben auf Sechzehnteln), eine Vorgabe-Unterteilung pro Pattern.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `pattern-sequencer`: „Unterteilung pro Beat“ um Zweiunddreißigstel und Zweiunddreißigsteltriolen erweitert, mit kurzen Bezeichnungen in der Auswahl; „Schläge beim Wechsel der Unterteilung“ um Szenarien mit beiden ergänzt.
- `drum-notation`: „Notenwerte und Pausen aus dem Raster“ und „Balken pro Beat“ um Szenarien für Zweiunddreißigstel ergänzt; „Triolen kennzeichnen“ um die „12“.

## Impact

- `src/domain/types.ts`: `SUBDIVISIONS` um 8 und 12, kurze Bezeichnungen für alle Unterteilungen
- `src/notation/model.ts`: Notenwerte `32` und `16d`, Zerlegung für Unterteilung 8 und 12, Tuplet 12
- `src/notation/render/vexflow.ts`: Punkt auch für `16d`, Tuplet 12 über 8
- `src/ui/Sequencer.tsx`: Mindestbreite je Beat abhängig von der Unterteilung
- `src/persistence/fileFormat.ts`: keine Code-Änderung, das Schema folgt `SUBDIVISIONS`; ein Test sichert den Rundlauf ab
- Tests: bestehende UI-Tests wählen Unterteilungen über die neuen Bezeichnungen aus (geänderte Anforderung); Sequencer-Logik, Notationsmodell, VexFlow-Rendering, Wiedergabe/Kurzschrift (Absicherung), Dateiformat
