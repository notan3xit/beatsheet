# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests bleiben unverändert.

## 1. Capability `pattern-sequencer`: Unterteilung Zweiunddreißigstel

- [x] 1.1 Tests aus den Szenarien erfassen (rot): in `src/domain/sequencer.test.ts` „Beat auf Zweiunddreißigstel umstellen“, „Sechzehntel nach Zweiunddreißigstel“ (1–4 → 1, 3, 5, 7, keine Verluste), „Zweiunddreißigstel nach Sechzehntel mit Verlust“ (Verlust gemeldet, nur Position 1 bleibt); in `src/ui/sequencer.test.tsx` Auswahl „Zweiunddreißigstel“ für Beat 1 → acht Zellen, Reihenfolge der Optionen Achtel, Sechzehntel, Zweiunddreißigstel, Achteltriolen, Sechzehnteltriolen; Wechsel mit Verlust fragt nach. Prüfen: `npm test -- sequencer` rot
- [x] 1.2 `SUBDIVISIONS`/`SUBDIVISION_LABELS` in `src/domain/types.ts` (design.md D1); vorläufige Einträge für 8 in `DURATIONS` nur so weit, dass der Typ stimmt, die eigentliche Zerlegung folgt in 2.2. Breite je Beat in `src/ui/Sequencer.tsx` (D3). Prüfen: Tests aus 1.1 grün, `npx tsc --noEmit` fehlerfrei

## 2. Capability `drum-notation`: Notenwerte für Zweiunddreißigstel

- [x] 2.1 Tests aus den Szenarien erfassen (rot): in `src/notation/model.test.ts` „Zweiunddreißigstel“ (acht Noten `32`, gebalkt, keine Tuplet-Kennzeichnung), „Punktierte Sechzehntel aus Zweiunddreißigstel-Raster“ (`16d`, `8`, Pause `32`), „Pause vor Zweiunddreißigstel“ (Pausen summieren sich auf 7/8 Beat, dann Note `32`); in `src/notation/render/vexflow.test.ts` „Zweiunddreißigstel im Beat“ (ein Balken über acht Noten, der am Beatende endet) und Punkt an der `16d`-Note. Prüfen: `npm test -- model vexflow` rot
- [x] 2.2 `Duration` und `DURATIONS[8]` in `src/notation/model.ts`, Punkt für alle punktierten Dauern in `src/notation/render/vexflow.ts` (D2). Prüfen: Tests aus 2.1 grün

## 3. Absicherung: Wiedergabe, Kurzschrift, Dateiformat

- [x] 3.1 Tests ergänzen (sollen ohne Code-Änderung grün sein; schlagen sie fehl, Ursache beheben): `src/domain/playback.test.ts` Position 2 eines 32tel-Beats bei 1/8 Beat; `src/notation/shorthand.test.ts` Snare-Roll in 32teln ergibt acht Zeichen mit Breite 1/8; `src/persistence/fileFormat.test.ts` Rundlauf mit Unterteilung 8 bei Schemaversion 3 und Abweisung einer Position 8 in einem 32tel-Beat. Prüfen: `npm test -- playback shorthand fileFormat` grün

## 4. Capability `pattern-sequencer`: kurze Bezeichnungen

- [x] 4.1 Tests anpassen bzw. erfassen (rot) in `src/ui/sequencer.test.tsx`: Optionen werden über die neuen Bezeichnungen gewählt („8tel“, „16tel“, „32tel“, „8tel-Triolen“); neu „Bezeichnungen in der Auswahl“ (Reihenfolge aller sechs). Prüfen: `npm test -- sequencer` rot
- [x] 4.2 `SUBDIVISION_LABELS` in `src/domain/types.ts` nach design.md D1. Prüfen: `npm test -- sequencer` grün bis auf die Tests für Unterteilung 12 aus Gruppe 5

## 5. Zweiunddreißigsteltriolen (`pattern-sequencer`, `drum-notation`)

- [x] 5.1 Tests aus den Szenarien erfassen (rot): `src/domain/sequencer.test.ts` „Beat auf Zweiunddreißigsteltriolen umstellen“, „Sechzehnteltriole nach Zweiunddreißigsteltriole“ (1–6 → 1, 3, …, 11), „Achteltriole nach Zweiunddreißigsteltriole“ (1–3 → 1, 5, 9); `src/ui/sequencer.test.tsx` Auswahl „32tel-Triolen“ → zwölf Zellen; `src/notation/model.test.ts` „Zweiunddreißigsteltriole“ (zwölf Noten `32`, gebalkt, `tuplet` 12); `src/notation/render/vexflow.test.ts` Klammer mit „12“ und dreifacher Balken. Prüfen: `npm test -- sequencer model vexflow` rot
- [x] 5.2 `SUBDIVISIONS` um 12 (D1), `DURATIONS[12]` und `tuplet` 12 in `src/notation/model.ts`, `notesOccupied` aus dem Tuplet in `src/notation/render/vexflow.ts` (D2), Mindestbreite 18rem in `src/ui/Sequencer.tsx` (D3). Prüfen: Tests aus 5.1 grün, `npx tsc --noEmit` fehlerfrei
- [x] 5.3 Absicherung ohne Code-Änderung: `src/domain/playback.test.ts` Position 2 eines 12er-Beats bei 1/12 Beat; `src/persistence/fileFormat.test.ts` Rundlauf mit Unterteilung 12. Prüfen: `npm test -- playback fileFormat` grün

## 6. Integration

- [x] 6.1 Gesamtlauf: `npm test` und `npm run build` grün
- [x] 6.2 Im Browser (Release-Build) prüfen und Ergebnis in design.md festhalten: Auswahl mit kurzen Bezeichnungen lesbar; Beat auf 32tel und 32tel-Triolen umstellen, acht bzw. zwölf Zellen gut klickbar; Notenbild (dreifacher Balken, punktierte Sechzehntel, Pausen, „12“) lesbar, auch in der Mini-Darstellung der Patternseite; Wiedergabe eines 32tel-Rolls und einer 32tel-Triole bei 120 BPM
- [x] 6.3 `openspec validate thirty-second-notes --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
