# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe werden zuerst die Szenarien der Delta-Spec als Tests erfasst. Diese Tests müssen rot sein, bevor implementiert wird. Eine Gruppe ist abgeschlossen, sobald ihre Tests grün sind. Bestehende Tests bleiben unverändert. Der Test „Song mit Struktur ohne Auswahl“ prüft ohne Hover und gilt weiter.

## 1. Layout: erste Zeile eines Blocks

- [x] 1.1 Test erfassen (rot): in `src/songbook/layout.test.ts` hat ein Block mit 5 Takten zwei Zeilen mit `firstInBlock` true/false, ein zweiter Block hat wieder `firstInBlock: true`. Prüfen: `npm test -- layout` rot
- [x] 1.2 `Row.firstInBlock` in `layoutStructure` ergänzen (design.md D1). Prüfen: `npm test -- layout` grün, `npx tsc --noEmit` fehlerfrei

## 2. Capability `songbook-view`: Einfügen beim Überfahren

- [x] 2.1 Tests aus den Szenarien erfassen (rot), neue Datei `src/ui/structureShortcuts.test.tsx`: „Takt zwischen zwei Takten“ (`user.hover` auf die Zeile, Knopf „Takt nach Takt 2 einfügen“), „Takt am Blockanfang“ („Takt vor Takt 1 einfügen“ nur in der ersten Zeile eines Blocks), „Touch“ (`fireEvent.pointerEnter` mit `pointerType: 'touch'` → kein Knopf), „Maus verlässt die Struktur“ (`user.unhover` → keine Einfüge-Knöpfe), „Block anfügen“ und „Segment einfügen“ (neues Segment ausgewählt). Prüfen: Tests rot
- [x] 2.2 Hover-Zustand und Einfüge-Knöpfe in `StructurePage` nach D1 implementieren, CSS für `.insert-bar` und `.insert-strip` (nur Tokens, keine Farbliterale). Prüfen: Tests aus 2.1 grün, `styles.test.ts` und `songbook.test.tsx` weiter grün

## 3. Capability `songbook-view`: Patterns auf Takte ziehen

- [x] 3.1 Tests aus den Szenarien erfassen (rot) in `structureShortcuts.test.tsx`, mit `hitTest` über `App` und Zeiger-Ereignissen `pointerDown`/`pointerMove`/`pointerUp` (über 5px Bewegung): „Groove auf einen Takt“, „Groove auf die Auswahl“, „Fill auf einen Takt“, „Hervorhebung beim Ziehen“ (Klasse `drop-target` auf Takt 5–8), „Neuen Groove ziehen“ (Groove 2 in `nextColor`, Doppelseite bleibt), „Klick auf ‚Neuer Groove‘“ (Editor öffnet sich), „Loslassen neben der Struktur“, „Escape beim Ziehen eines neuen Fills“. Prüfen: Tests rot
- [x] 3.2 `DragProvider`/`useDragSource` in `src/ui/dragPattern.tsx` nach D2 implementieren (Schwelle, Treffer über `hitTest`, Resolver für Zieltakte, Abwerfen, Abbrechen, Klick-Unterdrückung nach dem Ziehen, Ziehbild). `hitTest` als optionale Prop von `App`, über `HitTestContext` an den Provider. Prüfen: `npx tsc --noEmit` fehlerfrei
- [x] 3.3 Quellen und Ziele anbinden: Kartenkopf sowie „Neuer Groove“/„Neuer Fill“ als Quellen (D4), `data-bar-id` und `drop-target` an den Takt-Knöpfen, Resolver aus der Auswahl registrieren, `useDismiss` ignoriert `[data-drag-source]` (D3). CSS für Ziehbild, `drop-target` und `dragging-pattern`. Prüfen: Tests aus 3.1 grün, `npm test` grün

## 4. Integration

- [x] 4.1 Gesamtlauf: `npm test` und `npm run build` grün
- [x] 4.2 Im Browser (Release-Build) prüfen: Die (+)-Knöpfe sind gut treffbar und flackern beim Wechsel zwischen Zeilen nicht, Ziehen von Karten und „Neuer Groove/Fill“ auf Takte und Auswahl funktioniert, Hervorhebung und Ziehbild sind gut sichtbar, ein Klick auf „Bearbeiten“ und „Neuer Groove“ verhält sich wie vorher. Ergebnis in design.md festhalten
- [x] 4.3 `openspec validate structure-pointer-shortcuts --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
