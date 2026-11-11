# Spec Delta

## MODIFIED Requirements

### Requirement: Klang der Aufnahmen
Mit dem Klang „DRSKit“ MUST jedes der zehn Instrumente mit einer Aufnahme des DRSKit erklingen. Ein Schlag mit vollem Pegel MUST die Aufnahme eines normalen Schlags nutzen, eine Ghost Note sowie die Vorschläge von Flam und Drag die Aufnahme eines leisen Schlags desselben Instruments. Rim Shot, Cross-Stick und Ride-Bell MUST je eine eigene, aus dem DRSKit gewonnene Aufnahme nutzen. Ein Choke MUST die Aufnahme des normalen Crash-Schlags nutzen.

#### Scenario: Normaler Schlag
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** ein normaler Snare-Schlag erklingt
- **THEN** spielt die Aufnahme des normalen Snare-Schlags

#### Scenario: Ghost Note
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** eine Ghost Note auf der Snare erklingt
- **THEN** spielt die Aufnahme des leisen Snare-Schlags

#### Scenario: Flam
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** ein Flam auf Tom 1 erklingt
- **THEN** spielt vor der Position die Aufnahme des leisen Tom-1-Schlags und auf der Position die des normalen

#### Scenario: Rim Shot
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** ein Rim Shot erklingt
- **THEN** spielt die Aufnahme des Rim Shots

#### Scenario: Cross-Stick
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** ein Cross-Stick erklingt
- **THEN** spielt die Aufnahme des Cross-Sticks

#### Scenario: Ride-Bell
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** eine Ride-Bell erklingt
- **THEN** spielt die Aufnahme der Bell

#### Scenario: Choke
- **GIVEN** der Klang ist „DRSKit“ und die Aufnahmen sind bereit
- **WHEN** ein Crash mit Choke erklingt
- **THEN** spielt die Aufnahme des normalen Crash-Schlags und endet kurz nach dem Einsatz
