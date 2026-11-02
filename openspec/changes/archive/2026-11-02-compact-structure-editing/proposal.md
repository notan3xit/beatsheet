# Proposal

## Why

Die linke Buchseite ist zu groß, um einen Song beim Spielen zu überblicken: Jede Zeile ist mit Abstand fast 5rem hoch, ein Song mit 80 Takten braucht mehrere Bildschirmhöhen. Dazu ist der Struktur-Editor formularlastig. Oben steht ein Segment-Formular mit fünf Feldern, unten ein Inspector mit Auswahllisten und Inline-Formularen, und in der Leseansicht hängen an jedem Segment sechs Buttons. Die Struktur soll kompakt lesbar werden, und Bearbeiten soll nur dann Platz kosten, wenn man tatsächlich bearbeitet.

## What Changes

- **Kompakte Leseansicht:** Takte werden zu flachen, länglichen Balken. Es bleibt bei höchstens 4 Takten pro Zeile. Die Leseansicht enthält keine Bedienelemente mehr.
- **Jeder Block beginnt eine neue Zeile.** Blöcke sind dadurch dezent sichtbar, ohne eigenes Bedienelement. **BREAKING** für das Layout: Bisher liefen Blöcke innerhalb eines Segments in derselben Zeile weiter.
- **Fill-Blöcke ohne Mini-Noten:** Ein kurzer Fill zeigt Farbe und Namen, die Noten stehen auf der rechten Seite.
- **Auswahl = Bearbeiten:** Ein Klick auf einen Segmentnamen oder auf Takte (Shift = Bereich) wählt sie aus und öffnet ein Popover an der Auswahl. Es enthält alle Aktionen für diese Auswahl. Esc oder ein Klick daneben beendet die Auswahl.
  - **Segment-Popover:** Name, nach oben/unten, duplizieren, Segment danach einfügen, Block unten anfügen, löschen.
  - **Takt-Popover:** Groove und Fill als Farbchips (bestehende Patterns, „neu“ in der nächsten freien Farbe, „kein“), Taktlänge mit −/+, Takt davor/danach einfügen, löschen, Akzente (bei einem Takt).
- **Anlegen ohne Formular:** Ein neues Segment heißt „Segment N“ und hat einen Block mit 4 Takten 4/4 ohne Groove. Es wird sofort ausgewählt, damit man es benennen kann. Ein neuer Block übernimmt die Taktzahl des vorigen Blocks sowie Länge und Groove von dessen letztem Takt. Ein neuer Groove heißt „Groove N“ und hat 4 Beats, ein neuer Fill heißt „Fill N“ und hat 1 Beat. Namen und Längen ändert man im Pattern-Editor.
- **Entfällt:** das Formular „Segment anfügen“, der BarInspector mit Auswahllisten und Inline-Formularen, die Segment-Buttons in der Leseansicht, „Takt am Blockende anfügen“ (ersetzt durch „Takt danach“ am letzten Takt) und das explizite Löschen eines Blocks (ein Block entfällt mit seinem letzten Takt).

Nicht enthalten: Hover-(+) an Takt- und Segmentgrenzen sowie Drag-and-Drop der Groove-Chips. Beides sind Maus-Abkürzungen und kommen in einem eigenen Change (`structure-pointer-shortcuts`). Ebenfalls nicht enthalten: Takte zwischen Blöcken verschieben, ein Tablet-Layout, eine Neugestaltung des Akzent-Editors und Undo für Strukturänderungen.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `songbook-view`: kompakte, maßstabsgetreue Struktur mit einer Zeile pro Blockanfang, Fill-Blöcke ohne Mini-Noten, neue Anforderungen zu kompakten Zeilen, Leseansicht ohne Bedienelemente, Bearbeiten über die Auswahl, Segment- und Takt-Popover und Pattern-Chips
- `song-structure`: „Segmente anlegen“ (Formular) entfällt zugunsten von „Segmente einfügen“ (ohne Eingabe, an einer Stelle), Blöcke mit Vorgaben unten anfügen, Takte davor/danach einfügen, Blöcke entfallen mit ihrem letzten Takt, Platzhalter ohne Namens- und Längeneingabe

## Impact

- `src/domain/structure.ts`: neue reine Funktionen `insertSegmentAfter`, `appendBlockLike` und `insertBarBefore`. `appendBlock` mit Eingabeobjekt und `deleteBlock` werden in der UI nicht mehr verwendet.
- `src/songbook/layout.ts`: Zeilen beginnen an jedem Blockanfang, `FillItem.mini` entfällt.
- `src/ui`: `StructureToolbar` und `BarInspector` entfallen. Neu sind `SegmentPopover`, `BarPopover` und `PatternChips`. `StructurePage` wird auf Auswahl und Popover umgebaut, `styles.css` auf flache Balken.
- `src/notation`: Die Mini-Darstellung (`compact`) wird in der Struktur nicht mehr verwendet und bleibt vorerst bestehen.
- Tests: `structureEditor.test.tsx`, der Struktur-Teil von `songbook.test.tsx` und die Layout-Tests zu Zeilen und Mini-Fills werden fachlich angepasst. Die Specs ändern sich, deshalb sind diese Anpassungen gemäß `AGENTS.md` zulässig.
