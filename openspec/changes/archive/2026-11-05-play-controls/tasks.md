# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Neue Szenarien kommen nach `src/ui/playControls.test.tsx`.

## 1. Abspiel-Knöpfe

- [x] 1.1 Tests aus den Szenarien erfassen (rot): Anforderungen „Abspiel-Symbole“, „Name und Tooltip der Abspiel-Knöpfe“ und „Gleicher Platz der Abspiel-Knöpfe“ (gleiche Klasse beim Wechsel, Symbol über `data-symbol`), „Farbe der Wiedergabe“ (`--playhead` in der Regel von `.play-button` in `styles.test.ts`); Namen in `playback.test.tsx`, `songPlayback.test.tsx` und `songLock.test.tsx` nach den geänderten Szenarien von `pattern-playback` und `song-playback`, Popover-Knöpfe in `songLock.test.tsx` über den zugänglichen Namen. Prüfen: `npm test -- playControls playback songPlayback songLock` zeigt diese Tests rot
- [x] 1.2 `PlayButton` nach design.md D1 bis D3; `SongTransport`, `Transport` und `PlayActions` darauf umstellen, Mindestbreite von `.transport .play` entfernen. Prüfen: die Tests aus 1.1, `structureEditor` und `styles` grün

## 2. Aufbau der Popovers

- [x] 2.1 Tests erfassen (rot): „Aufbau des Takt-Popovers“ und „Abspiel-Knöpfe zuoberst“ über die Reihenfolge im DOM. Prüfen: `npm test -- playControls` zeigt diese Tests rot
- [x] 2.2 `BarPopover` und `SegmentPopover` nach D4 samt CSS. Prüfen: die Tests aus 2.1, `structureEditor`, `songLock` und `songPlayback` grün

## 3. Zeilen für Groove, Fill und Länge

- [x] 3.1 Tests erfassen (rot): „Einheitliche Zeilen für Groove, Fill und Länge“ über die Reihenfolge und die Klasse `step-button`; „Groove-Chips“ in `structureEditor.test.tsx` nach dem geänderten Szenario. Prüfen: `npm test -- playControls` zeigt diese Tests rot
- [x] 3.2 `PatternChips` und Zeile Länge nach D5. Prüfen: die Tests aus 3.1, `structureEditor` und `styles` grün

## 4. Akzente

- [x] 4.1 Tests erfassen (rot): „Kompakte Akzente im Takt-Popover“. Prüfen: `npm test -- playControls` zeigt diese Tests rot
- [x] 4.2 `AccentEditor` und CSS nach D6. Prüfen: die Tests aus 4.1, `structureEditor` und `styles` grün

## 5. Nachbesserungen aus der Sichtprüfung

- [x] 5.1 Tests erfassen (rot): „Overlay schließt beim Abspielen“; „Aufbau des Takt-Popovers“ mit eigenem Abschnitt für Akzente; „Höhe der Kopfzeile“ über die gemeinsame Regel in `styles.test.ts`; bestehende Tests, die nach dem Start das Popover nutzen, nach dem geänderten Verhalten. Prüfen: `npm test -- playControls songPlayback styles` zeigt diese Tests rot
- [x] 5.2 Kopfzeilen-Knöpfe nach D2, Akzent-Abschnitt nach D4, Schließen nach D4a. Prüfen: die Tests aus 5.1 grün

## 6. Abschluss

- [x] 6.1 Gesamtprüfung: `openspec validate play-controls --strict` fehlerfrei, `npm run build` und `npm test` grün
- [x] 6.2 Im Browser prüfen: Symbole in Latte und Mocha gut erkennbar und in allen Ansichten gleich; Farbe der Knöpfe dezent, auch neben blauen Groove-Chips; Größen passend; beim Starten und Stoppen sowie beim Entsperren springt nichts; Overlay schließt beim Abspielen; Trennlinie zwischen Akzenten und Aktionen; `-` und `+` stehen untereinander; die Akzente-Reihe passt mit „Hi-Hat (geschlossen)“ in eine Zeile

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
