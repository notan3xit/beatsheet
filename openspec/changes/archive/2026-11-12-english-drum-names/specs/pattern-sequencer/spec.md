# Spec Delta

## MODIFIED Requirements

### Requirement: Instrumentenset
Der Sequencer MUST für jedes Pattern genau diese Instrumente als Zeilen anbieten, von oben nach unten: Crash, Ride, Hi-Hat (geschlossen), Hi-Hat (offen), Tom 1, Tom 2, Snare, Floor Tom, Kick Drum, Hi-Hat-Pedal.

#### Scenario: Zeilen des Rasters
- **WHEN** der Nutzer ein Pattern im Sequencer öffnet
- **THEN** zeigt das Raster die zehn Instrumente in der festgelegten Reihenfolge

### Requirement: Schläge setzen und entfernen
Der Nutzer MUST durch Aktivieren einer Rasterzelle einen Schlag für das Instrument an dieser Position setzen und durch erneutes Aktivieren wieder entfernen können. An einer Position MUST mehrere Instrumente gleichzeitig gesetzt sein können. Wird ein Schlag entfernt, MUST auch seine Spielweise entfallen; ein danach neu gesetzter Schlag MUST normal gespielt sein.

#### Scenario: Schlag setzen
- **WHEN** der Nutzer in Beat 1 die Zelle der Kick Drum an Position 1 aktiviert
- **THEN** enthält das Pattern einen Kick-Drum-Schlag auf der „1“

#### Scenario: Schlag entfernen
- **WHEN** der Nutzer eine bereits gesetzte Zelle erneut aktiviert
- **THEN** ist der Schlag an dieser Position entfernt

#### Scenario: Gleichzeitige Schläge
- **WHEN** der Nutzer an derselben Position Hi-Hat und Snare setzt
- **THEN** enthält das Pattern beide Schläge an dieser Position

#### Scenario: Flam entfernen und neu setzen
- **WHEN** die Snare auf der „1“ einen Flam hat und der Nutzer die Zelle zweimal ohne Shift aktiviert
- **THEN** hat das Pattern auf der „1“ einen normalen Snare-Schlag ohne Flam

### Requirement: Spielweise eines Schlags
Ein Schlag MUST diese Spielweisen haben können: Snare normal, Flam, Drag, Ghost Note, Rim Shot, Cross-Stick; Tom 1, Tom 2 und Floor Tom normal, Flam, Drag, Ghost Note; Ride normal, Bell; Crash normal, Choke. Die Zelle MUST ihre Spielweise anzeigen.

#### Scenario: Anzeige in der Zelle
- **WHEN** die Snare auf der „1“ eine Ghost Note hat
- **THEN** zeigt die Zelle an, dass dort eine Ghost Note liegt, und ihr zugänglicher Name nennt „Ghost Note“

### Requirement: Spielweise per Shift-Klick
Shift-Klick auf eine gesetzte Zelle eines Instruments mit Spielweisen nach „Spielweise eines Schlags“ MUST die Spielweise in der dort genannten Reihenfolge weiterschalten und nach der letzten zu normal zurückkehren. Shift-Klick auf eine leere Zelle MUST einen Schlag mit der ersten Spielweise nach normal setzen. Bei anderen Instrumenten MUST Shift-Klick nichts ändern.

#### Scenario: Spielweise durchschalten
- **WHEN** die Snare auf der „1“ gesetzt ist und der Nutzer die Zelle sechsmal mit Shift aktiviert
- **THEN** ist der Schlag nacheinander Flam, Drag, Ghost Note, Rim Shot, Cross-Stick und wieder normal

#### Scenario: Spielweisen der Toms
- **WHEN** Tom 1 auf der „1“ gesetzt ist und der Nutzer die Zelle viermal mit Shift aktiviert
- **THEN** ist der Schlag nacheinander Flam, Drag, Ghost Note und wieder normal

#### Scenario: Bell auf der Ride
- **WHEN** die Ride auf der „1“ gesetzt ist und der Nutzer die Zelle zweimal mit Shift aktiviert
- **THEN** ist der Schlag nacheinander Bell und wieder normal

#### Scenario: Choke auf leerer Crash-Zelle
- **WHEN** der Nutzer eine leere Zelle der Crash mit Shift aktiviert
- **THEN** enthält das Pattern dort einen Crash-Schlag mit Choke

#### Scenario: Flam auf leerer Zelle
- **WHEN** der Nutzer eine leere Zelle von Tom 1 mit Shift aktiviert
- **THEN** enthält das Pattern dort einen Tom-1-Schlag mit Flam

#### Scenario: Shift-Klick auf der Hi-Hat
- **WHEN** der Nutzer eine Zelle der Hi-Hat (geschlossen) mit Shift aktiviert
- **THEN** bleibt das Pattern unverändert

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
- **WHEN** der Nutzer eine leere Zelle der Kick Drum mit Strg aktiviert
- **THEN** enthält das Pattern dort einen betonten normalen Kick-Drum-Schlag

#### Scenario: Ghost Note
- **WHEN** die Snare auf der „1“ eine Ghost Note hat und der Nutzer die Zelle mit Strg aktiviert
- **THEN** bleibt das Pattern unverändert

#### Scenario: Anzeige in der Zelle
- **WHEN** die Snare auf der „1“ ein betonter Rim Shot ist
- **THEN** zeigt die Zelle Spielweise und Betonung an, und ihr zugänglicher Name nennt „Rim Shot“ und „betont“
