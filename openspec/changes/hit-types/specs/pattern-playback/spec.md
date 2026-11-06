# Spec Delta

## ADDED Requirements

### Requirement: Klang der Betonung
Ein betonter Schlag MUST lauter erklingen als derselbe Schlag ohne Betonung. Bei Flam und Drag MUST nur der Hauptschlag lauter werden. Viele gleichzeitige betonte Schläge MUST NOT hörbar übersteuern.

#### Scenario: Betonter Schlag
- **WHEN** die Hi-Hat auf Position 1 betont und auf Position 3 unbetont ist
- **THEN** erklingt der Schlag auf Position 1 lauter als der auf Position 3

#### Scenario: Betonter Flam
- **WHEN** die Snare auf der „1“ einen betonten Flam hat
- **THEN** erklingt der Vorschlag so leise wie bei einem unbetonten Flam und der Hauptschlag lauter als ein normaler

#### Scenario: Betonte Spielweise
- **WHEN** die Snare auf Position 1 einen betonten Rim Shot und auf Position 3 einen unbetonten hat
- **THEN** erklingen beide mit dem Klang des Rim Shots, der auf Position 1 lauter

## MODIFIED Requirements

### Requirement: Klang der Spielweisen
Eine Ghost Note MUST deutlich leiser erklingen als ein normaler Schlag desselben Instruments. Ein Flam MUST als zwei Schläge erklingen: ein leiser Vorschlag kurz vor der Position und der Hauptschlag genau auf der Position. Ein Drag MUST ebenso klingen, aber mit zwei leisen Vorschlägen. Rim Shot, Cross-Stick und Ride-Glocke MUST sich hörbar vom normalen Schlag des Instruments unterscheiden; ein Rim Shot MUST lauter und schärfer klingen als ein normaler Snare-Schlag, ein Cross-Stick leiser und kürzer. Ein Crash mit Choke MUST kurz nach seinem Einsatz abrupt enden.

#### Scenario: Ghost Note
- **WHEN** die Snare auf Position 1 eine Ghost Note und auf Position 3 einen normalen Schlag hat
- **THEN** erklingt der Schlag auf Position 1 leiser als der auf Position 3

#### Scenario: Flam
- **WHEN** Tom 1 auf der „1“ einen Flam hat
- **THEN** erklingt kurz vor der „1“ ein leiser Tom-1-Schlag und auf der „1“ ein normaler

#### Scenario: Drag
- **WHEN** die Snare auf der „1“ einen Drag hat
- **THEN** erklingen kurz vor der „1“ zwei leise Snare-Schläge und auf der „1“ ein normaler

#### Scenario: Rim Shot
- **WHEN** die Snare auf Position 1 einen Rim Shot und auf Position 3 einen normalen Schlag hat
- **THEN** erklingt der Schlag auf Position 1 lauter als der auf Position 3 und mit eigenem Klang

#### Scenario: Cross-Stick
- **WHEN** die Snare auf Position 1 einen Cross-Stick und auf Position 3 einen normalen Schlag hat
- **THEN** erklingt der Schlag auf Position 1 leiser und kürzer als der auf Position 3

#### Scenario: Ride-Glocke
- **WHEN** die Ride auf Position 1 eine Glocke und auf Position 3 einen normalen Schlag hat
- **THEN** erklingen beide Schläge mit verschiedenem Klang

#### Scenario: Choke
- **WHEN** die Crash auf der „1“ einen Choke und auf der „3“ einen normalen Schlag hat
- **THEN** ist der Klang auf der „1“ nach einem Bruchteil einer Sekunde verstummt, der auf der „3“ klingt nach
