## MODIFIED Requirements

### Requirement: Akzent-Markierungen
Akzente MUST als Markierungen mit dem Kürzel des Instruments erscheinen, ohne Groove- oder Fill-Darstellung zu verdecken. Je Beat MUST höchstens eine Markierung über dem Takt für Hand-Instrumente und eine unter dem Takt für Bassdrum und Hi-Hat-Pedal stehen. Oben MUST das höchste, unten das niedrigste Instrument des Beats gezeigt werden, nach der Reihenfolge der Sequencer-Zeilen. Die Markierung MUST an der Position des gezeigten Akzents stehen.

#### Scenario: Crash auf der Eins
- **WHEN** Takt 1 einen Crash-Akzent auf Beat 1, Position 1 hat
- **THEN** zeigt Takt 1 am linken Rand oben die Markierung „Cr“

#### Scenario: Hand und Fuß auf demselben Schlag
- **WHEN** Takt 1 auf Beat 1, Position 1 einen Crash- und einen Bassdrum-Akzent hat
- **THEN** zeigt Takt 1 am linken Rand oben „Cr“ und unten „BD“

#### Scenario: Mehrere Hand-Akzente in einem Beat
- **WHEN** Takt 1 auf Beat 2 einen Snare-Akzent auf Position 1 und einen Crash-Akzent auf Position 3 hat
- **THEN** zeigt Takt 1 auf Beat 2 oben nur „Cr“, an Position 3

#### Scenario: Mehrere Fuß-Akzente in einem Beat
- **WHEN** Takt 1 auf Beat 1, Position 1 einen Bassdrum- und einen Hi-Hat-Pedal-Akzent hat
- **THEN** zeigt Takt 1 auf Beat 1 unten nur „HP“ und oben keine Markierung

#### Scenario: Verschiedene Beats
- **WHEN** Takt 1 einen Crash-Akzent auf Beat 1 und einen Ride-Akzent auf Beat 2 hat
- **THEN** zeigt Takt 1 oben „Cr“ auf Beat 1 und „Ri“ auf Beat 2

#### Scenario: Verdeckte Akzente bleiben erhalten
- **GIVEN** Takt 1 hat auf Beat 2 einen Snare- und einen Crash-Akzent
- **WHEN** der Nutzer Takt 1 auswählt
- **THEN** listet das Takt-Popover beide Akzente
