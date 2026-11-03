# Spec Delta

## MODIFIED Requirements

### Requirement: Segment-Popover
Das Popover eines ausgewählten Segments MUST anbieten: den Namen ändern, das Segment nach oben oder unten verschieben, duplizieren, ein Segment danach einfügen, einen Block unten anfügen, das Segment nach Bestätigung löschen, ab dem Segment abspielen („Ab hier abspielen“) und das Segment in Schleife abspielen („In Schleife abspielen“). Nicht mögliche Verschiebungen MUST deaktiviert sein.

#### Scenario: Segment umbenennen
- **WHEN** der Nutzer das Segment „Verse“ auswählt, im Popover den Namen in „Strophe“ ändert und Enter drückt
- **THEN** heißt das Segment „Strophe“

#### Scenario: Erstes Segment nicht nach oben
- **WHEN** der Nutzer das erste Segment auswählt
- **THEN** ist im Popover „nach oben“ deaktiviert

#### Scenario: Abspielen im Segment-Popover
- **WHEN** der Nutzer das Segment „Chorus“ auswählt
- **THEN** bietet das Popover „Ab hier abspielen“ und „In Schleife abspielen“ an

### Requirement: Takt-Popover
Das Popover ausgewählter Takte MUST anbieten: den Groove und den Fill setzen, die Taktlänge um einen Beat verringern oder erhöhen, einen Takt davor oder danach einfügen, die Takte löschen, ab dem ersten ausgewählten Takt abspielen („Ab hier abspielen“) und die ausgewählten Takte in Schleife abspielen („In Schleife abspielen“). Bei genau einem ausgewählten Takt MUST es zusätzlich die Akzente des Takts bearbeiten lassen. Nicht mögliche Längenänderungen MUST deaktiviert sein.

#### Scenario: Akzente nur bei einem Takt
- **WHEN** der Nutzer die Takte 1 bis 2 auswählt
- **THEN** bietet das Popover Groove, Fill, Länge, Einfügen, Löschen und die beiden Abspiel-Aktionen an, aber keine Akzente

#### Scenario: Taktlänge an den Grenzen
- **WHEN** der Nutzer einen Takt mit 1 Beat auswählt
- **THEN** ist „Taktlänge verringern“ deaktiviert
