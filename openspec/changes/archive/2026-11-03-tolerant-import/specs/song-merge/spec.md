## MODIFIED Requirements

### Requirement: Revision nach dem Zusammenführen
Die Revision eines zusammengeführten Songs und seiner Patterns MUST höher sein als die jeder beteiligten Fassung, sofern beide Fassungen geändert wurden. Bei einem späteren Datei-Import einer der Ausgangsfassungen MUST für diesen Song daher „Überspringen“ vorbelegt sein.

#### Scenario: Unterschiedlich viele Änderungen
- **GIVEN** ein Song mit Revision 7
- **WHEN** die eine Fassung fünfmal und die andere einmal geändert wird und beide zusammengeführt werden
- **THEN** hat der zusammengeführte Song eine Revision über 12

#### Scenario: Import der Ausgangsfassung
- **WHEN** eine vor dem Zusammenführen exportierte Fassung des Songs importiert wird und der Nutzer die Vorbelegung bestätigt
- **THEN** bleibt der zusammengeführte Song unverändert
