# Spec Delta

## ADDED Requirements

### Requirement: Notenbild in der Textfarbe des Farbschemas
Das Notenbild MUST alle Elemente (Notenlinien, Taktstriche, Schlüssel, Notenköpfe, Hälse, Balken, Pausen, Punkte, Triolenklammern und -ziffern, „o“ der offenen Hi-Hat) in der Textfarbe des aktiven Farbschemas zeichnen. Es MUST keine fest vorgegebene Farbe wie Schwarz verwenden.

#### Scenario: Notenbild im Dunkelmodus
- **WHEN** ein Pattern mit Triole und offener Hi-Hat bei dunkler Systemeinstellung dargestellt wird
- **THEN** sind alle Elemente des Notenbilds in Mocha „text“ gezeichnet und auf dem dunklen Hintergrund lesbar

#### Scenario: Keine fest vorgegebene Farbe
- **WHEN** ein beliebiges Pattern dargestellt wird
- **THEN** enthält das Notenbild keine fest vorgegebene Füll- oder Linienfarbe, sondern übernimmt die Textfarbe der Umgebung
