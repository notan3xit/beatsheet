# Spec Delta

## MODIFIED Requirements

### Requirement: Groove-Kennzeichnung im Takt
Ein Takt mit Groove MUST in der Farbe des Grooves erscheinen. Den Groove-Namen MUST er nur zeigen, wenn er der erste Takt seines Segments ist oder sein Groove sich gegenüber dem vorigen Takt des Segments ändert; sonst MUST der Name nur als Tooltip verfügbar sein. Ist der Groove länger als der Takt, MUST zusätzlich angezeigt werden, mit welchem Beat des Grooves der Takt beginnt. Ein Takt ohne Groove MUST neutral und ohne Namen erscheinen.

#### Scenario: Zweitaktiger Groove
- **WHEN** vier 4/4-Takte im selben Block Groove A mit 8 Beats haben
- **THEN** erscheinen alle vier Takte in der Farbe von A mit den Startbeats 1, 5, 1, 5
- **AND** nur der erste Takt zeigt den Namen „A“

#### Scenario: Eintaktiger Groove
- **WHEN** ein 4/4-Takt einen Groove mit 4 Beats hat
- **THEN** zeigt er nur den Groove-Namen ohne Startbeat

#### Scenario: Groove-Wechsel
- **WHEN** ein Segment die Takte A, A, B, B, A hat
- **THEN** zeigen nur der erste, dritte und fünfte Takt einen Namen: „A“, „B“, „A“

#### Scenario: Neues Segment
- **WHEN** das Segment „Verse“ mit Groove A endet und das Segment „Chorus“ mit Groove A beginnt
- **THEN** zeigt der erste Takt von „Chorus“ den Namen „A“

#### Scenario: Takt ohne Groove dazwischen
- **WHEN** ein Segment die Takte A, ohne Groove, A hat
- **THEN** zeigen der erste und der dritte Takt den Namen „A“

#### Scenario: Folgetakt mit Tooltip
- **WHEN** der zweite von zwei Takten mit Groove A keinen Namen zeigt
- **THEN** ist „A“ dort als Tooltip verfügbar
