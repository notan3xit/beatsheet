# Proposal

## Why

Grooves lassen sich bisher nur als „Schlag an dieser Position“ notieren. Flams und Ghost Notes gehören aber zum Kern vieler Grooves, gerade auf der Snare, und fehlen damit sowohl in der Eingabe als auch im Notenbild. Wer einen Groove mit Ghost Notes oder einem Flam auf der Zwei aufschreiben will, kann das heute nicht.

## What Changes

- **Spielweise pro Schlag:** Ein Schlag auf Snare, Tom 1, Tom 2 oder Standtom kann neben „normal“ die Spielweise Flam oder Ghost Note haben. Das Modell ist allgemein angelegt, damit später weitere Spielweisen (z. B. Betonung, Drag) ohne neue Datenmigration dazukommen können.
- **Eingabe im Sequencer:** Klick setzt bzw. entfernt einen Schlag wie bisher; dabei geht eine Spielweise mit dem Schlag verloren. Shift-Klick auf eine Zelle von Snare oder Toms schaltet die Spielweise durch: normal → Flam → Ghost Note → normal. Shift-Klick auf eine leere Zelle setzt direkt einen Flam. Die Zelle zeigt die Spielweise an.
- **Notation:** Ein Flam erscheint als durchgestrichener Vorschlag vor der Hauptnote auf derselben Systemposition, mit einem Bogen unter beiden Notenköpfen, eine Ghost Note als Notenkopf in runden Klammern. In einem Akkord betrifft das nur den Notenkopf des betroffenen Instruments.
- **Unterteilungswechsel:** Die Spielweise folgt ihrem Schlag; geht der Schlag verloren, geht auch seine Spielweise verloren.
- **Dateiformat Schemaversion 3:** Der Export enthält die Spielweisen. Dateien der Schemaversionen 1 und 2 bleiben importierbar; erst Schemaversion 4 gilt als „neuere Version“.

Nicht enthalten: weitere Spielweisen (Betonung, Drag, Rimshot), Spielweisen für Becken, Bassdrum und Hi-Hat-Pedal, Eingabe per Touch (ohne Shift), Wiedergabe.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `pattern-sequencer`: neue Anforderungen „Spielweise eines Schlags“ (Shift-Klick, nur Snare und Toms, Anzeige in der Zelle); „Schläge setzen und entfernen“ und „Schläge beim Wechsel der Unterteilung“ legen fest, dass die Spielweise mit ihrem Schlag entfernt bzw. übertragen wird.
- `drum-notation`: neue Anforderungen „Flam“ und „Ghost Note“.
- `library-persistence`: „Export der Bibliothek“ schreibt Schemaversion 3 einschließlich der Spielweisen; „Ungültige Importdateien“ weist ab Schemaversion 4 ab; neue Anforderung „Import von Dateien der Schemaversion 2“.

## Impact

- `src/domain/types.ts`: Typ `Articulation` (`'flam' | 'ghost'`), optionales Feld `Beat.articulations` (pro Instrument und Position); `hits` bleibt unverändert
- `src/domain/sequencer.ts`: `toggleHit` entfernt die Spielweise mit dem Schlag, neue Funktion zum Durchschalten der Spielweise, `changeSubdivision` überträgt Spielweisen
- `src/ui/Sequencer.tsx` und `styles.css`: Shift-Klick, Anzeige der Spielweise in der Zelle (nur Tokens)
- `src/notation/model.ts`, `src/notation/render/vexflow.ts`: Spielweise am Notenkopf, Vorschlag (`GraceNote`) und Klammern (`Parenthesis`)
- `src/persistence/fileFormat.ts`: Schemaversion 3, Validierung der Spielweisen, v2-Import
- Tests: neue Tests je Szenario. „Export“ (`schemaVersion: 2`) in `src/persistence/fileFormat.test.ts` sowie „Neuere Schemaversion“ (Datei mit Version 3) in `fileFormat.test.ts` und `src/ui/persistence.test.tsx` werden an die geänderten Anforderungen angepasst. Alle übrigen Tests bleiben unverändert, weil `hits` seine Form behält und `articulations` fehlen darf.
