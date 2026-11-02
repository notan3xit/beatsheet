# Spec Delta

## MODIFIED Requirements

### Requirement: Notenwerte und Pausen aus dem Raster
Notenwerte MUST sich aus der Unterteilung des Beats und dem Abstand zum nächsten Schlag derselben Stimme im selben Beat ergeben. Lücken vor dem ersten Schlag einer Stimme im Beat MUST durch Pausen gefüllt werden. Hat eine Stimme in einem Takt keinen Schlag, MUST sie dort keine Pausen zeigen. Sonst MUST ein leerer Beat eine Viertelpause zeigen; in einem 4-Beat-Takt MUST stattdessen eine Halbe Pause stehen, wenn die Beats 1 und 2 oder 3 und 4 leer sind.

#### Scenario: Achtel aus Sechzehntel-Raster
- **WHEN** ein Beat in Sechzehnteln Hi-Hat-Schläge auf den Positionen 1 und 3 hat
- **THEN** erscheinen in der oberen Stimme zwei Achtelnoten

#### Scenario: Pause vor Offbeat
- **WHEN** ein Beat in Sechzehnteln einen Snare-Schlag nur auf Position 3 hat
- **THEN** zeigt die obere Stimme eine Achtelpause gefolgt von einer Achtelnote

#### Scenario: Leerer Beat für die Füße
- **WHEN** ein 4-Beat-Takt Bassdrum nur auf Beat 1 und Beat 3 hat
- **THEN** zeigt die untere Stimme auf Beat 2 und Beat 4 je eine Viertelpause

#### Scenario: Stimme ohne Schläge im Takt
- **WHEN** ein 4-Beat-Takt Hi-Hat-Achtel und keine Bassdrum- oder Hi-Hat-Pedal-Schläge hat
- **THEN** zeigt die untere Stimme in diesem Takt keine Pausen

#### Scenario: Halbe Pause
- **WHEN** ein 4-Beat-Takt Bassdrum nur auf Beat 3 und Beat 4 hat
- **THEN** zeigt die untere Stimme auf Beat 1 eine Halbe Pause

#### Scenario: Taktmitte bleibt sichtbar
- **WHEN** ein 4-Beat-Takt Bassdrum nur auf Beat 1 und Beat 4 hat
- **THEN** zeigt die untere Stimme auf Beat 2 und Beat 3 je eine Viertelpause

#### Scenario: Unvollständiger Takt
- **WHEN** ein Groove mit 6 Beats im zweiten Takt Bassdrum nur auf Beat 6 hat
- **THEN** zeigt die untere Stimme im zweiten Takt auf Beat 5 eine Viertelpause

### Requirement: Leeres Pattern
Ein Takt ohne Schläge in beiden Stimmen MUST nur in der oberen Stimme Pausen zeigen: in einem 4-Beat-Takt eine Ganze Pause mittig im Takt, in einem unvollständigen Takt eine Viertelpause pro Beat. Die untere Stimme MUST dort keine Pausen zeigen.

#### Scenario: Neuer Groove
- **WHEN** ein neu angelegter, leerer Groove mit 4 Beats dargestellt wird
- **THEN** zeigt die obere Stimme eine Ganze Pause und die untere Stimme keine Pause

#### Scenario: Leerer kurzer Fill
- **WHEN** ein leerer Fill mit 2 Beats dargestellt wird
- **THEN** zeigt die obere Stimme zwei Viertelpausen und die untere Stimme keine Pause
