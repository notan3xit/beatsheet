# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Die Szenarien von `song-lock` kommen nach `src/ui/songLock.test.tsx`, sofern nicht anders genannt.

## 1. Sperrzustand im Store

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `src/state/notebookStore.test.ts`: `openSong` sperrt einen Song mit Inhalt, auch nach vorherigem Entsperren; entsperrt einen Song ohne Segmente und Patterns; sperrt einen Song nur mit Patterns; `openPattern`, `backToBook`, `applyRemote` und `importSongs` lassen den Zustand unverändert; `setLocked` ändert weder Revision noch `updatedAt`. Prüfen: `npm test -- notebookStore` rot
- [x] 1.2 `locked` und `setLocked` nach design.md D1 umsetzen. Prüfen: die Tests aus 1.1 grün
- [x] 1.3 Bestehende Tests nach D6 anpassen: `notebookWith`, dazu die Öffnungswege in `navigation.test.tsx`, `songList.test.tsx`, `playback.test.tsx` und `persistence.test.tsx`, soweit sie danach bearbeiten; Erwartungen bleiben unverändert. Prüfen: nach Abschluss von 2.2 und 4.2 läuft `npm test` mit denselben Erwartungen grün

## 2. Schloss und gesperrte Doppelseite

- [x] 2.1 Tests erfassen (rot): Anforderungen „Schloss“ (ohne Pattern-Editor-Teil), „Gesperrt beim Öffnen“ (Song-Liste, erneutes Öffnen, Neuladen über neuen Store), „Leerer Song öffnet entsperrt“, „Sperre nur lokal“ (Adresse und Verlauf über `connectUrl`), „Gesperrte Doppelseite“, „Fremde Änderungen im gesperrten Song“, „Wiedergabe beim Wechsel des Zustands“, „Keine Eingabefelder“ für die Doppelseite; „Knöpfe nur mit Freigabe“ mit einem Testknopf ohne Attribut (Maus, Enter, entsperrt) und „Alle aktiven Knöpfe freigegeben“ für die Doppelseite ohne Auswahl; Szenario „Gesperrter Song“ von `navigation` und „Gesperrter Song ohne Segmente“ von `songbook-view`. Prüfen: `npm test -- songLock` zeigt diese Tests rot
- [x] 2.2 `useLockGuard` nach D7 auf `main.songbook` und `main.workspace`; `LockToggle` nach D5 samt CSS mit Tokens; `SongHeader`, `EditableHeading`, `TempoMark`, `StructurePage` und `PatternPage` nach D3; `data-read-safe` an Schloss, Pfad, „Song abspielen“, Takten, Segmentnamen und Namen der Pattern-Karten. Prüfen: die Tests aus 2.1 und `src/ui/styles.test.ts` grün

## 3. Auswahl im gesperrten Song

- [x] 3.1 Tests erfassen (rot): Anforderung „Auswahl im gesperrten Song“ mit Takten, Shift-Bereich, Segment und Schleife über den Nachbau des Players; „Alle aktiven Knöpfe freigegeben“ bei geöffnetem Takt- und Segment-Popover. Prüfen: `npm test -- songLock` zeigt diese Tests rot
- [x] 3.2 Takt- und Segment-Popover nach D3 einschränken; `data-read-safe` an „Ab hier abspielen“ und „In Schleife abspielen“. Prüfen: die Tests aus 3.1, `structureEditor` und `songPlayback` grün

## 4. Gesperrter Pattern-Editor

- [x] 4.1 Tests erfassen (rot): Anforderung „Gesperrter Pattern-Editor“, Szenarien von „Schloss“ zum Pattern-Editor, „Adresse nennt ein Pattern“, „Tastenkürzel“, „Keine Eingabefelder“ und „Alle aktiven Knöpfe freigegeben“ für den Pattern-Editor. Prüfen: `npm test -- songLock` zeigt diese Tests rot
- [x] 4.2 `PatternEditor`, `Transport` und `Sequencer` nach D3 und D4 samt CSS für `.step:disabled`; `data-read-safe` an „Abspielen“. Prüfen: die Tests aus 4.1, `patternEditor`, `sequencer` und `src/ui/styles.test.ts` grün

## 5. Anordnung der Kopfzeile

- [x] 5.1 Tests erfassen (rot): Anforderung „Gleiche Anordnung beim Entsperren“ in `songLock.test.tsx`; „Kennzeichnung als Song-Tempo“ von `pattern-playback` in `playback.test.tsx` (geänderte Anforderung); „Gleiche Höhe der Kopfzeile“ über die gemeinsame Innenabstand-Regel in `styles.test.ts`. Prüfen: `npm test -- songLock playback styles` zeigt diese Tests rot
- [x] 5.2 Länge, Tempo, Unterteilung, Titel und CSS nach design.md D8 umsetzen, Hinweis „gilt für alle Patterns …“ entfernen. Prüfen: die Tests aus 5.1 grün
- [x] 5.3 Tests erfassen (rot): geänderte Szenarien von „Tempo im Pattern-Editor“ in `playback.test.tsx` und `songTempo.test.tsx`, „Tempo im Pattern-Editor“ und „Werte als Text“ in `songLock.test.tsx`. Prüfen: `npm test -- songLock playback songTempo` zeigt diese Tests rot
- [x] 5.4 `TempoMark` im Pattern-Editor nach D8, `TempoField` und `value-tempo` entfernen. Prüfen: die Tests aus 5.3 grün
- [x] 5.5 Tests erfassen (rot): „Platz beim Bearbeiten“ von `song-library` in `songTempo.test.tsx`. Prüfen: `npm test -- songTempo` zeigt den Test rot
- [x] 5.6 `TempoMark` und CSS nach D8 (`tempo-value`). Prüfen: `songTempo`, `playback`, `songLock` und `styles` grün

## 6. Abschluss

- [x] 6.1 Gesamtprüfung: `openspec validate song-read-lock --strict` fehlerfrei, `npm run build` und `npm test` grün
- [x] 6.2 Im Browser prüfen: gesperrte Sequencer-Zellen mit Schlägen, Flam und Ghost Note in Latte und Mocha gut lesbar, Schloss in beiden Zuständen erkennbar; Tempoangabe in beiden Ansichten einheitlich; beim Entsperren und beim Bearbeiten des Tempos springt nichts daneben; Pfad und Überschrift stehen in Doppelseite und Pattern-Editor auf derselben Höhe

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
