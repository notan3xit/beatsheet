# Spec Delta

## ADDED Requirements

### Requirement: Betonung eines Schlags
Jeder Schlag außer einer Ghost Note MUST zusätzlich zu seiner Spielweise betont sein können. Strg-Klick, auf dem Mac Cmd-Klick, auf eine gesetzte Zelle MUST die Betonung umschalten und die Spielweise beibehalten. Auf einer leeren Zelle MUST er einen betonten normalen Schlag setzen. Auf einer Ghost Note MUST er nichts ändern. Die Zelle MUST die Betonung anzeigen.

#### Scenario: Betonung umschalten
- **WHEN** die Hi-Hat auf der „1“ gesetzt ist und der Nutzer die Zelle zweimal mit Strg aktiviert
- **THEN** ist der Schlag nacheinander betont und wieder unbetont

#### Scenario: Mit Cmd auf dem Mac
- **WHEN** die Hi-Hat auf der „1“ gesetzt ist und der Nutzer die Zelle mit Cmd aktiviert
- **THEN** ist der Schlag betont

#### Scenario: Betonter Flam
- **WHEN** die Snare auf der „1“ einen Flam hat und der Nutzer die Zelle mit Strg aktiviert
- **THEN** ist der Schlag ein betonter Flam

#### Scenario: Leere Zelle
- **WHEN** der Nutzer eine leere Zelle der Bassdrum mit Strg aktiviert
- **THEN** enthält das Pattern dort einen betonten normalen Bassdrum-Schlag

#### Scenario: Ghost Note
- **WHEN** die Snare auf der „1“ eine Ghost Note hat und der Nutzer die Zelle mit Strg aktiviert
- **THEN** bleibt das Pattern unverändert

#### Scenario: Anzeige in der Zelle
- **WHEN** die Snare auf der „1“ ein betonter Rim Shot ist
- **THEN** zeigt die Zelle Spielweise und Betonung an, und ihr zugänglicher Name nennt „Rim Shot“ und „betont“

### Requirement: Betonung folgt ihrem Schlag
Wird ein Schlag entfernt, MUST seine Betonung mit entfallen. Wird eine Spielweise zur Ghost Note, MUST die Betonung entfallen. Beim Wechsel der Unterteilung MUST die Betonung mit ihrem Schlag wandern.

#### Scenario: Schlag entfernen und neu setzen
- **WHEN** die Snare auf der „1“ betont ist und der Nutzer die Zelle zweimal ohne Taste aktiviert
- **THEN** hat das Pattern auf der „1“ einen unbetonten normalen Snare-Schlag

#### Scenario: Weiterschalten zur Ghost Note
- **WHEN** die Snare auf der „1“ ein betonter Drag ist und der Nutzer die Zelle mit Shift aktiviert
- **THEN** ist der Schlag eine unbetonte Ghost Note

#### Scenario: Wechsel der Hi-Hat-Variante
- **WHEN** die geschlossene Hi-Hat auf der „1“ betont ist und der Nutzer dort die offene Hi-Hat setzt
- **THEN** ist an dieser Position eine unbetonte offene Hi-Hat gesetzt

#### Scenario: Wechsel der Unterteilung
- **WHEN** ein Beat in Sechzehnteln eine betonte Snare auf Position 3 hat und der Nutzer auf Achtel umstellt
- **THEN** liegt auf Achtel-Position 2 eine betonte Snare

## MODIFIED Requirements

### Requirement: Spielweise eines Schlags
Ein Schlag MUST diese Spielweisen haben können: Snare normal, Flam, Drag, Ghost Note, Rim Shot, Cross-Stick; Tom 1, Tom 2 und Standtom normal, Flam, Drag, Ghost Note; Ride normal, Glocke; Crash normal, Choke. Shift-Klick auf eine gesetzte Zelle dieser Instrumente MUST die Spielweise in dieser Reihenfolge weiterschalten und nach der letzten zu normal zurückkehren. Shift-Klick auf eine leere Zelle MUST einen Schlag mit der ersten Spielweise nach normal setzen. Bei anderen Instrumenten MUST Shift-Klick nichts ändern. Die Zelle MUST ihre Spielweise anzeigen.

#### Scenario: Spielweise durchschalten
- **WHEN** die Snare auf der „1“ gesetzt ist und der Nutzer die Zelle sechsmal mit Shift aktiviert
- **THEN** ist der Schlag nacheinander Flam, Drag, Ghost Note, Rim Shot, Cross-Stick und wieder normal

#### Scenario: Spielweisen der Toms
- **WHEN** Tom 1 auf der „1“ gesetzt ist und der Nutzer die Zelle viermal mit Shift aktiviert
- **THEN** ist der Schlag nacheinander Flam, Drag, Ghost Note und wieder normal

#### Scenario: Glocke auf der Ride
- **WHEN** die Ride auf der „1“ gesetzt ist und der Nutzer die Zelle zweimal mit Shift aktiviert
- **THEN** ist der Schlag nacheinander Glocke und wieder normal

#### Scenario: Choke auf leerer Crash-Zelle
- **WHEN** der Nutzer eine leere Zelle der Crash mit Shift aktiviert
- **THEN** enthält das Pattern dort einen Crash-Schlag mit Choke

#### Scenario: Flam auf leerer Zelle
- **WHEN** der Nutzer eine leere Zelle von Tom 1 mit Shift aktiviert
- **THEN** enthält das Pattern dort einen Tom-1-Schlag mit Flam

#### Scenario: Shift-Klick auf der Hi-Hat
- **WHEN** der Nutzer eine Zelle der Hi-Hat (geschlossen) mit Shift aktiviert
- **THEN** bleibt das Pattern unverändert

#### Scenario: Anzeige in der Zelle
- **WHEN** die Snare auf der „1“ eine Ghost Note hat
- **THEN** zeigt die Zelle an, dass dort eine Ghost Note liegt, und ihr zugänglicher Name nennt „Ghost Note“
