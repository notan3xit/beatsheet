# Tasks

## 1. Moduswechsel im Scheduler (playback-controls)

- [x] 1.1 Tests (rot), `src/audio/scheduler.test.ts` und `player.test.ts`: `setLoop(false)` während der Schleife endet am Ende des laufenden Durchlaufs ohne Unterbrechung; `setLoop(true)` im Einmal-Modus läuft nach dem Ende weiter, auch nach dem Planen des letzten Schlags; `PlaybackState.loop` folgt Start und `setLoop`. Prüfen: `npm test -- scheduler player` rot
- [x] 1.2 `setLoop` und `PlaybackState.loop` in Scheduler und Player (design.md D1). Prüfen: `npm test -- scheduler player` grün

## 2. Regeln und Speicher des Übetempos (practice-tempo)

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `src/domain/practice.test.ts`: „Vorgabe“ (130 → 100, 120 → 90, untere Grenze), „Erhöhen“, „Über das Song-Tempo hinaus“, „An der Obergrenze“, untere Grenze beim Verringern, gespeicherter Wert vor Vorgabe. Prüfen: `npm test -- domain/practice` rot
- [x] 2.2 `src/domain/practice.ts` (design.md D3). Prüfen: `npm test -- domain/practice` grün
- [x] 2.3 Tests (rot), `src/state/practice.test.ts`: Wert pro Song gespeichert und nach neuem Store wieder gelesen („Neu laden“, „Anderer Song“); Schalter pro Song, nach neuem Store aus; unlesbarer oder nicht nutzbarer Speicher gilt nur für die Sitzung. Prüfen: `npm test -- state/practice` rot
- [x] 2.4 `src/state/practice.ts`, `PracticeContext` in `App` (design.md D4). Prüfen: `npm test -- state/practice` grün

## 3. Abspiel-Knöpfe in beiden Köpfen (pattern-playback, song-playback, playback-controls)

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `src/ui/playback.test.tsx`, `songPlayback.test.tsx`, `playControls.test.tsx`: „Einmal starten“, „Ende eines einmaligen Durchlaufs“, „Ganzen Song in Schleife“, „Ende des Songs“, „Stoppen einer Overlay-Wiedergabe“, „Song ohne Takte“, „Browser ohne Web Audio“ (beide Ansichten), Symbole im Kopf, „Während der Wiedergabe“, „Nicht laufender Modus“ (grau), „Von Schleife zu einmal“, „Von einmal zu Schleife“, „Bereich aus dem Overlay“, „Anordnung im Kopf“ für beide Ansichten, „Kennzeichnung als Song-Tempo“, „Aus dem Takt-Overlay“, „Aus dem Segment-Overlay“, „Popover wieder öffnen“, „Im gesperrten Song“ (Auswahl bleibt), „Laufende Schleife in der Struktur“ mit allen Szenarien. Bestehende Tests mit geänderten Namen der Knöpfe nach den Delta-Specs nachziehen. Prüfen: `npm test -- playback songPlayback playControls` rot
- [x] 3.2 `PlayButton` mit `idle`, gemeinsamer `Transport`, Doppelseite und Pattern-Editor umstellen, `TempoMark` im Pattern-Editor vor den Transport, Popover-Zustand in `useStructureSelection` (design.md D5); grauer Knopf und graue Markierung der Teil-Schleife in `styles.css`, Rahmen der Markierung in `designSystem.test.ts` (design.md D6). Prüfen: `npm test -- playback songPlayback playControls` grün

## 4. Übetempo-Steuerung (practice-tempo)

- [x] 4.1 Tests aus den Szenarien erfassen (rot), `src/ui/practiceTempo.test.tsx` (neu): „Doppelseite“, „Gleicher Stand im Pattern-Editor“, „Pattern im Übetempo“, „Aus dem Takt-Overlay“, „Ausschalten während der Wiedergabe“, „Wert eingeben“, Escape verwirft, „Über dem Song-Tempo“, „Ungültiger Wert“, „Erhöhen“, „Song-Tempo gesenkt“, „Kein Teil des Songs“, „Anderer Song“ und „Zurück zum Song“ (Schalter), „Gesperrter Song“. Tempo der Wiedergabe über die Planung des Players prüfen. Prüfen: `npm test -- practiceTempo` rot
- [x] 4.2 Eingabelogik aus `TempoMark` herauslösen, `PracticeControl`, Tempo der Wiedergabe in `usePlayback` und `useSongPlayback` (design.md D2, D5). Prüfen: `npm test -- practiceTempo songTempo` grün
- [x] 4.3 Stile der Steuerung, Token für den Anteil von `--playhead`, −/+ unter `40rem` ausgeblendet; neue Paare aus Schrift und Fläche in `designSystem.test.ts`, Ausblenden in `styles.test.ts` („Smartphone“) (design.md D6). Prüfen: `npm test -- designSystem styles` grün

## 5. Kopfknöpfe mit Auswahl (song-playback, songbook-view)

- [x] 5.1 Tests aus den Szenarien erfassen (rot), `src/ui/songPlayback.test.tsx` und `structureEditor.test.tsx` bzw. `playControls.test.tsx`: „Ab Auswahl“, „Auswahl in Schleife“, „Segment ausgewählt“, „Üben vor dem Start“, „Ohne Auswahl“, „Bedienung im Kopf“ (Auswahl bleibt bei Klick auf „Üben“ und −/+), Klick auf eine freie Stelle hebt sie weiter auf. Prüfen: `npm test -- songPlayback playControls` rot
- [x] 5.2 `SongTransport` mit Auswahl, `data-keeps-selection` in `useDismiss` der Struktur (design.md D5). Prüfen: `npm test` grün

## 6. Integration

- [x] 6.1 Im Browser prüfen (Skript unter `~/tools/playwright`, Screenshots hell und dunkel, breit und schmal): beide Köpfe in Ruhe, während der Schleife mit grauem Knopf, Auswahl nach Start aus dem Overlay, graue Markierung nach anderer Auswahl, „Üben“ an und aus, gesperrter Song, Auswahl, dann „Üben“, dann Kopfknopf spielt die Auswahl. Prüfen: Screenshots entsprechen dem Mock-up
- [x] 6.2 `openspec validate practice-playback --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei
