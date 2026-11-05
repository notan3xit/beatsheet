# Spec Delta

## ADDED Requirements

### Requirement: Platz beim Bearbeiten der Tempoangabe
Beim Bearbeiten der Tempoangabe MUST „♩ =“ stehen bleiben, und das Feld MUST genau den Platz der Zahl einnehmen, sodass sich nichts daneben verschiebt.

#### Scenario: Platz beim Bearbeiten
- **WHEN** der Nutzer auf „♩ = 120“ klickt
- **THEN** steht weiterhin „♩ =“ da, nur die Zahl ist ein Eingabefeld ohne Pfeil-Knöpfe
- **AND** alles neben der Angabe bleibt an seiner Stelle
