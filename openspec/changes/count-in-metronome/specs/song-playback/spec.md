# Spec Delta

## MODIFIED Requirements

### Requirement: Kopfknöpfe spielen die Auswahl
Sind auf der Doppelseite Takte oder ein Segment ausgewählt und läuft keine Wiedergabe, MUST der Kopf statt „Song abspielen“ den Knopf „Ab Auswahl abspielen“ und statt „Song in Schleife abspielen“ den Knopf „Auswahl in Schleife abspielen“ zeigen. Sie MUST wie „Ab hier abspielen“ bzw. „In Schleife abspielen“ im Popover der Auswahl wirken und wie diese das Popover schließen und die Auswahl bestehen lassen. Ohne Auswahl MUST der Kopf wieder den ganzen Song abspielen.

#### Scenario: Ab Auswahl
- **WHEN** in einem Song mit 4 Takten die Takte 2 bis 3 ausgewählt sind und der Nutzer im Kopf „Ab Auswahl abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang von Takt 2 und endet nach Takt 4

#### Scenario: Auswahl in Schleife
- **WHEN** die Takte 2 bis 3 ausgewählt sind und der Nutzer im Kopf „Auswahl in Schleife abspielen“ wählt
- **THEN** laufen die Takte 2 bis 3 in Schleife, kein Popover ist geöffnet und die Takte 2 bis 3 sind ausgewählt

#### Scenario: Segment ausgewählt
- **WHEN** das Segment „Chorus“ ausgewählt ist und der Nutzer im Kopf „Auswahl in Schleife abspielen“ wählt
- **THEN** laufen die Takte von „Chorus“ in Schleife

#### Scenario: Üben vor dem Start
- **WHEN** die Takte 2 bis 3 ausgewählt sind, der Nutzer „Tempo“ einschaltet und dann „Auswahl in Schleife abspielen“ wählt
- **THEN** laufen die Takte 2 bis 3 im Übetempo in Schleife

#### Scenario: Ohne Auswahl
- **WHEN** nichts ausgewählt ist
- **THEN** zeigt der Kopf „Song abspielen“ und „Song in Schleife abspielen“
