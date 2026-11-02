# Spec Delta

## MODIFIED Requirements

### Requirement: Fill-Blöcke
Ein Fill MUST als durchgehender Block in seiner Farbe über genau den Beats erscheinen, die er überdeckt, mit seiner Kurzschrift und seinem Namen als Tooltip. Der überdeckte Teil eines Grooves entfällt. Der Fill-Block MUST keine Noten zeigen. Taktstriche innerhalb eines Fill-Blocks MUST dezent sichtbar bleiben. Fällt ein Fill über einen Zeilenumbruch, MUST er an der Zeilengrenze geteilt und als fortgesetzt gekennzeichnet werden.

#### Scenario: Kurzer Fill
- **WHEN** Takt 4 (4/4) einen Fill mit 1 Beat hat
- **THEN** zeigt Takt 4 den Groove über 3 Beats und rechts einen Fill-Block über 1 Beat mit seiner Kurzschrift, ohne Noten
- **AND** der Name des Fills ist als Tooltip verfügbar, aber nicht als Text sichtbar

#### Scenario: Fill über Taktgrenze
- **WHEN** ein Fill mit 6 Beats am Ende von Takt 4 endet
- **THEN** reicht ein Fill-Block von Beat 3 in Takt 3 bis zum Ende von Takt 4, mit dezentem Taktstrich dazwischen

#### Scenario: Fill über Zeilenumbruch
- **WHEN** ein Fill mit 8 Beats am Ende von Takt 5 endet und Takt 4 am Zeilenende steht
- **THEN** erscheint der Fill am Ende der ersten Zeile und am Anfang der zweiten Zeile, jeweils als Fortsetzung gekennzeichnet
- **AND** jeder Teil zeigt die Kurzschrift seines Zeitraums

## ADDED Requirements

### Requirement: Fill-Kurzschrift
Die Kurzschrift MUST jeden Schlag an seinem Zeitpunkt als Buchstabe in einer von drei Höhenstufen zeigen: oben `'` Crash und `t` Tom 1/2, Mitte `v` Snare mit Flam und `s` Snare, unten `f` Floor Tom und `k` Kick. Hi-Hat, Ride, Hi-Hat-Pedal und Ghost Notes MUST entfallen. Pro Zeitpunkt und Stufe MUST höchstens ein Buchstabe stehen, mit Vorrang `'` vor `t`, `v` vor `s`, `f` vor `k`.

#### Scenario: Tom-Run
- **WHEN** ein Fill in Sechzehnteln Snare auf 1 und 2, Tom 1 auf 3 und 4 und im zweiten Beat Floor Tom auf allen vier Positionen hat
- **THEN** zeigt die Kurzschrift `s s` in der Mitte, `t t` oben und `f f f f` unten, jeweils an ihren Zeitpunkten

#### Scenario: Gleichzeitige Schläge
- **WHEN** auf derselben Position Kick und Crash liegen
- **THEN** stehen dort `'` oben und `k` unten

#### Scenario: Flam und Ghost Note
- **WHEN** ein Fill einen Snare-Flam auf Position 1 und eine Snare-Ghost-Note auf Position 2 hat
- **THEN** zeigt die Kurzschrift `v` auf Position 1 und auf Position 2 nichts

#### Scenario: Hi-Hat entfällt
- **WHEN** ein Fill nur Hi-Hat-Schläge hat
- **THEN** zeigt die Kurzschrift keinen Buchstaben
