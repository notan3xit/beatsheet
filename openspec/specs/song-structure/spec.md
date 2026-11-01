# song-structure Specification

## Purpose

Beschreibt den Aufbau eines Songs aus Segmenten, Blöcken und Takten sowie die musikalische Bedeutung der Zuordnungen: welcher Groove-Abschnitt in welchem Takt läuft, wie Fills den Groove überlagern und wie Akzente hinzukommen.

## Requirements

### Requirement: Segmente anlegen
Das System MUST das Anfügen eines Segments mit Name, Taktzahl (1–64), Taktlänge in Beats (1–16, Standard 4) und optional einem Groove ermöglichen. Das neue Segment MUST einen Block mit der angegebenen Zahl gleich langer Takte enthalten, alle mit diesem Groove oder ohne Groove.

#### Scenario: Intro anlegen
- **WHEN** der Nutzer das Segment „Intro“ mit 4 Takten zu 4 Beats und Groove A anfügt
- **THEN** endet der Song mit dem Segment „Intro“ aus einem Block mit 4 Takten 4/4, jeweils mit Groove A

#### Scenario: Segment ohne Groove
- **WHEN** der Nutzer ein Segment mit 2 Takten ohne Groove anfügt
- **THEN** haben beide Takte keinen Groove

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
Das System MUST einem Segment weitere Blöcke anfügen sowie Blöcke löschen können. In einem Block MUST es Takte am Ende anfügen, nach einem Takt einfügen und löschen können. Ein Block ohne Takte MUST entfernt werden, ein Segment ohne Blöcke MUST bestehen bleiben.

#### Scenario: Takt einfügen
- **WHEN** der Nutzer nach Takt 2 eines Blocks mit 4 Takten einen Takt einfügt
- **THEN** hat der Block 5 Takte und der neue Takt steht an Position 3 mit Länge und Groove von Takt 2

#### Scenario: Letzten Takt eines Blocks löschen
- **WHEN** der Nutzer den einzigen Takt eines Blocks löscht
- **THEN** ist der Block entfernt und das Segment bleibt bestehen

### Requirement: Takteigenschaften setzen
Der Nutzer MUST für einen oder mehrere ausgewählte Takte die Länge (1–16 Beats), den Groove (oder keinen) und den Fill (oder keinen) setzen können. Als Groove MUST nur ein Pattern vom Typ Groove, als Fill nur eines vom Typ Fill desselben Songs wählbar sein.

#### Scenario: Groove für Auswahl setzen
- **WHEN** der Nutzer die Takte 5 bis 8 auswählt und Groove B setzt
- **THEN** haben genau diese vier Takte Groove B

#### Scenario: Taktlänge ändern
- **WHEN** der Nutzer einen 4/4-Takt auf 2 Beats setzt
- **THEN** ist der Takt ein 2/4-Takt und alle anderen Takte bleiben unverändert

### Requirement: Platzhalter aus der Struktur anlegen
Beim Setzen eines Grooves oder Fills MUST der Nutzer ein neues Pattern mit Namen anlegen können, ohne den Struktur-Editor zu verlassen. Ein neuer Groove MUST 4 Beats lang und leer sein. Bei einem neuen Fill MUST der Nutzer die Länge (1–16 Beats) angeben, der Fill ist leer.

#### Scenario: Neuer Groove als Platzhalter
- **WHEN** der Nutzer beim Anlegen eines Segments als Groove „Verse-Beat (neu)“ eingibt
- **THEN** existiert im Song ein leerer Groove „Verse-Beat“ mit 4 Beats und die Takte verweisen darauf

#### Scenario: Neuer Fill als Platzhalter
- **WHEN** der Nutzer für Takt 8 einen neuen Fill „Tom-Run“ mit 2 Beats anlegt
- **THEN** existiert ein leerer Fill „Tom-Run“ mit 2 Beats und Takt 8 hat diesen Fill

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
