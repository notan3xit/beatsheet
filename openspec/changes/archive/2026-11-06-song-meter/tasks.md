# Tasks

## 1. song-meter: Modell und Speicherung

- [x] 1.1 Tests aus den Szenarien erfassen (rot): Standard-Takt des Songs, Wirksame Taktart eines Patterns, Taktart ändert nur die Darstellung, Taktart in Kopien und Dateien, dazu `sameSong` und `applySong` für Songs ohne Feld und mit 4/4 (D2) und das Verwerfen regelwidriger Werte (D8). Prüfen: `npm test` schlägt genau bei den neuen Tests fehl
- [x] 1.2 `METERS`, `DEFAULT_METER`, `Song.meter?`, `Pattern.meter?` und die Funktionen `songMeter`, `patternMeter`, `meterLabel`, `setSongMeter`, `setPatternMeter` in `src/domain` ergänzen. Prüfen: Domain-Tests aus 1.1 grün
- [x] 1.3 `normalizeSong` um das Verwerfen regelwidriger Werte ergänzen. Prüfen: Normalisierungstests grün, ein gültiger Song bleibt dieselbe Referenz
- [x] 1.4 `toDocShape`, `fromDocShape` und `fileFormat` um die optionalen Felder ergänzen, ohne neue Schemaversion. Prüfen: Persistenztests aus 1.1 grün, einschließlich Import ungültiger Werte und alter Song ohne neue Revision

## 2. drum-notation: Taktstriche und Pausen

- [x] 2.1 Tests aus den Szenarien erfassen (rot): Ein Takt mit 6 Beats, Taktart kürzer und länger als das Pattern, Viertelpausen in anderen Taktarten, Unvollständiger Takt mit 4 Beats, Neuer Groove in 3/4. Prüfen: `npm test` schlägt genau bei den neuen Tests fehl
- [x] 2.2 `toNotation(pattern, meter = DEFAULT_METER)` umsetzen und `BEATS_PER_MEASURE` entfernen (D3). Prüfen: alle Tests in `src/notation` grün, bestehende Tests unverändert
- [x] 2.3 Prop `meter` an `NotationView` ergänzen und aus `PatternEditor` und `PatternCard` übergeben. Test zu Szenario „Taktart des Songs ändern“: Das gerenderte Notenbild zeigt nach der Änderung einen Takt mehr

## 3. pattern-library und song-structure: Vorgaben beim Anlegen

- [x] 3.1 Tests aus den Szenarien erfassen (rot): Groove im Standard-Takt anlegen, Fill mit Standardwerten in 7/4, Erstes Segment im Standard-Takt, Nachbartakt vor Standard-Takt, Block an Segment ohne Blöcke im Standard-Takt, Neuer Groove als Platzhalter im Standard-Takt. Prüfen: `npm test` schlägt genau bei den neuen Tests fehl, Nachbartakt vor Standard-Takt ist schon grün
- [x] 3.2 `addPattern`, `addPlaceholder`, `insertSegmentAfter`, `appendSegment` und `appendBlockLike` auf `songMeter(song)` umstellen (D4). Prüfen: Tests aus 3.1 und bestehende Struktur-Tests grün

## 4. song-meter und song-lock: Standard-Takt auf der Doppelseite

- [x] 4.1 Tests aus den Szenarien erfassen (rot): Angabe im Kopf, Auswahl, Kopf der Doppelseite gesperrt, Standard-Takt gesperrt und entsperrt. Prüfen: `npm test` schlägt genau bei den neuen Tests fehl
- [x] 4.2 `MeterMark` umsetzen und in den Kopf der Doppelseite hinter `TempoMark` setzen, Styles nur mit Tokens (D5). Prüfen: Tests aus 4.1 und `src/ui/styles.test.ts` grün

## 5. song-meter und song-lock: Eigene Taktart im Pattern-Editor

- [x] 5.1 Tests aus den Szenarien erfassen (rot): Pattern folgt dem Song, Eigene Taktart einschalten, Eigenen Wert wählen, Eigene Taktart ausschalten, Rückgängig, Werte als Text, Eigene Taktart gekennzeichnet, gleiche Anordnung für folgendes Pattern und eigene Taktart. Prüfen: `npm test` schlägt genau bei den neuen Tests fehl
- [x] 5.2 `PatternMeter` mit Symbol in `icons.tsx` umsetzen und in die Kopfzeile des `PatternEditor` setzen, mit festen Plätzen für Umschalter und Wert (D6). Prüfen: Tests aus 5.1 und `src/ui/styles.test.ts` grün

## 6. songbook-view: Patternkarten und neue Patterns

- [x] 6.1 Tests aus den Szenarien erfassen (rot): Abweichende Taktart, Eigene Taktart gleich dem Standard-Takt, Kopfzeile ohne Taktart, Neuen Groove im Standard-Takt ziehen. Prüfen: `npm test` schlägt genau bei den neuen Tests fehl, soweit das Verhalten nicht schon durch Gruppe 3 besteht
- [x] 6.2 `.pattern-meta` in `PatternCard` um die abweichende Taktart ergänzen (D7). Prüfen: Tests aus 6.1 grün

## 7. Integration

- [x] 7.1 Im Browser prüfen und mit Screenshots belegen: Kopfzeilen von Doppelseite und Pattern-Editor verschieben sich weder beim Sperren noch beim Umschalten der eigenen Taktart (Szenario „Umschalten verschiebt nichts“), ein 6-Beat-Groove zeigt in 6/4 keinen Taktstrich, eine Karte mit abweichender Taktart bleibt einzeilig
- [x] 7.2 `npm run build` und `npm test` vollständig grün, `openspec validate song-meter --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
