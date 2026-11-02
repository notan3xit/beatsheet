# Spec Delta

## MODIFIED Requirements

### Requirement: Schläge setzen und entfernen
Der Nutzer MUST durch Aktivieren einer Rasterzelle einen Schlag für das Instrument an dieser Position setzen und durch erneutes Aktivieren wieder entfernen können. An einer Position MUST mehrere Instrumente gleichzeitig gesetzt sein können. Wird ein Schlag entfernt, MUST auch seine Spielweise entfallen; ein danach neu gesetzter Schlag MUST normal gespielt sein.

#### Scenario: Schlag setzen
- **WHEN** der Nutzer in Beat 1 die Zelle der Bassdrum an Position 1 aktiviert
- **THEN** enthält das Pattern einen Bassdrum-Schlag auf der „1“

#### Scenario: Schlag entfernen
- **WHEN** der Nutzer eine bereits gesetzte Zelle erneut aktiviert
- **THEN** ist der Schlag an dieser Position entfernt

#### Scenario: Gleichzeitige Schläge
- **WHEN** der Nutzer an derselben Position Hi-Hat und Snare setzt
- **THEN** enthält das Pattern beide Schläge an dieser Position

#### Scenario: Flam entfernen und neu setzen
- **WHEN** die Snare auf der „1“ einen Flam hat und der Nutzer die Zelle zweimal ohne Shift aktiviert
- **THEN** hat das Pattern auf der „1“ einen normalen Snare-Schlag ohne Flam

### Requirement: Schläge beim Wechsel der Unterteilung
Beim Wechsel der Unterteilung eines Beats MUST jeder Schlag erhalten bleiben, dessen zeitliche Lage innerhalb des Beats auch im neuen Raster existiert, zusammen mit seiner Spielweise. Gehen dabei Schläge verloren, MUST der Nutzer vorher bestätigen.

#### Scenario: Sechzehntel nach Achtel ohne Verlust
- **WHEN** ein Beat in Sechzehnteln Schläge auf den Positionen 1 und 3 hat und der Nutzer auf Achtel umstellt
- **THEN** liegen die Schläge ohne Nachfrage auf den Achtel-Positionen 1 und 2

#### Scenario: Achtel nach Sechzehntel
- **WHEN** ein Beat in Achteln Schläge auf den Positionen 1 und 2 hat und der Nutzer auf Sechzehntel umstellt
- **THEN** liegen die Schläge auf den Sechzehntel-Positionen 1 und 3

#### Scenario: Sechzehntel nach Triole mit Verlust
- **WHEN** ein Beat in Sechzehnteln Schläge auf den Positionen 1 und 2 hat und der Nutzer auf Achteltriolen umstellt
- **THEN** fragt das System nach einer Bestätigung, weil der Schlag auf Position 2 verloren ginge
- **AND** nach Bestätigung bleibt nur der Schlag auf Triolen-Position 1 erhalten
- **AND** bei Ablehnung bleibt der Beat unverändert in Sechzehnteln

#### Scenario: Achteltriole nach Sechzehnteltriole
- **WHEN** ein Beat in Achteltriolen Schläge auf allen drei Positionen hat und der Nutzer auf Sechzehnteltriolen umstellt
- **THEN** liegen die Schläge ohne Nachfrage auf den Positionen 1, 3 und 5

#### Scenario: Spielweise folgt dem Schlag
- **WHEN** ein Beat in Sechzehnteln eine Ghost Note der Snare auf Position 3 hat und der Nutzer auf Achtel umstellt
- **THEN** liegt auf Achtel-Position 2 eine Ghost Note der Snare

## ADDED Requirements

### Requirement: Spielweise eines Schlags
Schläge von Snare, Tom 1, Tom 2 und Standtom MUST die Spielweise normal, Flam oder Ghost Note haben können. Shift-Klick auf eine gesetzte Zelle dieser Instrumente MUST die Spielweise in der Reihenfolge normal, Flam, Ghost Note, normal weiterschalten. Shift-Klick auf eine leere Zelle MUST einen Schlag mit Flam setzen. Bei anderen Instrumenten MUST Shift-Klick nichts ändern. Die Zelle MUST ihre Spielweise anzeigen.

#### Scenario: Spielweise durchschalten
- **WHEN** die Snare auf der „1“ gesetzt ist und der Nutzer die Zelle dreimal mit Shift aktiviert
- **THEN** ist der Schlag nacheinander Flam, Ghost Note und wieder normal

#### Scenario: Flam auf leerer Zelle
- **WHEN** der Nutzer eine leere Zelle von Tom 1 mit Shift aktiviert
- **THEN** enthält das Pattern dort einen Tom-1-Schlag mit Flam

#### Scenario: Shift-Klick auf der Hi-Hat
- **WHEN** der Nutzer eine Zelle der Hi-Hat (geschlossen) mit Shift aktiviert
- **THEN** bleibt das Pattern unverändert

#### Scenario: Anzeige in der Zelle
- **WHEN** die Snare auf der „1“ eine Ghost Note hat
- **THEN** zeigt die Zelle an, dass dort eine Ghost Note liegt, und ihr zugänglicher Name nennt „Ghost Note“
