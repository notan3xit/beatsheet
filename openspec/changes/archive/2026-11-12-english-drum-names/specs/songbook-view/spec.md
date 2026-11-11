# Spec Delta

## MODIFIED Requirements

### Requirement: Akzent-Markierungen
Akzente MUST als Markierungen mit dem Kürzel des Instruments erscheinen, ohne Groove- oder Fill-Darstellung zu verdecken. Je Beat MUST höchstens eine Markierung über dem Takt für Hand-Instrumente und eine unter dem Takt für Kick Drum und Hi-Hat-Pedal stehen. Oben MUST das höchste, unten das niedrigste Instrument des Beats gezeigt werden, nach der Reihenfolge der Sequencer-Zeilen. Die Markierung MUST an der Position des gezeigten Akzents stehen.

#### Scenario: Crash auf der Eins
- **WHEN** Takt 1 einen Crash-Akzent auf Beat 1, Position 1 hat
- **THEN** zeigt Takt 1 am linken Rand oben die Markierung „Cr“

#### Scenario: Hand und Fuß auf demselben Schlag
- **WHEN** Takt 1 auf Beat 1, Position 1 einen Crash- und einen Kick-Drum-Akzent hat
- **THEN** zeigt Takt 1 am linken Rand oben „Cr“ und unten „K“

#### Scenario: Mehrere Hand-Akzente in einem Beat
- **WHEN** Takt 1 auf Beat 2 einen Snare-Akzent auf Position 1 und einen Crash-Akzent auf Position 3 hat
- **THEN** zeigt Takt 1 auf Beat 2 oben nur „Cr“, an Position 3

#### Scenario: Mehrere Fuß-Akzente in einem Beat
- **WHEN** Takt 1 auf Beat 1, Position 1 einen Kick-Drum- und einen Hi-Hat-Pedal-Akzent hat
- **THEN** zeigt Takt 1 auf Beat 1 unten nur „HP“ und oben keine Markierung

#### Scenario: Verschiedene Beats
- **WHEN** Takt 1 einen Crash-Akzent auf Beat 1 und einen Ride-Akzent auf Beat 2 hat
- **THEN** zeigt Takt 1 oben „Cr“ auf Beat 1 und „Ri“ auf Beat 2

#### Scenario: Verdeckte Akzente bleiben erhalten
- **GIVEN** Takt 1 hat auf Beat 2 einen Snare- und einen Crash-Akzent
- **WHEN** der Nutzer Takt 1 auswählt
- **THEN** listet das Takt-Popover beide Akzente

### Requirement: Höhe des Notenbilds der Pattern-Karte
Die Höhe des Notenbilds einer Pattern-Karte MUST seinen sichtbaren Zeichen folgen: Kein Zeichen MUST abgeschnitten sein, und über dem obersten wie unter dem untersten Zeichen MUST nur ein schmaler Rand bleiben.

#### Scenario: Balken unter dem System
- **WHEN** die rechte Seite einen Groove mit Sechzehnteln auf der Kick Drum zeigt, deren Balken unter dem System liegen
- **THEN** sind Hälse und Balken in der Karte vollständig zu sehen

#### Scenario: Triolenklammer oben
- **WHEN** die rechte Seite einen Fill mit Sextolen auf Snare und Toms zeigt
- **THEN** liegt über der Triolenklammer mit „6“ nur der schmale Rand

### Requirement: Fill-Kurzschrift
Die Kurzschrift MUST jeden Schlag an seinem Zeitpunkt als Zeichen in einer von drei Höhenstufen zeigen: oben `c` Crash, `t` Tom 1/2, `o` offene Hi-Hat, `x` geschlossene Hi-Hat, `r` Ride und `b` Ride-Bell; Mitte `v` Snare mit Flam und `s` Snare einschließlich Drag, Rim Shot und Cross-Stick; unten `f` Floor Tom, `k` Kick Drum und `x` Hi-Hat-Pedal.

#### Scenario: Tom-Run
- **WHEN** ein Fill in Sechzehnteln Snare auf 1 und 2, Tom 1 auf 3 und 4 und im zweiten Beat Floor Tom auf allen vier Positionen hat
- **THEN** zeigt die Kurzschrift `s s` in der Mitte, `t t` oben und `f f f f` unten, jeweils an ihren Zeitpunkten

#### Scenario: Gleichzeitige Schläge
- **WHEN** auf derselben Position Kick Drum und Crash liegen
- **THEN** stehen dort `c` oben und `k` unten

#### Scenario: Neue Spielweisen der Snare
- **WHEN** ein Fill auf den Positionen 1, 2 und 3 einen Snare-Drag, einen Rim Shot und einen Cross-Stick hat
- **THEN** zeigt die Kurzschrift `s s s` in der Mitte

#### Scenario: Flam auf einem Tom
- **WHEN** ein Fill einen Flam auf Tom 1 hat
- **THEN** zeigt die Kurzschrift `t` oben

#### Scenario: Hi-Hat und Pedal
- **WHEN** ein Fill auf Position 1 eine geschlossene Hi-Hat, auf Position 2 eine offene Hi-Hat und auf Position 3 das Hi-Hat-Pedal hat
- **THEN** zeigt die Kurzschrift `x` und `o` oben und `x` unten, jeweils an ihren Zeitpunkten

#### Scenario: Ride und Bell
- **WHEN** ein Fill auf Position 1 einen Ride und auf Position 2 eine Ride-Bell hat
- **THEN** zeigt die Kurzschrift oben `r` und `b`

### Requirement: Vorrang in der Fill-Kurzschrift
Pro Zeitpunkt und Stufe MUST höchstens ein Zeichen stehen: Normale Schläge haben Vorrang vor Ghost Notes, untereinander gilt die genannte Reihenfolge.

#### Scenario: Crash verdrängt die übrigen Becken
- **WHEN** auf derselben Position Crash, Hi-Hat und Ride liegen
- **THEN** steht dort oben nur `c`

#### Scenario: Hi-Hat entfällt
- **WHEN** auf derselben Position Tom 1 und Hi-Hat liegen
- **THEN** steht dort oben nur `t`

#### Scenario: Floor Tom vor Kick vor Pedal
- **WHEN** auf einer Position Floor Tom und Kick Drum liegen und auf einer zweiten Kick Drum und Hi-Hat-Pedal
- **THEN** steht unten auf der ersten `f` und auf der zweiten `k`

#### Scenario: Normaler Schlag vor Ghost Note
- **WHEN** auf einer Position eine Ghost Note auf der Floor Tom und Kick Drum liegen und auf einer zweiten eine Ghost Note auf Tom 1 und Hi-Hat
- **THEN** steht auf der ersten unten `k` und auf der zweiten oben `x`
