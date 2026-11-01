# Spec Delta

## Purpose

Stellt ein Drum-Pattern als Noten nach gängiger Schlagzeug-Notation dar, damit Drummer die Parts so lesen können, wie sie es von Drum-Charts gewohnt sind.

## ADDED Requirements

### Requirement: Notensystem
Jedes Pattern MUST auf einem fünflinigen System mit Percussion-Schlüssel dargestellt werden. Nach jeweils 4 Beats MUST ein Taktstrich stehen. Ein Pattern, dessen Länge kein Vielfaches von 4 ist, endet mit einem unvollständigen Takt ohne aufgefüllte Pausen.

#### Scenario: Groove über zwei Takte
- **WHEN** ein Groove mit 8 Beats dargestellt wird
- **THEN** erscheint ein Percussion-Schlüssel und das Pattern ist durch einen Taktstrich in zwei Takte zu je 4 Beats geteilt

#### Scenario: Kurzer Fill
- **WHEN** ein Fill mit 1 Beat dargestellt wird
- **THEN** zeigt die Darstellung genau diesen einen Beat, ohne Pausen für die übrigen Beats eines Takts

### Requirement: Systemposition je Instrument
Jedes Instrument MUST an einer festen Systemposition stehen (Linie 1 = unterste Linie):

| Instrument | Position |
|---|---|
| Hi-Hat-Pedal | Hilfslinie unter dem System |
| Bassdrum | Zwischenraum 1 |
| Standtom | Zwischenraum 2 |
| Snare | Zwischenraum 3 |
| Tom 2 | Linie 4 |
| Tom 1 | Zwischenraum 4 |
| Ride | Linie 5 |
| Hi-Hat (geschlossen/offen) | über Linie 5 |
| Crash | Hilfslinie über dem System |

#### Scenario: Snare und Bassdrum
- **WHEN** ein Pattern einen Snare- und einen Bassdrum-Schlag enthält
- **THEN** steht die Snare im Zwischenraum 3 und die Bassdrum im Zwischenraum 1

### Requirement: Notenköpfe
Becken (Crash, Ride, Hi-Hat geschlossen und offen) und das Hi-Hat-Pedal MUST mit x-Notenkopf dargestellt werden, Trommeln mit normalem Notenkopf. Die offene Hi-Hat MUST zusätzlich ein „o“ über der Note tragen.

#### Scenario: Becken mit x-Notenkopf
- **WHEN** ein Pattern einen Ride-Schlag enthält
- **THEN** erscheint er als x-Notenkopf auf Linie 5

#### Scenario: Offene Hi-Hat
- **WHEN** ein Pattern einen Schlag auf der offenen Hi-Hat enthält
- **THEN** erscheint er als x-Notenkopf im Zwischenraum über Linie 5 mit einem „o“ darüber

### Requirement: Hände und Füße als getrennte Stimmen
Bassdrum und Hi-Hat-Pedal MUST als untere Stimme mit Hälsen nach unten notiert werden, alle übrigen Instrumente als obere Stimme mit Hälsen nach oben. Gleichzeitige Schläge einer Stimme MUST als ein Akkord an einem gemeinsamen Hals erscheinen.

#### Scenario: Grundgroove
- **WHEN** ein Beat Hi-Hat und Bassdrum auf der „1“ und Hi-Hat und Snare auf dem „und“ hat
- **THEN** stehen Hi-Hat und Snare in der oberen Stimme mit Hälsen nach oben
- **AND** die Bassdrum steht in der unteren Stimme mit Hals nach unten

### Requirement: Notenwerte und Pausen aus dem Raster
Notenwerte MUST sich aus der Unterteilung des Beats und dem Abstand zum nächsten Schlag derselben Stimme im selben Beat ergeben. Lücken vor dem ersten Schlag einer Stimme im Beat MUST durch Pausen gefüllt werden. Ein Beat ohne Schläge einer Stimme MUST für diese Stimme eine Viertelpause zeigen.

#### Scenario: Achtel aus Sechzehntel-Raster
- **WHEN** ein Beat in Sechzehnteln Hi-Hat-Schläge auf den Positionen 1 und 3 hat
- **THEN** erscheinen in der oberen Stimme zwei Achtelnoten

#### Scenario: Pause vor Offbeat
- **WHEN** ein Beat in Sechzehnteln einen Snare-Schlag nur auf Position 3 hat
- **THEN** zeigt die obere Stimme eine Achtelpause gefolgt von einer Achtelnote

#### Scenario: Leerer Beat für die Füße
- **WHEN** ein Beat keine Bassdrum- und Hi-Hat-Pedal-Schläge hat
- **THEN** zeigt die untere Stimme für diesen Beat eine Viertelpause

### Requirement: Balken pro Beat
Noten MUST je Stimme innerhalb eines Beats gebalkt werden. Balken MUST NOT über Beatgrenzen gehen.

#### Scenario: Sechzehntel im Beat
- **WHEN** ein Beat vier Hi-Hat-Sechzehntel hat
- **THEN** sind die vier Noten durch einen gemeinsamen Doppelbalken verbunden
- **AND** der Balken endet am Ende des Beats

### Requirement: Triolen kennzeichnen
Ein Beat mit Achteltriolen- oder Sechzehnteltriolen-Unterteilung MUST in jeder Stimme, die in diesem Beat Noten hat, mit einer „3“ bzw. „6“ über bzw. unter der Gruppe gekennzeichnet werden.

#### Scenario: Achteltriole
- **WHEN** Beat 3 auf Achteltriolen steht und Snare-Schläge auf allen drei Positionen hat
- **THEN** erscheinen drei gebalkte Achtelnoten mit einer „3“ über der Gruppe

#### Scenario: Gemischtes Pattern
- **WHEN** die Beats 1, 2 und 4 in Sechzehnteln und Beat 3 in Achteltriolen stehen
- **THEN** ist nur Beat 3 als Triole gekennzeichnet

### Requirement: Leeres Pattern
Ein Pattern ohne Schläge MUST als System mit Viertelpausen in beiden Stimmen für jeden Beat dargestellt werden.

#### Scenario: Neuer Groove
- **WHEN** ein neu angelegter, leerer Groove mit 4 Beats dargestellt wird
- **THEN** zeigt jede Stimme vier Viertelpausen
