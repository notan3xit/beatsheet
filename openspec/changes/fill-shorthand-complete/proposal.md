# Proposal

## Why

Die Fill-Kurzschrift in der Song-Struktur lässt Hi-Hat, Ride, Hi-Hat-Pedal und Ghost Notes weg. Fills, die nur aus diesen Schlägen bestehen, erscheinen als leerer Block, andere wirken lückenhaft. In Fills kommen diese Schläge selten und nicht als durchlaufendes Gerüst vor, sie passen also ohne Überladung in die Kurzschrift.

## What Changes

- Hi-Hat zu (`x`), Hi-Hat offen (`o`), Ride (`r`) und Ride-Glocke (`b`) erscheinen auf der oberen Stufe.
- Das Hi-Hat-Pedal (`x`) erscheint auf der unteren Stufe.
- Ghost Notes erscheinen als `·` auf der Stufe ihres Instruments.
- Crash wird `c` statt `'`.
- Der Vorrang pro Stufe wird um die neuen Zeichen erweitert: Crash vor Tom vor den übrigen Becken, normale Schläge vor Ghost Notes.

## Capabilities

### New Capabilities

### Modified Capabilities
- `songbook-view`: Anforderung „Fill-Kurzschrift“ (Zeichensatz, Vorrang, Ghost Notes)

## Impact

- `src/notation/shorthand.ts` und die zugehörigen Tests in `shorthand.test.ts` und `src/songbook/layout.test.ts`
- Keine Änderung an Datenmodell, Dateiformat, Sequencer, Notenbild oder Wiedergabe
