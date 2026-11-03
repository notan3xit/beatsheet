# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests ändern sich nur dort, wo die geänderte Anforderung es verlangt (Beschriftung „Song-Tempo (BPM)“).

## 1. Capability `song-library`: Tempo auf der Doppelseite

- [x] 1.1 Tests aus den Szenarien erfassen (rot), neue Datei `src/ui/songTempo.test.tsx`: „Tempoangabe“ (Knopf „Song-Tempo: 120 BPM“ mit Text „♩ = 120“ im Kopf neben dem Titel), „Tempo auf der Doppelseite ändern“ (Klick, 96, Enter → „♩ = 96“, Song-Tempo 96, Pattern-Editor zeigt 96), „Eingabe verwerfen“ (Escape → unverändert, gleiche Song-Referenz), „Ungültiges Tempo auf der Doppelseite“ (0, Verlassen → „♩ = 120“, gleiche Song-Referenz). Prüfen: `npm test -- songTempo` rot
- [x] 1.2 Hook `useSongTempo` in `src/ui/playback.tsx` (design.md D1), `src/ui/TempoMark.tsx` (D2), Einbindung in `SongHeader`, Styles `.tempo-mark` in `src/ui/styles.css` nur mit semantischen Tokens. Prüfen: Tests aus 1.1 grün, `npm test -- songbook styles` grün (Leseansicht und Farbregel unverändert)

## 2. Capability `pattern-playback`: Kennzeichnung als Song-Tempo

- [x] 2.1 Tests anpassen bzw. erfassen (rot) in `src/ui/playback.test.tsx`: Feld per Beschriftung „Song-Tempo (BPM)“ statt „Tempo (BPM)“; neu „Kennzeichnung als Song-Tempo“ (Feld hat die Beschreibung „gilt für alle Patterns von „Test““ über `toHaveAccessibleDescription`). Prüfen: `npm test -- playback` rot
- [x] 2.2 `TempoField`/`Transport` nach D3 (Beschriftung, Hinweis mit `useId` und `aria-describedby`, `useSongTempo` statt eigener Übernahme). Prüfen: `npm test -- playback` grün

## 3. Integration

- [x] 3.1 Gesamtlauf: `npm test` und `npm run build` grün, `npx tsc --noEmit` fehlerfrei
- [x] 3.2 Im Browser (Release-Build) prüfen und Ergebnis in design.md festhalten: „♩ = 120“ im Kopf der Doppelseite neben dem Titel, Bearbeiten per Klick/Enter/Escape, Pattern-Editor zeigt Beschriftung und Hinweis ohne verbreiterte Kopfzeile, Änderung an einer Stelle erscheint an der anderen; Hell- und Dunkelmodus
- [x] 3.3 `openspec validate song-tempo-display --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
