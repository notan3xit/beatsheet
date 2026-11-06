# Spec Delta

## MODIFIED Requirements

### Requirement: Fill-Kurzschrift
Die Kurzschrift MUST jeden Schlag an seinem Zeitpunkt als Zeichen in einer von drei Höhenstufen zeigen: oben `c` Crash, `t` Tom 1/2, `o` offene Hi-Hat, `x` geschlossene Hi-Hat, `r` Ride und `b` Ride-Glocke; Mitte `v` Snare mit Flam und `s` Snare einschließlich Drag, Rim Shot und Cross-Stick; unten `f` Floor Tom, `k` Kick und `x` Hi-Hat-Pedal. Eine Ghost Note MUST als `·` auf der Stufe ihres Instruments stehen. Choke und Betonung MUST das Zeichen nicht ändern. Pro Zeitpunkt und Stufe MUST höchstens ein Zeichen stehen: Normale Schläge haben Vorrang vor Ghost Notes, untereinander gilt die genannte Reihenfolge.

#### Scenario: Tom-Run
- **WHEN** ein Fill in Sechzehnteln Snare auf 1 und 2, Tom 1 auf 3 und 4 und im zweiten Beat Floor Tom auf allen vier Positionen hat
- **THEN** zeigt die Kurzschrift `s s` in der Mitte, `t t` oben und `f f f f` unten, jeweils an ihren Zeitpunkten

#### Scenario: Gleichzeitige Schläge
- **WHEN** auf derselben Position Kick und Crash liegen
- **THEN** stehen dort `c` oben und `k` unten

#### Scenario: Flam und Ghost Note
- **WHEN** ein Fill einen Snare-Flam auf Position 1 und eine Snare-Ghost-Note auf Position 2 hat
- **THEN** zeigt die Kurzschrift `v` auf Position 1 und `·` in der Mitte auf Position 2

#### Scenario: Ghost Note auf den Toms
- **WHEN** ein Fill auf Position 1 eine Ghost Note auf Tom 1 und auf Position 2 eine Ghost Note auf dem Floor Tom hat
- **THEN** steht auf Position 1 `·` oben und auf Position 2 `·` unten

#### Scenario: Neue Spielweisen der Snare
- **WHEN** ein Fill auf den Positionen 1, 2 und 3 einen Snare-Drag, einen Rim Shot und einen Cross-Stick hat
- **THEN** zeigt die Kurzschrift `s s s` in der Mitte

#### Scenario: Flam auf einem Tom
- **WHEN** ein Fill einen Flam auf Tom 1 hat
- **THEN** zeigt die Kurzschrift `t` oben

#### Scenario: Choke und Betonung
- **WHEN** ein Fill einen Crash mit Choke und auf derselben Position eine betonte Snare hat
- **THEN** stehen dort `c` oben und `s` in der Mitte

#### Scenario: Hi-Hat und Pedal
- **WHEN** ein Fill auf Position 1 eine geschlossene Hi-Hat, auf Position 2 eine offene Hi-Hat und auf Position 3 das Hi-Hat-Pedal hat
- **THEN** zeigt die Kurzschrift `x` und `o` oben und `x` unten, jeweils an ihren Zeitpunkten

#### Scenario: Ride und Glocke
- **WHEN** ein Fill auf Position 1 einen Ride und auf Position 2 eine Ride-Glocke hat
- **THEN** zeigt die Kurzschrift oben `r` und `b`

#### Scenario: Crash verdrängt die übrigen Becken
- **WHEN** auf derselben Position Crash, Hi-Hat und Ride liegen
- **THEN** steht dort oben nur `c`

#### Scenario: Hi-Hat entfällt
- **WHEN** auf derselben Position Tom 1 und Hi-Hat liegen
- **THEN** steht dort oben nur `t`

#### Scenario: Floor Tom vor Kick vor Pedal
- **WHEN** auf einer Position Floor Tom und Kick liegen und auf einer zweiten Kick und Hi-Hat-Pedal
- **THEN** steht unten auf der ersten `f` und auf der zweiten `k`

#### Scenario: Normaler Schlag vor Ghost Note
- **WHEN** auf einer Position eine Ghost Note auf dem Floor Tom und Kick liegen und auf einer zweiten eine Ghost Note auf Tom 1 und Hi-Hat
- **THEN** steht auf der ersten unten `k` und auf der zweiten oben `x`
