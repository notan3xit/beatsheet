# Tasks

## 1. Taktanfänge im Zeitplan (practice-click)

- [x] 1.1 Tests (rot), `src/domain/playback.test.ts`: `downbeats` der Song-Timeline auf den Taktanfängen des Bereichs, auch bei wechselnden Taktlängen und ab einem mittleren Takt; `patternTimeline(pattern, meter)` mit `0, meter …` unterhalb der Länge (6 Beats in 4/4: 0 und 4; 2 Beats in 4/4: 0). Prüfen: `npm test -- domain/playback` rot
- [x] 1.2 `downbeats` in `Timeline`, `songTimeline`, `patternTimeline` mit Taktart, Aufrufer anpassen (design.md D1). Prüfen: `npm test -- domain/playback` grün

## 2. Klicks und Einzählen im Scheduler (practice-click)

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `src/audio/scheduler.test.ts` mit einem Klick-Fake: „Takt in 4/4“, „Wechselnde Taktlängen“, „Pattern länger als ein Takt“, „Metronom aus“, beide Szenarien zum Schalten während der Wiedergabe, „Song in 4/4“ (Zeiten der Klicks und des ersten Schlags), „Einzählen ohne Metronom“, „Schleife“ (kein zweites Einzählen), Marke `null` und `playing` während des Einzählens, Stopp während des Einzählens verstummt die Klicks, Tempo-Wechsel während des Einzählens. Prüfen: `npm test -- scheduler` rot
- [x] 2.2 `metronome()` und `countIn` in `PlaybackSource`, Interface `Click`, Planung nach design.md D2/D3. Prüfen: `npm test -- scheduler` grün
- [x] 2.3 Tests (rot), `src/audio/click.test.ts` und `player.test.ts`: betonter Klick höher und lauter, `silence` trennt geplante Klicks; der Player nutzt den Klick unabhängig vom gewählten Klang („Klangwahl“). Prüfen: `npm test -- click player` rot
- [x] 2.4 `src/audio/click.ts`, Einbindung in `player.ts` (design.md D4). Prüfen: `npm test -- click player` grün

## 3. Schalter im Store (practice-click)

- [x] 3.1 Tests (rot), `src/state/practice.test.ts`: Metronom und Einzählen je Song, unabhängig voneinander und vom Schalter des Übetempos, nach neuem Store aus, Benachrichtigung bei Änderung. Prüfen: `npm test -- state/practice` rot
- [x] 3.2 `metronome`/`setMetronome`, `countIn`/`setCountIn` (design.md D5). Prüfen: `npm test -- state/practice` grün

## 4. Knöpfe und Wiedergabe (practice-click, practice-tempo)

- [x] 4.1 Tests aus den Szenarien erfassen (rot), `src/ui/practiceClick.test.tsx` (neu): „Doppelseite“, „Gleicher Stand im Pattern-Editor“, „Metronom ohne Tempo“, „Tempo ausschalten“, „Anderer Song“, „Zurück zum Song“, „Kein Teil des Songs“, „Gesperrter Song“, „Ab einem Takt in 3/4“ und „Kurzer Fill“ (Länge des Einzählens über die Quelle des Players), „Im Übetempo“, „Im Song-Tempo“, „Während des Einzählens“, „Stopp beim Einzählen“, „Einschalten während der Wiedergabe“ (Einzählen erst beim nächsten Start); in `practiceTempo.test.tsx` „Hervorhebung nur für Tempo“. Prüfen: `npm test -- practiceClick practiceTempo` rot
- [x] 4.2 Quellen in `usePlayback` und `useSongPlayback` mit `metronome` und `countIn` (design.md D2), `MetronomeIcon` und `CountInIcon` nach dem Mock-up, Knöpfe in `PracticeControl` (design.md D6). Prüfen: `npm test -- practiceClick practiceTempo` grün
- [x] 4.3 Stile: Hervorhebung auf den Teil des Übetempos, gedrückte Knöpfe, Sichtbarkeit unter `40rem`; „Smartphone“ in `styles.test.ts`. Prüfen: `npm test -- designSystem styles` grün

## 5. Integration

- [x] 5.1 Im Browser prüfen (Skript unter `~/tools/playwright`, Screenshots hell und dunkel, breit und schmal): Kopf von Doppelseite und Pattern-Editor mit den Knöpfen in allen Zuständen, „Tempo“ an mit Metronom aus, Symbole wie im Mock-up, Kopf auf schmaler Breite ohne Überlauf, Stopp-Knopf während des Einzählens. Prüfen: Screenshots entsprechen dem Mock-up
- [x] 5.2 `openspec validate count-in-metronome --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei

## 6. Schalter „Tempo“ und Lautstärke des Klicks (practice-tempo, practice-click, song-playback, songbook-view, playback-controls)

- [x] 6.1 Tests nach den geänderten Szenarien nachziehen (rot): Schalter „Tempo“ statt „Üben“ in `practiceTempo.test.tsx`, `practiceClick.test.tsx`, `songPlayback.test.tsx`, `playControls.test.tsx`, Stylesheet-Test der Hervorhebung. Prüfen: `npm test -- practiceTempo practiceClick songPlayback playControls styles` rot
- [x] 6.2 Schalter in `PracticeControl` umbenennen, Klick nach design.md D4 (Pegel, Abklingen). Prüfen: `npm test` grün
- [x] 6.3 Im Browser: Energie der Klicks gegen Snare, Kick und Hi-Hat des DRSKit messen (`OfflineAudioContext`, Skript unter `~/tools/playwright`), Kopf mit „Tempo“ hell und dunkel, breit und schmal ohne Überlauf. Prüfen: unbetonter Klick mindestens so energiereich wie die Snare, Kopf einzeilig
- [x] 6.4 `openspec validate count-in-metronome --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei

## 7. Metronom beginnt am Taktanfang (practice-click)

- [x] 7.1 Tests nach den geänderten Szenarien (rot), `src/audio/scheduler.test.ts`: „Einschalten während der Wiedergabe“ (erster Klick betont am nächsten Taktanfang), „Einschalten in der Schleife“ (erster Klick zu Beginn des nächsten Durchlaufs); Ausschalten unverändert ab dem nächsten Beat. Prüfen: `npm test -- scheduler` rot
- [x] 7.2 Merker im Scheduler nach design.md D3. Prüfen: `npm test -- scheduler` grün
- [x] 7.3 `openspec validate count-in-metronome --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei
