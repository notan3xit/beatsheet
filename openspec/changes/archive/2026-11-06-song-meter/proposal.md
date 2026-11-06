# Proposal

## Why

Der Taktstrich steht fest nach 4 Beats, und neue Grooves und Takte haben fest 4 Beats. Ein Song in 3/4 oder 5/4 muss deshalb jedes Pattern von Hand anpassen und zeigt trotzdem falsche Taktstriche, etwa 4+2 bei einem 6-Beat-Groove.

## What Changes

- Jeder Song hat einen Standard-Takt: 3/4, 4/4, 5/4, 6/4 oder 7/4, ohne Angabe 4/4. Er steht auf der Doppelseite neben dem Song-Tempo.
- Ein Pattern folgt dem Song, solange es keine eigene Taktart hat. Die eigene Taktart wird im Pattern-Editor über einen Umschalter gesetzt und entfernt.
- Die wirksame Taktart bestimmt die Taktstriche im Notenbild. Länge und Schläge eines Patterns bleiben dabei unverändert.
- Neue Grooves sind einen Takt der Song-Taktart lang, neue Fills bleiben bei 1 Beat. Neue Takte ohne Vorlage übernehmen die Song-Taktart, Takte mit Nachbartakt weiter dessen Länge.
- Patternkarten nennen die Taktart nur, wenn sie von der des Songs abweicht.
- Beide Einstellungen zeigen gesperrt und entsperrt denselben Text am selben Platz.

Nicht Teil dieses Changes:
- Nenner außer 4 (etwa 6/8) und Gruppierung über Beat-Grenzen hinweg
- eigene Voreinstellung für die Unterteilung; neue Beats starten weiter in 16tel
- Änderungen an Wiedergabe und Tempo: Ein Beat bleibt eine Viertel, die BPM zählen Viertel

## Capabilities

### New Capabilities

- `song-meter`: Standard-Takt des Songs, eigene Taktart eines Patterns, ihre Bedienung und Speicherung

### Modified Capabilities

- `drum-notation`: Taktstriche und Pausen richten sich nach der Taktart statt nach festen 4 Beats
- `pattern-library`: Standardlänge eines neuen Grooves folgt der Song-Taktart
- `song-structure`: neue Takte ohne Vorlage und neue Grooves folgen der Song-Taktart
- `songbook-view`: gezogene neue Grooves folgen der Song-Taktart; Patternkarten nennen eine abweichende Taktart
- `song-lock`: Standard-Takt auf der gesperrten Doppelseite, Taktart im gesperrten Pattern-Editor, gleiche Anordnung beim Entsperren

## Impact

- `src/domain`: neue Felder an `Song` und `Pattern`, reine Funktionen für Taktart und Standardlängen
- `src/notation/model.ts`: `toNotation` bekommt die Taktart statt `BEATS_PER_MEASURE`
- `src/persistence`: Dokumentform und Dateiformat mit optionalen Feldern, ohne neue Schemaversion
- `src/state`, `src/ui`: Song-Einstellung im Kopf der Doppelseite, Umschalter im Pattern-Editor, Angabe auf der Patternkarte
- Server: nutzt die geänderten Module mit, sonst keine Änderung
