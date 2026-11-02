# Spec Delta

## ADDED Requirements

### Requirement: Flam
Ein Schlag mit Flam MUST als Hauptnote mit einem durchgestrichenen Vorschlag auf derselben Systemposition unmittelbar davor dargestellt werden. Vorschlag und Hauptnote MUST durch einen Bogen unter den Notenköpfen verbunden sein. Stehen weitere Instrumente am selben Hals, MUST der Vorschlag nur für die Instrumente mit Flam erscheinen.

#### Scenario: Flam auf der Snare
- **WHEN** ein Beat einen Snare-Schlag mit Flam auf der „1“ hat
- **THEN** steht vor der Snare-Note ein durchgestrichener Vorschlag im Zwischenraum 3
- **AND** ein Bogen unter den Notenköpfen verbindet Vorschlag und Snare-Note

#### Scenario: Flam im Akkord
- **WHEN** auf der „1“ Hi-Hat und Snare mit Flam liegen
- **THEN** hat nur die Snare einen Vorschlag, die Hi-Hat nicht

### Requirement: Ghost Note
Ein Schlag als Ghost Note MUST mit einem Notenkopf in runden Klammern dargestellt werden. Stehen weitere Instrumente am selben Hals, MUST nur der Notenkopf der Ghost Note eingeklammert sein.

#### Scenario: Ghost Note auf der Snare
- **WHEN** ein Beat eine Snare-Ghost-Note auf Sechzehntel-Position 2 hat
- **THEN** erscheint dort ein eingeklammerter Snare-Notenkopf

#### Scenario: Ghost Note im Akkord
- **WHEN** auf derselben Position Hi-Hat und eine Snare-Ghost-Note liegen
- **THEN** ist nur der Snare-Notenkopf eingeklammert
