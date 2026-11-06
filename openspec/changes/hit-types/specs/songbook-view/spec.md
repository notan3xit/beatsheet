# Spec Delta

## MODIFIED Requirements

### Requirement: Fill-Kurzschrift
Die Kurzschrift MUST jeden Schlag an seinem Zeitpunkt als Buchstabe in einer von drei Höhenstufen zeigen: oben `'` Crash und `t` Tom 1/2, Mitte `v` Snare mit Flam und `s` Snare einschließlich Drag, Rim Shot und Cross-Stick, unten `f` Floor Tom und `k` Kick. Hi-Hat, Ride, Hi-Hat-Pedal und Ghost Notes MUST entfallen. Choke und Betonung MUST den Buchstaben nicht ändern. Pro Zeitpunkt und Stufe MUST höchstens ein Buchstabe stehen, mit Vorrang `'` vor `t`, `v` vor `s`, `f` vor `k`.

#### Scenario: Tom-Run
- **WHEN** ein Fill in Sechzehnteln Snare auf 1 und 2, Tom 1 auf 3 und 4 und im zweiten Beat Floor Tom auf allen vier Positionen hat
- **THEN** zeigt die Kurzschrift `s s` in der Mitte, `t t` oben und `f f f f` unten, jeweils an ihren Zeitpunkten

#### Scenario: Gleichzeitige Schläge
- **WHEN** auf derselben Position Kick und Crash liegen
- **THEN** stehen dort `'` oben und `k` unten

#### Scenario: Flam und Ghost Note
- **WHEN** ein Fill einen Snare-Flam auf Position 1 und eine Snare-Ghost-Note auf Position 2 hat
- **THEN** zeigt die Kurzschrift `v` auf Position 1 und auf Position 2 nichts

#### Scenario: Neue Spielweisen der Snare
- **WHEN** ein Fill auf den Positionen 1, 2 und 3 einen Snare-Drag, einen Rim Shot und einen Cross-Stick hat
- **THEN** zeigt die Kurzschrift `s s s` in der Mitte

#### Scenario: Choke und Betonung
- **WHEN** ein Fill einen Crash mit Choke und auf derselben Position eine betonte Snare hat
- **THEN** stehen dort `'` oben und `s` in der Mitte

#### Scenario: Hi-Hat entfällt
- **WHEN** ein Fill nur Hi-Hat-Schläge hat
- **THEN** zeigt die Kurzschrift keinen Buchstaben
