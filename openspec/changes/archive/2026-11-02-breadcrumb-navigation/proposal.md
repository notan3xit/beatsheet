# Proposal

## Why

Die Navigation zwischen Song-Liste, Doppelseite und Pattern-Editor läuft über einzelne Zurück-Knöpfe („Alle Songs“, „Zurück zum Song“). Man sieht nicht, wo man gerade ist, und kann aus dem Pattern-Editor nicht direkt zur Song-Liste springen. Songtitel und Patternname stehen als dauerhaft offene Eingabefelder im Kopf, statt als Überschrift, die das Blatt benennt. Die Song-Liste wirkt roh: Die Einträge haben nur unten eine Linie, und außer der Taktzahl steht nichts über den Song da.

## What Changes

- **Breadcrumbs:** Doppelseite und Pattern-Editor bekommen eine zweizeilige Kopfzeile. Oben steht der Pfad (`Songs >` bzw. `Songs > <Song> >`), dessen Glieder zur Song-Liste bzw. zur Doppelseite führen; darunter die Überschrift des aktuellen Blatts. Die Knöpfe „Alle Songs“ und „Zurück zum Song“ entfallen. Die Song-Liste trägt die Überschrift „Songs“.
- **Editierbare Überschrift:** Songtitel (Doppelseite) und Patternname (Pattern-Editor) erscheinen als Überschrift. Ein Klick macht sie zum Eingabefeld; Enter oder Verlassen übernimmt, Escape verwirft. Ein leerer Name wird wie bisher abgelehnt.
- **Song-Liste als Tabelle:** Spalten Titel, Takte, Grooves, Fills mit Kopfzeile; Zahlen rechtsbündig; Linien oben und zwischen den Zeilen. Ein Klick auf eine Zeile öffnet den Song wie bisher.

Unverändert: Länge, Typ und Aktionen im Pattern-Editor (sie stehen neben der Überschrift), „Song löschen“, die App-Kopfzeile mit Export und Import.

## Capabilities

### New Capabilities
- `navigation`: Orientierung und Wechsel zwischen Song-Liste, Doppelseite und Pattern-Editor (Breadcrumbs) sowie die editierbare Überschrift eines Songs bzw. Patterns.

### Modified Capabilities
- `song-library`: „Song-Liste“ zeigt eine Tabelle mit Titel, Takten, Grooves und Fills.

## Impact

- Neu `src/ui/Breadcrumbs.tsx` und `src/ui/EditableHeading.tsx`; `CommitField` bleibt für Popover (Segmentname) erhalten
- `src/ui/Songbook.tsx` (`SongHeader`), `src/ui/PatternEditor.tsx` (Kopf, `NameField`), `src/ui/SongList.tsx` (Tabelle, Überschrift), `src/ui/styles.css` (nur Tokens)
- Tests: Die Bedienung ändert sich fachlich, daher werden bestehende Tests angepasst, die „Alle Songs“, „Zurück zum Song“ sowie die Felder „Songtitel“ und „Name“ verwenden: `src/ui/songList.test.tsx`, `src/ui/songbook.test.tsx`, `src/ui/patternPage.test.tsx`, `src/ui/patternEditor.test.tsx`, `src/ui/structureShortcuts.test.tsx`; dazu „Sortierte Liste“ (Tabellenzeilen statt Listeneinträge). Domäne und Store bleiben unverändert.
