# Spec Delta

## MODIFIED Requirements

### Requirement: Segmente einfügen
Das System MUST ein Segment direkt hinter einem bestehenden Segment einfügen können und in einem Song ohne Segmente ein erstes Segment anlegen können, jeweils ohne vorherige Eingabe. Das neue Segment MUST „Segment N“ heißen (N = Anzahl der Segmente danach) und einen Block mit 4 Takten ohne Groove enthalten, jeder so lang wie der Standard-Takt des Songs. Nach dem Anlegen MUST das neue Segment ausgewählt sein, damit der Nutzer es sofort umbenennen kann.

#### Scenario: Erstes Segment
- **WHEN** der Nutzer in einem leeren Song in 4/4 das erste Segment anlegt
- **THEN** besteht der Song aus „Segment 1“ mit einem Block aus 4 Takten 4/4 ohne Groove
- **AND** „Segment 1“ ist ausgewählt

#### Scenario: Erstes Segment im Standard-Takt
- **WHEN** der Nutzer in einem leeren Song in 3/4 das erste Segment anlegt
- **THEN** besteht der Song aus „Segment 1“ mit einem Block aus 4 Takten 3/4 ohne Groove

#### Scenario: Segment dazwischen einfügen
- **WHEN** der Nutzer bei der Reihenfolge Intro, Chorus hinter „Intro“ ein Segment einfügt
- **THEN** ist die Reihenfolge Intro, „Segment 3“, Chorus

### Requirement: Blöcke und Takte bearbeiten
Das System MUST einem Segment unten einen Block anfügen können. Der neue Block MUST so viele Takte haben wie der bisher letzte Block des Segments, jeweils mit Länge und Groove von dessen letztem Takt, ohne Fills und Akzente. In einem Segment ohne Blöcke MUST der neue Block 4 Takte ohne Groove haben, jeder so lang wie der Standard-Takt des Songs. Das System MUST einen Takt vor oder nach einem Takt einfügen und Takte löschen können. Ein Block ohne Takte MUST entfernt werden, ein Segment ohne Blöcke MUST bestehen bleiben.

#### Scenario: Takt einfügen
- **WHEN** der Nutzer nach Takt 2 eines Blocks mit 4 Takten einen Takt einfügt
- **THEN** hat der Block 5 Takte und der neue Takt steht an Position 3 mit Länge und Groove von Takt 2

#### Scenario: Takt davor einfügen
- **WHEN** der Nutzer vor Takt 1 eines Blocks aus 3/4-Takten mit Groove A einen Takt einfügt
- **THEN** steht an Position 1 ein neuer 3/4-Takt mit Groove A ohne Fill und Akzente

#### Scenario: Nachbartakt vor Standard-Takt
- **WHEN** der Song in 5/4 steht und der Nutzer nach einem 3/4-Takt einen Takt einfügt
- **THEN** ist der neue Takt ein 3/4-Takt

#### Scenario: Block unten anfügen
- **WHEN** der letzte Block von „Verse“ 8 Takte hat und der letzte davon ein 4/4-Takt mit Groove B und Fill ist
- **AND** der Nutzer an „Verse“ einen Block anfügt
- **THEN** hat „Verse“ unten einen weiteren Block mit 8 Takten 4/4, alle mit Groove B und ohne Fill

#### Scenario: Block an Segment ohne Blöcke
- **WHEN** der Nutzer in einem Song in 4/4 einem Segment ohne Blöcke einen Block anfügt
- **THEN** hat das Segment einen Block mit 4 Takten 4/4 ohne Groove

#### Scenario: Block an Segment ohne Blöcke im Standard-Takt
- **WHEN** der Nutzer in einem Song in 7/4 einem Segment ohne Blöcke einen Block anfügt
- **THEN** hat das Segment einen Block mit 4 Takten 7/4 ohne Groove

#### Scenario: Letzten Takt eines Blocks löschen
- **WHEN** der Nutzer den einzigen Takt eines Blocks löscht
- **THEN** ist der Block entfernt und das Segment bleibt bestehen

### Requirement: Platzhalter aus der Struktur anlegen
Beim Setzen eines Grooves oder Fills MUST der Nutzer ein neues Pattern anlegen können, ohne den Struktur-Editor zu verlassen und ohne Namen oder Länge einzugeben. Ein neuer Groove MUST so lang wie der Standard-Takt des Songs und leer sein, ein neuer Fill 1 Beat lang und leer. Beide MUST den automatischen Namen und die nächste freie Farbe erhalten. Die ausgewählten Takte MUST danach auf das neue Pattern verweisen.

#### Scenario: Neuer Groove als Platzhalter
- **WHEN** der Song in 4/4 steht, bereits Groove 1 hat und der Nutzer für die Takte 1 bis 4 einen neuen Groove anlegt
- **THEN** existiert im Song ein leerer Groove „Groove 2“ mit 4 Beats in der nächsten freien Farbe
- **AND** genau die Takte 1 bis 4 verweisen darauf

#### Scenario: Neuer Groove als Platzhalter im Standard-Takt
- **WHEN** der Song in 5/4 steht und der Nutzer für Takt 1 einen neuen Groove anlegt
- **THEN** existiert im Song ein leerer Groove mit 5 Beats

#### Scenario: Neuer Fill als Platzhalter
- **WHEN** der Nutzer für Takt 8 einen neuen Fill anlegt
- **THEN** existiert ein leerer Fill „Fill 1“ mit 1 Beat und Takt 8 hat diesen Fill
