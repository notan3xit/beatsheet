# Proposal

## Why

Akzente auf derselben Position werden übereinander gezeichnet, der zuletzt eingetragene verdeckt die anderen. Im Beispiel-Song zeigt der Schlusstakt mit Crash und Bassdrum nur „BD“. Hand- und Fußakzent sollen gleichzeitig lesbar sein, ohne dass sich Markierungen überlagern.

## What Changes

- Je Beat erscheinen höchstens zwei Akzent-Markierungen: eine für Hand-Instrumente über dem Takt, eine für Fuß-Instrumente (Bassdrum, Hi-Hat-Pedal) unter dem Takt.
- Haben mehrere Hand-Akzente denselben Beat, zeigt die Markierung das höchste Instrument; bei Fuß-Akzenten das niedrigste. Maßgeblich ist die Reihenfolge der Sequencer-Zeilen.
- Die Markierung steht an der Position des angezeigten Akzents.
- Die übrigen Akzente bleiben gespeichert, klingen bei der Wiedergabe und stehen weiter im Takt-Popover.

## Capabilities

### New Capabilities

### Modified Capabilities
- `songbook-view`: „Akzent-Markierungen“ legt Ort und Auswahl der Markierungen je Beat fest.

## Impact

- `src/songbook/layout.ts` (Auswahl je Beat, Lage oben/unten am `AccentItem`), `src/ui/StructurePage.tsx`, `src/ui/styles.css`
- Keine Änderung an Datenmodell, Dateiformat, Abgleich oder Wiedergabe
