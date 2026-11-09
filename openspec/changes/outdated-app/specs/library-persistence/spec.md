## ADDED Requirements

### Requirement: Felder neuerer Versionen im Song-Dokument
Schreibt die App einen Song in sein gespeichertes Dokument, MUST sie Felder, die ihre Version nicht kennt, auf jeder Ebene unverändert lassen (Song, Pattern, Segment, Block, Takt, Beat). Felder, die sie kennt, MUST sie weiterhin entfernen können, etwa die eigene Taktart eines Patterns, das wieder dem Song folgt.

#### Scenario: Feld einer neueren Version bleibt erhalten
- **GIVEN** das Dokument von „Intro“ enthält am Song ein Feld `key` und am ersten Pattern ein Feld `swing`, die die App nicht kennt
- **WHEN** der Nutzer in „Intro“ einen Takt hinzufügt
- **THEN** enthält das Dokument danach weiterhin `key` und `swing` mit ihren Werten
- **AND** die Änderung umfasst nur den neuen Takt

#### Scenario: Empfangener Song mit unbekanntem Feld
- **GIVEN** ein anderes Gerät hat dem Dokument von „Intro“ ein Feld `key` hinzugefügt, das diese App nicht kennt
- **WHEN** die App diese Änderung empfängt und „Intro“ speichert
- **THEN** entsteht keine neue Änderung, und `key` bleibt erhalten

#### Scenario: Bekanntes Feld entfernen
- **GIVEN** ein Pattern hat eine eigene Taktart
- **WHEN** der Nutzer es wieder dem Song folgen lässt
- **THEN** enthält das Dokument für dieses Pattern keine eigene Taktart mehr
