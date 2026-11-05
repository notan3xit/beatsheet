# Proposal

## Why

Auf der Patternseite stehen erst alle Grooves, dann alle Fills. Im Zwei-Spalten-Raster entstehen Löcher, sobald eine Karte beide Spalten belegt, und die Fills stehen am Ende, weit weg von der Stelle, an der sie gespielt werden. Grooves und Fills sehen auf der Patternseite gleich aus, anders als in der Struktur. Die Chips im Takt-Popover folgen der Reihenfolge, in der die Patterns angelegt wurden.

## What Changes

- Die Patternseite ordnet die Patterns nach ihrem ersten Auftreten in der Struktur, Grooves und Fills gemischt; im selben Takt steht der Groove vor dem Fill. Nicht verwendete Patterns folgen am Ende, Grooves vor Fills, jeweils alphabetisch.
- Die Karten fließen in natürlicher Breite statt in zwei Spalten: Jede Karte ist so breit wie ihre Noten, mindestens so breit wie eine knappe Kopfzeile, und bricht in die nächste Zeile, wenn sie nicht mehr in die laufende passt. Die Patternseite bleibt höchstens zwei 4-Beat-Karten breit.
- Fill-Karten erscheinen gerahmt und getönt wie die Fill-Blöcke der Struktur, Groove-Karten mit der Kante links wie die Groove-Balken.
- Die Chips im Takt-Popover stehen in derselben Reihenfolge wie die Karten.

## Capabilities

### New Capabilities

_Keine._

### Modified Capabilities

- `songbook-view`: Reihenfolge der Patternseite; „Zweispaltige Patternseite“ wird zu „Karten im Fluss“; Optik von Fill- und Groove-Karten; Reihenfolge der Pattern-Chips; Breitenangaben der Doppelseite in Karten statt Spalten.

## Impact

- `src/songbook/layout.ts`: Sortierung `songPatternOrder` statt `patternPageOrder`.
- `src/ui/PatternPage.tsx`, `src/ui/NotationView.tsx`: Klassen `groove`/`fill` statt `wide`, Umbruchbreite der Noten aus der Breite der Patternseite.
- `src/ui/PatternChips.tsx`: Reihenfolge der Chips.
- `src/notation/render/vexflow.ts`: `naturalCardWidth` entfällt.
- `src/ui/styles.css`: `.pattern-grid`, `.pattern-card`, `.pattern-card-header`.
- Tests: `src/songbook/layout.test.ts`, `src/ui/patternPage.test.tsx`, `src/ui/structureEditor.test.tsx`, `src/ui/styles.test.ts`, `src/notation/render/vexflow.test.ts`.

Keine Auswirkung auf Dateiformat, Song-Dokument, Abgleich und Server.
