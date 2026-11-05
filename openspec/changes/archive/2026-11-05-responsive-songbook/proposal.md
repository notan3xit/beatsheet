# Proposal

## Why

Die Song-Ansicht hat eine starre Aufteilung 3:2, die Struktur aber eine feste Breite von 16 Beats (Box etwa 653 px). Unter etwa 1100 px Fensterbreite läuft die Struktur über ihre Box auf die Patternseite. Die Patternseite hat dann zu schmale Spalten: Namen brechen Zeichen für Zeichen um, entgegen der Anforderung einer einzeiligen Kopfzeile, und die Noten schrumpfen bis zur Unlesbarkeit. Ziel: Tablet quer nebeneinander, Tablet hochkant untereinander in vollem Maßstab, Smartphone hochkant brauchbar.

## What Changes

- Die Doppelseite steht nebeneinander, solange die Struktur in voller Breite und daneben die Patternseite mit Mindestbreite passen, sonst steht die Patternseite unter der Struktur. Untereinander nehmen beide Seiten die volle Breite ein.
- Die Breite pro Beat richtet sich nach der Breite der Strukturseite: mindestens 2,25rem, solange 16 Beats damit passen, sonst kleiner, und bei viel Platz größer bis 3rem. Die Zeilen umfassen weiterhin 16 Beats. Nichts ragt über die Seiten hinaus.
- Nebeneinander verteilt sich übriger Platz 3:2 auf Struktur und Patternseite, bis beide ihre Höchstbreite erreichen; die Patternseite wird höchstens zwei Spalten breit. So entstehen auf großen Bildschirmen keine leeren Flächen in der Patternseite.
- Die Patternseite zeigt zwei Spalten nur, wenn zwei Karten mit je einem 4-Beat-System ungeschrumpft nebeneinander passen, sonst eine.
- Eine Pattern-Karte belegt beide Spalten, wenn ihre Noten ungeschrumpft nicht in eine Spalte passen, statt nach der Zahl der Beats. Ein Groove mit 4 Beats in 32teln ist etwa doppelt so breit wie einer in Achteln.
- Die Kopfzeile einer Pattern-Karte bleibt einzeilig: Ein zu langer Name wird mit „…“ gekürzt und steht vollständig im Tooltip.
- Segment- und Takt-Popover bleiben innerhalb der linken Seite, auch bei geschrumpftem Maßstab.

Nicht im Umfang: Bereichsauswahl von Takten auf Touch (eigener Change).

## Capabilities

### New Capabilities

_Keine._

### Modified Capabilities

- `songbook-view`: Doppelseite bricht um und verteilt übrigen Platz bis zu Höchstbreiten; Maßstab folgt dem Platz (schrumpft, wächst bis 3rem); Karten über beide Spalten nach Notenbreite; Patternseite mit einer oder zwei Spalten nach Breite; gekürzter Name in der Kopfzeile der Pattern-Karte; Popover innerhalb der linken Seite.

## Impact

- `src/ui/styles.css`: `.songbook` (Container), `.pages`, `.page`, `.structure-page` (`--beat`, Container), `.pattern-page`, `.pattern-grid`, `.pattern-card-header`, `.pattern-name`, `.structure-popover`.
- `src/ui/StructurePopovers.tsx`, `src/ui/StructurePage.tsx`: Popover rückt in die Seite; `POPOVER_BEATS` entfällt.
- `src/ui/PatternPage.tsx`: Tooltip am Namen; Klasse `wide` nach Notenbreite.
- `src/notation/render/vexflow.ts`: natürliche Breite der Noten im Kartenmaßstab.
- Tests: `src/notation/render/vexflow.test.ts`, `src/ui/styles.test.ts`, `src/ui/patternPage.test.tsx`, `src/ui/structureEditor.test.tsx`.

Keine Auswirkung auf Dateiformat, Song-Dokument, Abgleich und Server.
