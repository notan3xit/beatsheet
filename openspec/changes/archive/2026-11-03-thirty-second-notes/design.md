# Design

## Context

Die Unterteilung eines Beats ist `Subdivision = 2 | 4 | 3 | 6` aus `SUBDIVISIONS` in `src/domain/types.ts`. Davon hängen ab:

- **Allgemein gerechnet** (keine Änderung nötig): `changeSubdivision` (Übertragung über `position * neu / alt`), `patternHits`/`patternSteps` (Wiedergabe), `shorthand` (Kurzschrift), das Zod-Schema in `fileFormat.ts` (`z.union(SUBDIVISIONS.map(z.literal))`) und die Auswahlliste im Sequencer (`SUBDIVISIONS.map`).
- **Je Unterteilung festgelegt:** `DURATIONS` in `src/notation/model.ts` (Rastereinheiten → Notenwert), der Typ `Duration` (`'w' | 'h' | 'q' | '8d' | '8' | '16'`) und im Renderer der Punkt, der nur für `'8d'` gesetzt wird.
- **Layout:** Der Sequencer gibt jedem Beat `minmax(6.5rem, 1fr)`; vier Zellen passen, acht wären unter 0,7 rem breit.

## Goals / Non-Goals

**Goals:**
- Unterteilung 8 überall dort, wo heute 4 geht, und Unterteilung 12 überall dort, wo heute 6 geht, jeweils mit korrektem Notenbild.
- Keine Sonderfälle für 8 in Logik, die schon allgemein rechnet.

**Non-Goals:**
- Akzente im 32tel-Raster.

## Decisions

### D1: `SUBDIVISIONS = [2, 4, 8, 3, 6, 12]` mit kurzen Bezeichnungen

Die Reihenfolge bestimmt die Auswahlliste: erst die geraden Werte aufsteigend, dann die Triolen. `SUBDIVISION_LABELS` wird auf die kurze Schreibweise umgestellt: „8tel“, „16tel“, „32tel“, „8tel-Triolen“, „16tel-Triolen“, „32tel-Triolen“. Einheitlich Zahl + „tel“, auch bei 32 (regelkonform wäre „32stel“; „32tel“ ist in Noten und Lehrmaterial ebenso verbreitet und hält die Liste einheitlich). Die Bezeichnungen erscheinen auch in der Rückfrage beim Wechsel mit Verlust („Beim Wechsel von Beat 1 auf 8tel-Triolen …“). `Subdivision` folgt dem Array, damit erzwingt der Compiler den neuen Eintrag in `SUBDIVISION_LABELS` und `DURATIONS`.

### D2: Notenwerte für Unterteilung 8

`Duration` bekommt `'16d'` und `'32'`. Zerlegung in Rastereinheiten (Zweiunddreißigstel), größte zuerst:

```
8: [[8, 'q'], [6, '8d'], [4, '8'], [3, '16d'], [2, '16'], [1, '32']]
```

Unterteilung 12 (Zweiunddreißigsteltriolen) nutzt dieselbe Zerlegung innerhalb einer Tuplet-Klammer, so wie 6 die Zerlegung von 4 nutzt. `BeatGroup.tuplet` wird `3 | 6 | 12 | null`; der Renderer setzt `notesOccupied = tuplet * 2 / 3` (3 → 2, 6 → 4, 12 → 8) statt der bisherigen Fallunterscheidung. Die Klammer zeigt „12“, eine Klammer je Beat wie bei „3“ und „6“.

Damit ergeben sich z. B. bei Schlägen auf 1 und 4: `16d` (3 Einheiten), dann `8` + Pause `32` (5 Einheiten). Der Renderer setzt den Punkt für jede Dauer, die auf `d` endet (statt nur `'8d'`). Die Balken bleiben je Beat (`beamed` bei mindestens zwei Noten kürzer als eine Viertel); VexFlow zeichnet drei Balken für Zweiunddreißigstel selbst.

### D3: Breite je Beat im Sequencer

`gridTemplateColumns` wird pro Beat gebildet, mit einer Mindestbreite je Unterteilung: 6.5rem wie bisher für 2, 3, 4 und 6, 12rem für 8 und 18rem für 12 (jeweils gut 1,3 rem je Zelle). Eine feste Tabelle statt einer Formel aus der Zellenzahl, weil eine Formel auch Sechzehnteltriolen-Beats verbreitern würde. Das Raster bleibt im waagerecht scrollbaren Bereich (`.sequencer-scroll`), der das bereits auffängt.

Alternative: alle Beats gleich breit nach der feinsten Unterteilung im Pattern. Verworfen: Ein einzelner 32tel-Beat würde das ganze Raster verbreitern.

### D4: Dateiformat ohne neue Schemaversion

Das Schema übernimmt 8 automatisch über `SUBDIVISIONS`. Nach der Regel in `AGENTS.md` steigt die Version nicht, weil ältere Versionen den Wert nicht falsch lesen, sondern die Datei als beschädigt abweisen. Die Plausibilitätsprüfung „Position innerhalb des Rasters“ (`p < subdivision`) gilt unverändert.

## Risks / Trade-offs

- [Breite Beats verlängern die Zeile] → nur Beats in Zweiunddreißigsteln werden breiter; der Bereich scrollt waagerecht wie bei langen Patterns.
- [„12“ über 32tel-Triolen ist eine von mehreren üblichen Schreibweisen (auch vier Gruppen mit „3“)] → eine Klammer je Beat wie bei den anderen Triolen; bei Bedarf später änderbar, ohne das Datenmodell zu berühren.
- [Notenbild sehr dicht bei acht bzw. zwölf Noten je Beat] → VexFlow formatiert nach Tick-Dauern; im Browser prüfen (Task 4.2), ob der Takt lesbar bleibt.
- [Ältere Versionen lehnen Dateien mit Zweiunddreißigsteln ab] → bewusst (D4); betrifft nur Dateien, die den neuen Wert enthalten.

## Prüfung im Browser

Release-Build von artjom im Browser geprüft (2026-11-03): kurze Bezeichnungen, 32tel und 32tel-Triolen im Sequencer, Notenbild und Wiedergabe ohne Beanstandung.
