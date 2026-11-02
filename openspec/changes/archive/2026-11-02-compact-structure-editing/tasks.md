# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe werden zuerst die Szenarien der jeweiligen Spec als Tests erfasst. Diese Tests müssen rot sein, bevor implementiert wird. Eine Gruppe ist abgeschlossen, sobald ihre Tests grün sind. Bestehende Tests werden nur dort angepasst, wo die Delta-Specs dieses Changes Anforderungen ändern (MODIFIED in `song-structure` und `songbook-view`).

## 1. Capability `song-structure` (geändert): Domain

- [x] 1.1 Tests aus den Szenarien erfassen (rot): in `src/domain/structure.test.ts` „Erstes Segment“, „Segment dazwischen einfügen“, „Takt davor einfügen“, „Block unten anfügen“, „Block an Segment ohne Blöcke“, „Taktlänge ändern“ (zweimal −1), „Länge gemischter Auswahl erhöhen“, „Grenze in gemischter Auswahl“, „Neuer Groove als Platzhalter“ (Name „Groove 2“, nächste freie Farbe), „Neuer Fill als Platzhalter“ (Fill 1, 1 Beat). Tests zu `appendBlock(input)`/`appendBar` auf die geänderte Anforderung umstellen. Prüfen: `npm test -- structure` zeigt die neuen Tests rot
- [x] 1.2 `insertSegmentAfter`, `appendBlockLike`, `insertBarBefore`, `changeBarLength` und `canChangeBarLength` nach design.md D6 implementieren. `addPlaceholder` ohne Namen und mit Fill-Länge 1 aufrufbar halten. Prüfen: `npm test -- structure` grün
- [x] 1.3 Nicht mehr benötigte Funktionen (`appendBlock` mit Eingabeobjekt, `appendBar`, `deleteBlock`) entfernen, sofern sie nur noch in überholten Tests vorkamen. Prüfen: `npx tsc --noEmit` fehlerfrei

## 2. Capability `songbook-view` (geändert): Layout

- [x] 2.1 Tests aus den Szenarien erfassen (rot): in `src/songbook/layout.test.ts` „Neuer Block in neuer Zeile“ (2 + 4 Takte → zwei Zeilen, zweite mit `blockStart`), „Kurzer Fill“ ohne `mini`. Den Blockanfangs-Test auf `Row.blockStart` umstellen. Prüfen: `npm test -- layout` rot
- [x] 2.2 `layoutStructure` nach D1 umbauen: Zeilen pro Block, `Row.blockId`/`blockStart`, `FillItem.mini` und `BarFrame.blockStart` entfernen. Prüfen: `npm test -- layout` grün, `npx tsc --noEmit` fehlerfrei

## 3. Capability `songbook-view` (geändert): Kompakte Leseansicht

- [x] 3.1 Tests aus den Szenarien erfassen (rot): `styles.test.ts` „Zeilenmaße“ (`.structure-row` höchstens 1.5rem hoch, Abstand höchstens 0.5rem). In `songbook.test.tsx` „Kurzer Fill“ (Name sichtbar, keine Noten im Fill-Block), „Langer Groove-Name“ (`title` mit vollständigem Namen), „Song mit Struktur ohne Auswahl“ (keine `textbox`/`combobox`, nur Takt- und Segment-Buttons) und „Leerer Song“ (genau „Erstes Segment anlegen“). Prüfen: Tests rot
- [x] 3.2 `StructurePage` auf die kompakte Darstellung umbauen (D2): flache Zeilen, Taktnummer-Spalte, Blockabstand, Groove/Fill mit Ellipse und `title`, Akzent-Marker an der Oberkante, Fill ohne `NotationView`. Toolbar und Segment-Buttons aus der Leseansicht entfernen, Segmentname als auswählbarer Button in der Überschrift, Leerzustand mit „Erstes Segment anlegen“. Prüfen: Tests aus 3.1 grün, `styles.test.ts` grün (keine Farbliterale)

## 4. Capability `songbook-view` (geändert): Auswahl und Popover

- [x] 4.1 Tests aus den Szenarien erfassen (rot): in `structureEditor.test.tsx` „Takte auswählen“ (Dialog „Takt-Auswahl“ offen), „Segment auswählen“ (Auswahl wechselt, Dialog „Segment Verse“), „Auswahl aufheben“ (Escape und Klick außerhalb), „Segment umbenennen“, „Erstes Segment nicht nach oben“, „Groove-Chips“ (A gewählt, „Neuer Groove“ in nächster freier Farbe, „kein“), „Gemischte Auswahl“, „Akzente nur bei einem Takt“, „Taktlänge an den Grenzen“. Prüfen: Tests rot
- [x] 4.2 `useStructureSelection` nach D3 implementieren (Segment oder Takte, Shift-Bereich, Bereinigung, Escape/Klick außerhalb, Bestätigungsdialog zählt als innen). Prüfen: Auswahl-Tests aus 4.1 grün
- [x] 4.3 Popover-Gerüst nach D4 (Verankerung in der Zeile über Beats, `role="dialog"`, Begrenzung am rechten Rand) und `PatternChips` nach D5 (inkl. `data-pattern-id`/`data-pattern-new`) implementieren. Prüfen: „Groove-Chips“ und „Gemischte Auswahl“ grün
- [x] 4.4 `SegmentPopover` implementieren: Name, ↑/↓ (an den Rändern deaktiviert), Duplizieren, Segment danach einfügen (neues Segment wird ausgewählt), Block anfügen, Löschen mit Bestätigung. Prüfen: Segment-Tests aus 4.1 grün

## 5. Capability `song-structure` (geändert): Bearbeiten im Takt-Popover

- [x] 5.1 Tests aus den Szenarien erfassen (rot): `structureEditor.test.tsx` auf das Popover umschreiben: „Erstes Segment“ (über den Leerzustand, danach ausgewählt), „Segment dazwischen einfügen“ (beide aus „Segmente einfügen“), „Segment duplizieren“, „Segment verschieben“, Löschen mit Bestätigung, „Block unten anfügen“, „Takt einfügen“, „Takt davor einfügen“, „Letzten Takt eines Blocks löschen“, „Groove für Auswahl setzen“ (Chip B), „Taktlänge ändern“ und „Länge gemischter Auswahl erhöhen“ (−/+), „Fill setzen und entfernen“, „Neuer Groove als Platzhalter“, „Neuer Fill als Platzhalter“, „Crash auf der Eins“ (Akzent im Popover). Die alten Tests für Toolbar und Inspector entfernen. Prüfen: Tests rot
- [x] 5.2 `BarPopover` implementieren: Groove- und Fill-Chips, Länge −/+ mit `changeBarLength`/`canChangeBarLength`, Takt davor/danach, Löschen (Auswahl wird bereinigt), `AccentEditor` bei einem Takt, Fehleranzeige. Prüfen: Tests aus 5.1 grün
- [x] 5.3 `StructureToolbar.tsx` und `BarInspector.tsx` löschen (den `AccentEditor` vorher verschieben), nicht mehr genutzte CSS-Regeln (`.structure-toolbar`, `.bar-inspector`, `.segment-actions`, `.inline-create`) entfernen. Prüfen: `npm run build` fehlerfrei, `npm test` grün

## 6. Integration

- [x] 6.1 Gesamtlauf: `npm test` und `npm run build` grün
- [x] 6.2 Im Browser mit einem Song mit mindestens 80 Takten in mehreren Segmenten und Blöcken prüfen: Die Struktur passt in etwa eine Bildschirmhöhe, das Popover ist am rechten Rand vollständig sichtbar und Esc/Klick außerhalb schließen es. Ergebnis kurz in design.md festhalten
- [x] 6.3 `openspec validate compact-structure-editing --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
- Folge-Change `structure-pointer-shortcuts` (Hover-(+), Drag-and-Drop der Chips) über `/opsx:explore` bzw. `/opsx:propose` anlegen.
