# song-structure Specification

## Purpose

Beschreibt den Aufbau eines Songs aus Segmenten, Blöcken und Takten sowie die musikalische Bedeutung der Zuordnungen: welcher Groove-Abschnitt in welchem Takt läuft, wie Fills den Groove überlagern und wie Akzente hinzukommen.

## Requirements

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

### Requirement: Segmente bearbeiten
Das System MUST Segmente umbenennen, löschen (nach Bestätigung), verschieben (nach oben/unten) und duplizieren können. Ein dupliziertes Segment MUST direkt hinter dem Original stehen, „(Kopie)“ im Namen tragen und Blöcke, Takte, Groove-Zuordnungen, Fills und Akzente als unabhängige Kopie enthalten, die auf dieselben Patterns verweist.

#### Scenario: Segment duplizieren
- **WHEN** der Nutzer „Verse“ dupliziert und in der Kopie den Fill im letzten Takt entfernt
- **THEN** steht „Verse (Kopie)“ hinter „Verse“
- **AND** „Verse“ hat seinen Fill weiterhin

#### Scenario: Segment verschieben
- **WHEN** der Nutzer bei der Reihenfolge Intro, Verse, Chorus „Chorus“ nach oben verschiebt
- **THEN** ist die Reihenfolge Intro, Chorus, Verse

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

### Requirement: Fortlauf mehrtaktiger Grooves
Aufeinanderfolgende Takte desselben Blocks mit demselben Groove MUST den Groove fortlaufend spielen: Jeder Takt setzt dort fort, wo der vorige aufgehört hat, und nach dem Ende des Grooves beginnt er von vorn. Ein Blockanfang, ein anderer Groove oder ein Takt ohne Groove MUST den Fortlauf neu beginnen lassen.

#### Scenario: Zweitaktiger Groove
- **WHEN** ein Block vier 4/4-Takte mit Groove A (8 Beats) enthält
- **THEN** spielen die Takte die Beats 1–4, 5–8, 1–4, 5–8 von A

#### Scenario: Ungerade Taktlängen
- **WHEN** ein Block die Takte 4/4, 2/4, 4/4 mit Groove A (8 Beats) enthält
- **THEN** spielen sie die Beats 1–4, 5–6 und 7–8 gefolgt von 1–2 von A

#### Scenario: Neustart am Blockanfang
- **WHEN** Block 1 mit einem 4/4-Takt Groove A (8 Beats) endet und Block 2 mit Groove A beginnt
- **THEN** spielt der erste Takt von Block 2 die Beats 1–4 von A

### Requirement: Fill überlagert von rechts
Ein Fill an einem Takt MUST am Ende dieses Takts enden und die letzten n Beats überdecken (n = Länge des Fills), auch über Takt-, Block- und Segmentgrenzen nach links. Überdeckte Beats MUST statt des Grooves den Fill spielen. Reicht der Fill über den Songanfang hinaus, MUST er am Songanfang abgeschnitten werden.

#### Scenario: Fill über einen Beat
- **WHEN** Takt 4 (4/4, Groove A) den Fill f1 mit 1 Beat hat
- **THEN** spielt Takt 4 die Beats 1–3 von A und danach f1

#### Scenario: Fill über Taktgrenze
- **WHEN** Takt 4 den Fill f4 mit 6 Beats hat und Takt 3 und 4 jeweils 4/4 sind
- **THEN** spielt f4 ab Beat 3 von Takt 3 bis zum Ende von Takt 4

#### Scenario: Reiner Fill-Takt
- **WHEN** ein 4/4-Takt ohne Groove einen Fill mit 4 Beats hat
- **THEN** spielt der Takt vollständig den Fill

### Requirement: Akzente
Der Nutzer MUST einem Takt Akzente hinzufügen und sie entfernen können. Ein Akzent besteht aus Instrument, Beat im Takt und Sechzehntel-Position im Beat (1–4). Akzente MUST zusätzlich zu Groove oder Fill gespielt werden und ersetzen nichts.

#### Scenario: Crash auf der Eins
- **WHEN** der Nutzer Takt 1 einen Crash-Akzent auf Beat 1, Position 1 hinzufügt
- **THEN** hat Takt 1 den Akzent und der Groove des Takts bleibt unverändert

#### Scenario: Akzent außerhalb des Takts
- **WHEN** ein Akzent auf Beat 4 liegt und der Takt auf 2 Beats gekürzt wird
- **THEN** wird der Akzent entfernt
