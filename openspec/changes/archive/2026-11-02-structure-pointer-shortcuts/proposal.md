# Proposal

## Why

Seit `compact-structure-editing` läuft jede Bearbeitung über Auswahl und Popover. Das ist vollständig, kostet aber für die häufigsten Handgriffe mehrere Klicks: einen Takt, Block oder ein Segment an einer bestimmten Stelle einfügen, und Takten einen Groove oder Fill zuweisen. Mit der Maus sollen diese Handgriffe direkt dort gehen, wo man gerade ist. Die Grundschicht aus Auswahl und Popover bleibt dabei unverändert, unter anderem als späterer Weg für Tablets.

## What Changes

- **Einfügen beim Überfahren:** Fährt die Maus über eine Zeile, erscheint an jeder Taktgrenze ein (+), das dort einen Takt einfügt. Über einem Segment erscheint unter seinem letzten Block „(+) Block“, in der Lücke hinter einem Segment „(+) Segment“. Ohne Maus über der Struktur bleibt die Leseansicht frei von Bedienelementen.
- **Patterns auf Takte ziehen:** Die Pattern-Karten der rechten Seite lassen sich auf einen Takt der linken Seite ziehen. Ein Groove wird dort zum Groove des Takts, ein Fill zum Fill am Taktende. Liegt der Takt in der aktuellen Auswahl, gilt es für alle ausgewählten Takte.
- **Neues Pattern ziehen:** Die Knöpfe „Neuer Groove“ und „Neuer Fill“ lassen sich ebenfalls ziehen. Fallen gelassen auf einen Takt, legen sie ein leeres Pattern in der nächsten freien Farbe an und weisen es zu. Ein einfacher Klick öffnet wie bisher den Pattern-Editor.
- Während des Ziehens sind die Takte hervorgehoben, auf die das Pattern fallen würde. Escape oder Loslassen außerhalb eines Takts bricht ab, ohne etwas zu ändern.

Nicht enthalten: Takte zwischen Blöcken verschieben, Patterns innerhalb der Struktur von Takt zu Takt ziehen, ein Tablet-Layout (die Abkürzungen erscheinen nur bei Maus) und Tastenkürzel.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `songbook-view`: „Leseansicht ohne Bedienelemente“ lässt beim Überfahren mit der Maus Einfüge-Knöpfe zu. Neue Anforderungen „Takt einfügen beim Überfahren“, „Block und Segment einfügen beim Überfahren“, „Patterns auf Takte ziehen“, „Neues Pattern ziehen“ und „Ziehen abbrechen“.

## Impact

- `src/ui/StructurePage.tsx`: Hover-Zustand pro Zeile und Segment, (+)-Knöpfe, Takt-Knöpfe als Abwurfziele (`data-bar-id`) mit Hervorhebung
- `src/ui/PatternPage.tsx`: Karten sowie „Neuer Groove“/„Neuer Fill“ als Ziehquellen
- Neu: ein kleiner Drag-Zustand für die Doppelseite (Zeiger-Ereignisse, Trefferprüfung, Abbrechen) und das schwebende Ziehbild
- `src/domain`: keine neue Fachlogik. Verwendet werden `insertBarAfter`/`insertBarBefore`, `appendBlockLike`, `insertSegmentAfter`, `setBarProps` und `assignPlaceholder`.
- Tests: neue UI-Tests. Der Test „Song mit Struktur ohne Auswahl“ bleibt gültig, weil er ohne Hover prüft.
