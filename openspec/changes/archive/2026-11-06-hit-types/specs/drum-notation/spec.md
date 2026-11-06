# Spec Delta

## ADDED Requirements

### Requirement: Drag
Ein Schlag mit Drag MUST als Hauptnote mit zwei Vorschlägen auf derselben Systemposition unmittelbar davor dargestellt werden, verbunden durch einen Bogen unter den Notenköpfen. Stehen weitere Instrumente am selben Hals, MUST der Vorschlag nur für die Instrumente mit Drag erscheinen.

#### Scenario: Drag auf der Snare
- **WHEN** ein Beat einen Snare-Schlag mit Drag auf der „1“ hat
- **THEN** stehen vor der Snare-Note zwei Vorschläge im Zwischenraum 3
- **AND** ein Bogen unter den Notenköpfen verbindet sie mit der Snare-Note

#### Scenario: Drag im Akkord
- **WHEN** auf der „1“ Hi-Hat und Snare mit Drag liegen
- **THEN** hat nur die Snare Vorschläge, die Hi-Hat nicht

### Requirement: Rim Shot
Ein Rim Shot MUST mit durchgestrichenem Notenkopf auf der Systemposition der Snare dargestellt werden.

#### Scenario: Rim Shot im Akkord
- **WHEN** auf der „2“ Hi-Hat und ein Rim Shot liegen
- **THEN** ist der Snare-Notenkopf durchgestrichen und der Hi-Hat-Notenkopf unverändert

### Requirement: Cross-Stick
Ein Cross-Stick MUST mit x-Notenkopf auf der Systemposition der Snare dargestellt werden.

#### Scenario: Cross-Stick
- **WHEN** ein Beat einen Cross-Stick auf der „2“ hat
- **THEN** erscheint im Zwischenraum 3 ein x-Notenkopf

### Requirement: Ride-Glocke
Ein Schlag auf die Ride-Glocke MUST mit Rauten-Notenkopf auf der Systemposition der Ride dargestellt werden.

#### Scenario: Glocke
- **WHEN** ein Beat eine Ride-Glocke auf der „1“ hat
- **THEN** erscheint auf Linie 5 ein Rauten-Notenkopf

### Requirement: Choke
Ein Crash mit Choke MUST mit einem Punkt unmittelbar über seinem Notenkopf dargestellt werden.

#### Scenario: Choke
- **WHEN** ein Beat einen Crash mit Choke auf der „1“ hat
- **THEN** erscheint über dem x-Notenkopf der Crash ein Punkt

### Requirement: Betonung in den Noten
Eine Spalte mit mindestens einem betonten Schlag MUST genau ein `>` tragen, unabhängig davon, welches Instrument oder welche Stimme betont ist. Alle `>` einer Notenzeile MUST auf derselben Höhe oberhalb von System, Hälsen, Balken und Zeichen über den Noten stehen. Das gilt für jede Darstellung eines Patterns.

#### Scenario: Betonte Snare im Akkord
- **WHEN** auf der „2“ Hi-Hat und eine betonte Snare liegen
- **THEN** steht über dieser Spalte ein `>`

#### Scenario: Nur die Bassdrum betont
- **WHEN** auf der „1“ nur eine betonte Bassdrum liegt
- **THEN** steht das `>` oberhalb des Systems

#### Scenario: Hände und Füße betont
- **WHEN** auf der „1“ eine betonte Hi-Hat und eine betonte Bassdrum liegen
- **THEN** steht über dieser Spalte genau ein `>`

#### Scenario: Einheitliche Höhe
- **WHEN** in einer Notenzeile eine betonte Note mit Balken und eine betonte Viertelnote stehen
- **THEN** stehen beide `>` auf derselben Höhe und berühren keinen Balken

#### Scenario: Offene Hi-Hat
- **WHEN** eine offene Hi-Hat betont ist
- **THEN** steht das `>` über dem „o“

## MODIFIED Requirements

### Requirement: Notenköpfe
Becken (Crash, Ride, Hi-Hat geschlossen und offen) und das Hi-Hat-Pedal MUST mit x-Notenkopf dargestellt werden, Trommeln mit normalem Notenkopf, soweit die Spielweise keinen anderen vorgibt. Die offene Hi-Hat MUST zusätzlich ein „o“ über der Note tragen.

#### Scenario: Becken mit x-Notenkopf
- **WHEN** ein Pattern einen Ride-Schlag enthält
- **THEN** erscheint er als x-Notenkopf auf Linie 5

#### Scenario: Offene Hi-Hat
- **WHEN** ein Pattern einen Schlag auf der offenen Hi-Hat enthält
- **THEN** erscheint er als x-Notenkopf im Zwischenraum über Linie 5 mit einem „o“ darüber
