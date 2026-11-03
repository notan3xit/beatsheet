# Spec Delta

## ADDED Requirements

### Requirement: Song-Tempo
Jeder Song MUST ein Tempo in BPM haben, eine ganze Zahl von 30 bis 300. Ein neuer Song und ein Song, für den kein Tempo gespeichert ist, MUST das Tempo 120 haben. Ein Tempo außerhalb des Bereichs oder keine ganze Zahl MUST abgelehnt werden; das bisherige Tempo bleibt dann erhalten. Eine Änderung des Tempos MUST die Revision des Songs um 1 erhöhen.

#### Scenario: Tempo eines neuen Songs
- **WHEN** der Nutzer einen Song anlegt
- **THEN** hat der Song das Tempo 120

#### Scenario: Tempo ändern
- **WHEN** der Nutzer das Tempo eines Songs mit Revision 4 von 120 auf 140 ändert
- **THEN** hat der Song das Tempo 140 und Revision 5

#### Scenario: Tempo außerhalb des Bereichs
- **WHEN** der Nutzer das Tempo auf 301 oder auf 29 setzt
- **THEN** bleibt das bisherige Tempo erhalten und die Revision des Songs unverändert

#### Scenario: Gleiches Tempo
- **WHEN** der Nutzer das Tempo auf den Wert setzt, den der Song bereits hat
- **THEN** bleibt die Revision des Songs unverändert
