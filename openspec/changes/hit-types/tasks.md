# Tasks

## 1. pattern-sequencer: Modell und Domänenlogik

- [x] 1.1 Tests aus den Szenarien erfassen (rot): Spielweise eines Schlags, Betonung eines Schlags (ohne Anzeige), Betonung folgt ihrem Schlag. Prüfen: `npm test` schlägt genau bei den neuen und bei den fachlich geänderten Tests fehl
- [x] 1.2 `ARTICULATIONS`, `ARTICULATIONS_BY_INSTRUMENT` und `Beat.emphasis` ergänzen, `ARTICULATED` ersetzen (D1, D2). Prüfen: `npx tsc -b` meldet nur noch die in dieser Gruppe umzustellenden Stellen
- [x] 1.3 `cycleArticulation`, `toggleHit` und `changeSubdivision` umstellen, `toggleEmphasis` und den gemeinsamen Helfer ergänzen. Prüfen: Tests aus 1.1 grün
- [x] 1.4 `normalizeBeat` um das Verwerfen regelwidriger Spielweisen und Betonungen ergänzen. Prüfen: Normalisierungstests grün, ein gültiger Beat bleibt dieselbe Referenz

## 2. library-persistence und song-merge: Datei und Dokument

- [x] 2.1 Tests aus den Szenarien erfassen (rot): Neue Spielweisen und Betonung im Export, Spielweise auf einem unpassenden Instrument, Betonung ohne Schlag, Betonte Ghost Note, Datei der Schemaversion 3, Song aus der Vorversion laden, Verschiedene Betonungen im selben Beat, Verschiedene Spielweisen im selben Beat, Betonung und Ghost Note, Betonung ohne Schlag nach dem Zusammenführen. Die Szenarien zur neueren Version auf Schemaversion 5 anheben. Prüfen: `npm test` schlägt genau bei diesen Tests fehl
- [x] 2.2 `fileFormat` auf Schemaversion 4 heben, `emphasis` und die Prüfung gegen die Tabelle ergänzen (D4). Prüfen: Importtests aus 2.1 grün
- [x] 2.3 `beatToDoc` und `beatFromDoc` um die flachen Schlüssel ergänzen (D3). Prüfen: Merge-Tests aus 2.1 grün, beide Reihenfolgen des Zusammenführens gleich, `applySong` mit einem unveränderten Song aus einem Dokument der Vorversion erzeugt keine Änderung

## 3. pattern-playback: Zeitplan und Scheduler

- [x] 3.1 Tests aus den Szenarien erfassen (rot): Drag, Rim Shot, Cross-Stick, Ride-Glocke und Choke im Zeitplan, Betonter Schlag, Betonter Flam, Betonte Spielweise. Prüfen: `npm test` schlägt genau bei den neuen Tests fehl
- [x] 3.2 `PlaybackHit` um `technique` und `graces` erweitern, `EMPHASIS_GAIN` und `GRACE_GAIN` einführen, `beatHits` umstellen (D5). Prüfen: Tests in `src/domain/playback.test.ts` grün
- [x] 3.3 Scheduler auf `graces` und den vierten Parameter von `trigger` umstellen, `START_DELAY` und `LOOKAHEAD` anheben. Prüfen: `src/audio/scheduler.test.ts` grün; ein Drag auf dem ersten Schlag liegt mit beiden Vorschlägen nach dem Startzeitpunkt

## 4. playback-sound: Aufnahmen und Stimmen

- [x] 4.1 Tests aus den Szenarien erfassen (rot): Rim Shot, Cross-Stick, Ride-Glocke und Choke in `sampleVoices`, unterscheidbare Synth-Rezepte in `voices`, neue Schlüssel in `drsSamples`. Prüfen: `npm test` schlägt genau bei den neuen Tests fehl
- [x] 4.2 `scripts/drs-samples.mjs` um die drei Aufnahmen erweitern und ausführen (D6), `samples/drs/README.md` ergänzen. Prüfen: `git status` zeigt nur neue Dateien unter `samples/drs`, die bestehenden bleiben bitgleich; `volumedetect` trifft die Prüfwerte aus D6
- [x] 4.3 `SAMPLE_KEYS`, `createSampleVoices` (Wahl über `technique`, Choke, Kompressor) und `createSwitchingVoices` umstellen. Prüfen: Tests aus 4.1 für Aufnahmen und `drsSamples` grün
- [x] 4.4 Synth-Rezepte und Choke in `voices.ts` ergänzen. Prüfen: Tests aus 4.1 für den Synth grün

## 5. drum-notation: Notenbild

- [x] 5.1 Tests aus den Szenarien erfassen (rot): Drag, Rim Shot, Cross-Stick, Ride-Glocke, Choke, Betonung in den Noten, Notenköpfe. Prüfen: `npm test` schlägt genau bei den neuen Tests fehl
- [x] 5.2 `NoteKey.emphasis` im Modell ergänzen, Notenköpfe und Drag im Renderer umsetzen (D7). Prüfen: Tests zu Notenköpfen und Drag grün
- [x] 5.3 Durchgang für Betonung und Choke im Renderer umsetzen (D7). Prüfen: Tests aus 5.1 grün, auch für Spalten mit beiden Stimmen und für Zeilen mit Balken und Viertelnoten

## 6. pattern-sequencer: Oberfläche

- [x] 6.1 Tests aus den Szenarien erfassen (rot): Betonung umschalten mit Strg, Mit Cmd auf dem Mac, Leere Zelle, Anzeige in der Zelle, Shift-Klick auf Ride und Crash im gerenderten Sequencer. Prüfen: `npm test` schlägt genau bei den neuen Tests fehl
- [x] 6.2 `Sequencer.tsx` um die Tastenprüfung und `data-emphasis` ergänzen, Zeichen für die neuen Spielweisen in `styles.css` nur mit Tokens (D8). Prüfen: Tests aus 6.1 und `src/ui/styles.test.ts` grün

## 7. songbook-view: Kurzschrift

- [x] 7.1 Tests aus den Szenarien erfassen: Neue Spielweisen der Snare, Choke und Betonung. Prüfen: Tests grün ohne Änderung an `shorthand.ts` (D9); schlägt einer fehl, zuerst die Artefakte anpassen

## 8. Gesamtprüfung

- [x] 8.1 `npm test` und `npm run build` laufen vollständig durch. Prüfen: beide ohne Fehler, Typprüfung einschließlich Server
- [x] 8.2 Im Browser in Hell und Dunkel prüfen: alle Spielweisen und Betonungen in Editor, Patternkarte und Mini-Darstellung, keine Kollision von `>` mit Balken, `o` und Triolenklammer, durchgestrichener Notenkopf auch klein lesbar. Prüfen: Screenshots aus `~/tools/playwright` angesehen, Befunde in den Artefakten nachgezogen
- [x] 8.3 Mit gespeicherten Songs der Vorversion und in einem synchronisierten Workbook prüfen: Songs unverändert, Abgleich ohne neue Revision. Prüfen: Revisionen vor und nach dem Laden gleich

## Workflow follow-up

- Hörprobe unter `~/pub/schlag-demo` nach Bestätigung des Nutzers löschen.
- Change nach der Abnahme archivieren und die Specs übernehmen.
