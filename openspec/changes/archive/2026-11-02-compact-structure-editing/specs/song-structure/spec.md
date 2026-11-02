# Spec Delta

## MODIFIED Requirements

### Requirement: Blöcke und Takte bearbeiten
Das System MUST einem Segment unten einen Block anfügen können. Der neue Block MUST so viele Takte haben wie der bisher letzte Block des Segments, jeweils mit Länge und Groove von dessen letztem Takt, ohne Fills und Akzente. In einem Segment ohne Blöcke MUST der neue Block 4 Takte zu 4 Beats ohne Groove haben. Das System MUST einen Takt vor oder nach einem Takt einfügen und Takte löschen können. Ein Block ohne Takte MUST entfernt werden, ein Segment ohne Blöcke MUST bestehen bleiben.

#### Scenario: Takt einfügen
- **WHEN** der Nutzer nach Takt 2 eines Blocks mit 4 Takten einen Takt einfügt
- **THEN** hat der Block 5 Takte und der neue Takt steht an Position 3 mit Länge und Groove von Takt 2

#### Scenario: Takt davor einfügen
- **WHEN** der Nutzer vor Takt 1 eines Blocks aus 3/4-Takten mit Groove A einen Takt einfügt
- **THEN** steht an Position 1 ein neuer 3/4-Takt mit Groove A ohne Fill und Akzente

#### Scenario: Block unten anfügen
- **WHEN** der letzte Block von „Verse“ 8 Takte hat und der letzte davon ein 4/4-Takt mit Groove B und Fill ist
- **AND** der Nutzer an „Verse“ einen Block anfügt
- **THEN** hat „Verse“ unten einen weiteren Block mit 8 Takten 4/4, alle mit Groove B und ohne Fill

#### Scenario: Block an Segment ohne Blöcke
- **WHEN** der Nutzer einem Segment ohne Blöcke einen Block anfügt
- **THEN** hat das Segment einen Block mit 4 Takten 4/4 ohne Groove

#### Scenario: Letzten Takt eines Blocks löschen
- **WHEN** der Nutzer den einzigen Takt eines Blocks löscht
- **THEN** ist der Block entfernt und das Segment bleibt bestehen

### Requirement: Takteigenschaften setzen
Der Nutzer MUST für einen oder mehrere ausgewählte Takte den Groove (oder keinen) und den Fill (oder keinen) setzen sowie die Länge um einen Beat verringern oder erhöhen können. Die Längenänderung MUST für jeden ausgewählten Takt einzeln gelten und MUST nicht möglich sein, wenn dabei ein Takt den Bereich 1–16 Beats verlassen würde. Als Groove MUST nur ein Pattern vom Typ Groove, als Fill nur eines vom Typ Fill desselben Songs wählbar sein.

#### Scenario: Groove für Auswahl setzen
- **WHEN** der Nutzer die Takte 5 bis 8 auswählt und Groove B setzt
- **THEN** haben genau diese vier Takte Groove B

#### Scenario: Taktlänge ändern
- **WHEN** der Nutzer einen 4/4-Takt zweimal um einen Beat verringert
- **THEN** ist der Takt ein 2/4-Takt und alle anderen Takte bleiben unverändert

#### Scenario: Länge gemischter Auswahl erhöhen
- **WHEN** der Nutzer einen 4/4- und einen 3/4-Takt auswählt und die Länge um einen Beat erhöht
- **THEN** sind die Takte 5/4 und 4/4

#### Scenario: Grenze in gemischter Auswahl
- **WHEN** der Nutzer einen 16/4- und einen 4/4-Takt auswählt
- **THEN** ist das Erhöhen der Länge nicht möglich und beide Takte bleiben unverändert

#### Scenario: Fill setzen und entfernen
- **WHEN** der Nutzer für Takt 4 den Fill f1 setzt und danach „kein“ wählt
- **THEN** hat Takt 4 keinen Fill

### Requirement: Platzhalter aus der Struktur anlegen
Beim Setzen eines Grooves oder Fills MUST der Nutzer ein neues Pattern anlegen können, ohne den Struktur-Editor zu verlassen und ohne Namen oder Länge einzugeben. Ein neuer Groove MUST 4 Beats lang und leer sein, ein neuer Fill 1 Beat lang und leer. Beide MUST den automatischen Namen und die nächste freie Farbe erhalten. Die ausgewählten Takte MUST danach auf das neue Pattern verweisen.

#### Scenario: Neuer Groove als Platzhalter
- **WHEN** der Song bereits Groove 1 hat und der Nutzer für die Takte 1 bis 4 einen neuen Groove anlegt
- **THEN** existiert im Song ein leerer Groove „Groove 2“ mit 4 Beats in der nächsten freien Farbe
- **AND** genau die Takte 1 bis 4 verweisen darauf

#### Scenario: Neuer Fill als Platzhalter
- **WHEN** der Nutzer für Takt 8 einen neuen Fill anlegt
- **THEN** existiert ein leerer Fill „Fill 1“ mit 1 Beat und Takt 8 hat diesen Fill

## ADDED Requirements

### Requirement: Segmente einfügen
Das System MUST ein Segment direkt hinter einem bestehenden Segment einfügen können und in einem Song ohne Segmente ein erstes Segment anlegen können, jeweils ohne vorherige Eingabe. Das neue Segment MUST „Segment N“ heißen (N = Anzahl der Segmente danach) und einen Block mit 4 Takten zu 4 Beats ohne Groove enthalten. Nach dem Anlegen MUST das neue Segment ausgewählt sein, damit der Nutzer es sofort umbenennen kann.

#### Scenario: Erstes Segment
- **WHEN** der Nutzer in einem leeren Song das erste Segment anlegt
- **THEN** besteht der Song aus „Segment 1“ mit einem Block aus 4 Takten 4/4 ohne Groove
- **AND** „Segment 1“ ist ausgewählt

#### Scenario: Segment dazwischen einfügen
- **WHEN** der Nutzer bei der Reihenfolge Intro, Chorus hinter „Intro“ ein Segment einfügt
- **THEN** ist die Reihenfolge Intro, „Segment 3“, Chorus

## REMOVED Requirements

### Requirement: Segmente anlegen
**Reason**: Segmente werden nicht mehr per Formular mit Name, Taktzahl, Taktlänge und Groove angefügt, sondern ohne Eingabe an einer Stelle eingefügt und danach bearbeitet.
**Migration**: Ersetzt durch „Segmente einfügen“. Name, Taktzahl, Länge und Groove setzt der Nutzer anschließend über das Segment- und das Takt-Popover.
