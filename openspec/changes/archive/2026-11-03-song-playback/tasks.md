# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests ändern nur, wie sie die Quelle des Schedulers bauen (Gruppe 1), ihre Erwartungen bleiben gleich.

## 1. Scheduler: allgemeine Quelle, Einmal-Modus, Position

- [x] 1.1 Tests erfassen (rot) in `src/audio/scheduler.test.ts`: Hilfsfunktion baut die Pattern-Quelle über die neue Schnittstelle (design.md D1), bestehende Tests sonst unverändert; neu: Einmal-Modus endet nach `length` (keine weiteren Schläge, Zustand `IDLE` sobald die Audiozeit das Ende erreicht, Stimmen nicht stummgeschaltet), `timeline()` liefert `null` → Wiedergabe endet, `getPosition()` folgt der Audiozeit (auch nach Tempowechsel und Schleifenumbruch) und ist nach Stopp `null`, `mark` meldet beliebige Marken. Prüfen: `npm test -- scheduler` rot
- [x] 1.2 `src/audio/scheduler.ts` und `src/audio/player.ts` nach D1 umbauen (`Timeline`, `PlaybackSource` mit `loop`, `mark`, `getPosition`), Pattern-Quelle in `usePlayback` (`src/ui/playback.tsx`) und `Sequencer`-Anbindung auf `mark` umstellen, Nachbau-Player in `src/ui/playback.test.tsx` um `getPosition` ergänzen. Prüfen: `npm test` grün (Pattern-Wiedergabe unverändert), `npx tsc --noEmit` fehlerfrei

## 2. Capability `song-playback`: Song-Zeitplan

- [x] 2.1 Tests aus den Szenarien erfassen (rot) in `src/domain/playback.test.ts` für `songTimeline` (D2): „Groove-Fortlauf“ (Snare bei Beat 4), „Fill überdeckt den Groove“ (Beat 7: Snare, keine Bassdrum), „Akzent im leeren Takt“, „Akzent zusätzlich zum Groove“ (beide gleichzeitig; Akzent auf gleichem Instrument entfällt), Spielweisen aus Groove und Fill bleiben erhalten, Bereich „ab hier“ (`at` relativ zum Bereichsanfang, `length` bis Songende, `'end'` dynamisch), Schleifenbereich Takte 2–3 (`length` 8), Takt-Marken je Takt, fehlender Anfangs- oder Endtakt → `null`, Zwischenspeicher liefert bei gleichem Song dasselbe Objekt. Prüfen: `npm test -- playback` rot
- [x] 2.2 `songTimeline` in `src/domain/playback.ts`, gemeinsame Hilfsfunktion für die Schläge eines Beats aus `patternHits` herausziehen. Prüfen: Tests aus 2.1 grün, bestehende `patternHits`-Tests unverändert grün

## 3. Capability `song-playback` und `songbook-view`: Starten und Beenden auf der Doppelseite

- [x] 3.1 Tests aus den Szenarien erfassen (rot), neue Datei `src/ui/songPlayback.test.tsx` mit Nachbau-Player: „Ganzen Song abspielen“ (Bereich erster Takt bis `'end'`, keine Schleife, Taste „Stopp“), „Ende des Songs“ (Player meldet Ende → „Song abspielen“, keine Hervorhebung), „Stoppen“, „Song ohne Takte“ (deaktiviert), „Ab einem Takt“, „Ab einem Segment“, „Takte in Schleife“, „Segment in Schleife“ (jeweils Bereich und `loop` der Quelle), „Auswahl ändern/aufheben während der Schleife“ (Quelle unverändert, kein neuer Start), „Anfangstakt gelöscht“ (Quelle liefert `null`), „Groove eines späteren Takts ändern“ und „Tempo während der Song-Wiedergabe“ (Quelle liefert neuen Stand ohne neuen Start), „Pattern öffnen während der Wiedergabe“ (Stopp, Editor zeigt „Abspielen“), Wechsel zur Song-Liste stoppt, „Browser ohne Web Audio auf der Doppelseite“ (Kopftaste und Popover-Aktionen deaktiviert, Hinweis); in `src/ui/structureEditor.test.tsx` „Abspielen im Segment-Popover“ und die Abspiel-Aktionen im Takt-Popover. Prüfen: `npm test -- songPlayback structureEditor` rot
- [x] 3.2 `useSongPlayback` (D3), Taste im Kopf (`src/ui/Songbook.tsx`), Aktionen in `SegmentPopover` und `BarPopover` (`src/ui/StructurePopovers.tsx`), Stopp beim Verlassen. Prüfen: Tests aus 3.1 grün, `npm test -- songbook structureEditor selectionHighlight` grün (Leseansicht unverändert)

## 4. Capability `song-playback`: Wiedergabeposition

- [x] 4.1 Tests aus den Szenarien erfassen (rot) in `src/ui/songPlayback.test.tsx`: „Position im Takt“ (Marke Takt 3 → nur dessen Rahmen hat `playing`; Linie bei `getPosition()` = Taktstart + 2 steht bei x = Takt.x + 2), „Mitscrollen“ (`scrollIntoView` mit `block: 'nearest'` beim Taktwechsel, gemockt), „Keine Anzeige nach Stopp“ (keine `playing`-Klasse, keine Linie). Prüfen: `npm test -- songPlayback` rot
- [x] 4.2 Klasse `playing` an `bar-frame` in `StructureRow`, `PlayheadLine` mit eigener Frame-Schleife und Ref, `scrollIntoView` beim Taktwechsel, Styles mit `--playhead` in `src/ui/styles.css` (D4). Prüfen: Tests aus 4.1 grün, `npm test -- styles` grün (Farbregel)

## 5. Integration

- [x] 5.1 Gesamtlauf: `npm test` und `npm run build` grün, `npx tsc --noEmit` fehlerfrei
- [x] 5.2 Im Browser (Release-Build) prüfen und Ergebnis in design.md festhalten: Song mit mehreren Segmenten, Groove-Fortlauf, Fill über zwei Takte und Akzenten durchhören; „Ab hier“ ab Segment und Takt; Schleife über Takte vor einem Fill; Auswahl während der Schleife ändern; Struktur und Tempo während der Wiedergabe ändern; Linie läuft flüssig und synchron, Seite scrollt mit; Pattern öffnen stoppt; Hell- und Dunkelmodus
- [x] 5.3 `openspec validate song-playback --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
