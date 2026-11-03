# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests bleiben unverändert; Store, UI und Dateiformat ändern sich nicht.

## 1. Setup

- [x] 1.1 Größe von `dist` nach `npm run build` notieren (Ausgangswert für design.md); `@automerge/automerge` installieren; `initAutomerge()` nach design.md D1 in `src/persistence/songDoc.ts`, Aufruf in `src/test/setup.ts`. Prüfen: ein Wegwerf-Test mit `A.from`/`A.save`/`A.load` läuft unter `npm test` grün, `npm run build` gelingt; Wegwerf-Test danach entfernen

## 2. Capability `song-merge`

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `src/domain/normalize.test.ts`: je Regel aus design.md D6 ein Fall, gültiger Song ergibt dieselbe Referenz. Prüfen: `npm test -- normalize` rot
- [x] 2.2 Tests aus den Szenarien erfassen (rot), `src/persistence/songDoc.test.ts`: alle Szenarien der Spec `song-merge` mit zwei per `A.clone` abgeleiteten Fassungen, geändert über `applySong` mit echten Domain-Funktionen und zusammengeführt mit `mergeSongDocs`; „Reihenfolge des Zusammenführens“ und die Hi-Hat-Regel in beiden Richtungen; für jedes Ergebnis Export/Import über `serializeNotebook`/`parseNotebookFile`. Zusätzlich: `fromDocShape(toDocShape(song))` ergibt den Song unverändert, `applySong` mit unverändertem Song erzeugt keine Änderung (gleiche Heads). Prüfen: `npm test -- songDoc` rot
- [x] 2.3 `normalizeSong` nach design.md D6. Prüfen: `npm test -- normalize` grün
- [x] 2.4 `SongDoc`, `toDocShape`/`fromDocShape`, `applySong`, `mergeSongDocs` nach design.md D3–D5, D7. Prüfen: `npm test -- songDoc` grün

## 3. Capability `library-persistence`: Übernahme in das Dokumentformat

- [x] 3.1 Tests aus den Szenarien erfassen (rot) in `src/persistence/repository.test.ts`: Datenbank in Version 2 mit zwei Songs (einer mit Revision 6 und Flams, einer ohne Tempo) anlegen und öffnen; „Vorhandene Songs“, „Zweiter Start“, „Änderung nach der Übernahme“, „Patterns aus der Version vor den Songs“ (Version 1 → 3); außerdem: nach dem Öffnen gibt es nur noch den Store `documents`. Prüfen: `npm test -- repository` rot
- [x] 3.2 `openRepository` nach design.md D2 und D8 (Version 3, Store `documents`, Dokument-Cache, `write` über `applySong`, `loadAll` mit `normalizeSong`); `initAutomerge()` in `src/main.tsx` vor `openRepository()`. Prüfen: `npm test -- repository persistence` grün, Erwartungen der bisherigen Tests unverändert; nur die Vorbereitung von „Start nach dem Update“ (hier und in `src/ui/playback.test.tsx`) legt die Datenbank in Version 2 direkt an (`src/test/legacyDb.ts`), statt sie über `openRepository` zu erzeugen (das öffnet jetzt Version 3)
- [x] 3.3 `AGENTS.md`, Abschnitt Aufbau: `persistence` nennt die Automerge-Dokumente pro Song, `domain` die Normalisierung. Prüfen: Text kurz und ohne Historie (Schreibstil)

## 4. Integration

- [x] 4.1 Gesamtlauf: `npm test` und `npm run build` grün, `npx tsc --noEmit` fehlerfrei; Größe von `dist` vor/nach in design.md festhalten
- [x] 4.2 Im Browser (Release-Build) mit vorhandenen Daten der Vorversion prüfen und Ergebnis in design.md festhalten: vorher exportieren, nach dem Update sind alle Songs unverändert da, Bearbeiten und Neuladen funktionieren, Export nach dem Update entspricht inhaltlich dem Export davor
- [x] 4.3 `openspec validate automerge-songs --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
