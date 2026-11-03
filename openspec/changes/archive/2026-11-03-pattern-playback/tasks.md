# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests werden nur dort angepasst, wo die geänderte Anforderung es verlangt (Tempo im Song und im Export).

## 1. Capability `song-library`: Tempo am Song

- [x] 1.1 Tests aus den Szenarien „Song-Tempo“ erfassen (rot): neue Datei `src/domain/playback.test.ts` (`setTempo`: 120 → 140, 29/301/72.5 abgelehnt mit gleicher Referenz, gleicher Wert mit gleicher Referenz) und in `src/state/notebookStore.test.ts` „Tempo eines neuen Songs“ (120) sowie „Tempo ändern“ über `store.updateSong` (Revision 4 → 5) und „Tempo außerhalb des Bereichs“ (Revision unverändert). Prüfen: `npm test -- playback notebookStore` rot
- [x] 1.2 `Song.tempo`, `DEFAULT_TEMPO`/`MIN_TEMPO`/`MAX_TEMPO` in `src/domain/types.ts`, `setTempo` in `src/domain/playback.ts` (design.md D1), `createSong` und `songFromV1Patterns` setzen 120, `songWith` in `src/test/songs.ts` mit Tempo 120 als Vorgabe. Prüfen: Tests aus 1.1 grün, `npx tsc --noEmit` fehlerfrei

## 2. Capability `library-persistence`: Tempo im Format, tolerante Importe

- [x] 2.1 Tests anpassen bzw. erfassen (rot) in `src/persistence/fileFormat.test.ts`: „Export herunterladen“ erwartet weiterhin Schemaversion 3 und zusätzlich den Schlüssel `tempo`; neu „Tempo im Export“ (96 im Rundlauf), „Ungültiges Tempo“ (0 und 72.5 abgewiesen), „Export ohne Tempo importieren“ (v3-Datei mit Flam ohne `tempo` → Tempo 120, Rest unverändert), „Datei der Schemaversion 2“ (Tempo 120), „Zusätzliches Feld aus einer neueren Version“ (unbekannte Felder an Dateikopf, Song, Segment, Block, Takt, Akzent, Pattern und Beat → Import gelingt, Felder entfernt). „Neuere Schemaversion“ (4) bleibt unverändert. Prüfen: `npm test -- fileFormat` rot
- [x] 2.2 `src/persistence/fileFormat.ts` nach design.md D2 (optionales `tempo` mit Ergänzung 120, `.strict()` an allen Objekt-Schemata entfernen, `SCHEMA_VERSION` bleibt 3). Prüfen: Tests aus 2.1 grün, übrige Tests in `fileFormat.test.ts` und `src/ui/persistence.test.tsx` unverändert grün
- [x] 2.3 Test „Start nach dem Update“ erfassen (rot) in `src/persistence/repository.test.ts`: Datensatz ohne `tempo` mit Revision 6 direkt in IndexedDB schreiben, `loadAll` liefert Tempo 120 und Revision 6. Danach Normalisierung in `repository.loadAll` (D1). Prüfen: Test grün, `npm test` grün

## 3. Capability `pattern-playback`: Zeitplan

- [x] 3.1 Tests aus den Szenarien erfassen (rot) in `src/domain/playback.test.ts` für `patternHits`/`patternSteps` (design.md D3): „Sechzehntel“ (Position 2 → 0,25 Beats), „Gemischte Unterteilung“ (Beat 2 Triole Position 3 → 5/3 Beats), „Gleichzeitige Schläge“, „Ghost Note“ (Gain kleiner als normal), „Flam“ (Vorschlag gesetzt, leiser, Hauptschlag auf der Position), „Leeres Pattern“ (keine Hits, aber alle Schritte), Sortierung nach Zeit. Prüfen: `npm test -- playback` rot
- [x] 3.2 `patternHits` und `patternSteps` in `src/domain/playback.ts` implementieren. Prüfen: Tests aus 3.1 grün

## 4. Capability `pattern-playback`: Abspieler und Stimmen

- [x] 4.1 Tests erfassen (rot), neue Datei `src/audio/scheduler.test.ts` mit künstlicher Uhr, manuellem Timer und aufzeichnenden Stimmen: „Wiedergabe starten“ (erster Schlag zur Startzeit), „Wiedergabe stoppen“ (nach `stop` keine weiteren Auslösungen), „Zweiter Durchlauf“ (4 Beats bei 120 BPM → +2 s), „Sechzehntel“ (0,125 s), „Gemischte Unterteilung“ (1⅔ s bei 60 BPM), „Schlag während der Wiedergabe setzen“ (Quelle liefert geändertes Pattern vor Beat 3 → Schlag geplant), „Pattern kürzen während der Wiedergabe“ (Fortsetzung mit Beat 1 ohne Lücke), „Tempo während der Wiedergabe“ (folgende Abstände im neuen Tempo), Flam-Vorschlag 0,03 s vor dem Hauptschlag, „Position folgt der Wiedergabe“ (Meldung des Schritts zur Audiozeit), „Keine Hervorhebung nach Stopp“ (`step: null`). Prüfen: `npm test -- scheduler` rot
- [x] 4.2 `src/audio/scheduler.ts` nach design.md D4 implementieren. Prüfen: Tests aus 4.1 grün
- [x] 4.3 Tests erfassen (rot), neue Datei `src/audio/voices.test.ts` mit aufzeichnendem Fake-`AudioContext`: „Jedes Instrument klingt“ (zehn Instrumente, zehn verschiedene Rezepturen), „Tonhöhe der Toms“ (Tom 1 > Tom 2 > Standtom), Gain skaliert mit dem Pegel des Ereignisses, offene Hi-Hat länger als geschlossene, „Abgestoppt durch das Pedal“ (Gain der offenen Hi-Hat ab der Pedal-Zeit auf 0, ebenso bei geschlossener Hi-Hat). Prüfen: `npm test -- voices` rot
- [x] 4.4 `src/audio/voices.ts` nach D5 und `src/audio/player.ts` (`createWebAudioPlayer`, `available`, `AudioContext` erst beim ersten `start`, `resume()`) nach D6 implementieren; Test für `available = false` ohne `window.AudioContext`. Prüfen: Tests aus 4.3 grün, `npx tsc --noEmit` fehlerfrei

## 5. Capability `pattern-playback`: Bedienung im Pattern-Editor

- [x] 5.1 Tests aus den Szenarien erfassen (rot), neue Datei `src/ui/playback.test.tsx` mit nachgebildetem Player über die `App`-Prop: „Wiedergabe starten“/„Wiedergabe stoppen“ (Name der Taste „Abspielen“ ↔ „Stopp“, `start`/`stop` aufgerufen), Quelle liefert nach einem Klick im Sequencer das geänderte Pattern, „Position folgt der Wiedergabe“ (gemeldeter Schritt → genau diese Spalte in allen Zeilen hervorgehoben), „Keine Hervorhebung nach Stopp“, „Zurück zur Doppelseite“ und Wechsel auf ein anderes Pattern (`stop` aufgerufen, kein Autostart), „Tempo ändern“ (Feld 120 → 90, anderes Pattern desselben Songs zeigt 90), „Tempo während der Wiedergabe“ (Quelle liefert neues Tempo, kein erneutes `start`), „Ungültiges Tempo“ (0 → Feld zeigt wieder 120, Revision unverändert), „Browser ohne Web Audio“ (Taste deaktiviert, Hinweis sichtbar, Sequencer bedienbar), „Start nach dem Update“ (Song ohne Tempo zeigt 120). Prüfen: `npm test -- playback` rot
- [x] 5.2 `PlayerContext` und `player`-Prop an `App`, Hook `usePlayback`, Komponente `Transport` im Kopf von `PatternEditor`, `playhead`-Prop im `Sequencer`, Token `--playhead` und Klasse `.step.playing` in `styles.css` (design.md D6). `src/main.tsx` übergibt `createWebAudioPlayer()`. Prüfen: Tests aus 5.1 grün, `npm test -- styles` grün (Farbregel)
- [x] 5.3 `AGENTS.md`: Aufbau unter `src/` um `audio` ergänzen, `domain` um `playback` (D7); bei `persistence` die Regel aus D2 festhalten (neue Felder optional mit Vorgabe ohne neue Schemaversion, unbekannte Felder werden beim Import ignoriert, Version steigt nur bei inkompatiblen Änderungen). Prüfen: Abschnitt nennt `audio`, `playback` und die Regel

## 6. Integration

- [x] 6.1 Gesamtlauf: `npm test` und `npm run build` grün
- [x] 6.2 Im Browser (Release-Build) prüfen und Ergebnis in design.md festhalten: Pattern mit allen zehn Instrumenten, Triolen, Ghost Note, Flam und offener Hi-Hat mit Pedal anhören (Klänge unterscheidbar, Toms abfallend, Abstoppen hörbar, kein Knacken/Übersteuern); Schläge, Länge und Tempo während der Wiedergabe ändern; Wiedergabeposition läuft synchron; Verlassen des Editors stoppt; Export enthält `tempo` bei Schemaversion 3
- [x] 6.3 `openspec validate pattern-playback --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
