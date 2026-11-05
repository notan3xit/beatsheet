# Spec Delta

## MODIFIED Requirements

### Requirement: Tempo im Pattern-Editor
Der Pattern-Editor MUST das Tempo des Songs neben der Abspiel-Taste als „♩ = <BPM> (Song-Tempo)“ zeigen und ändern lassen. Die Angabe MUST sich wie die Tempoangabe auf der Doppelseite bedienen lassen. Eine Änderung MUST für alle Patterns des Songs gelten und eine laufende Wiedergabe ab dem nächsten Schlag im neuen Tempo fortsetzen. Ein ungültiger Wert MUST abgelehnt werden; die Angabe zeigt dann wieder das bisherige Tempo.

#### Scenario: Tempo ändern
- **WHEN** der Nutzer im Pattern-Editor das Tempo von 120 auf 90 BPM ändert
- **THEN** steht dort „♩ = 90 (Song-Tempo)“
- **AND** im Pattern-Editor eines anderen Patterns desselben Songs steht ebenfalls „♩ = 90 (Song-Tempo)“

#### Scenario: Kennzeichnung als Song-Tempo
- **WHEN** der Nutzer im Song „Hysteria“ den Pattern-Editor des Grooves „Verse“ öffnet
- **THEN** steht neben der Abspiel-Taste „♩ = 120 (Song-Tempo)“

#### Scenario: Eingabe verwerfen
- **WHEN** der Nutzer im Pattern-Editor auf „♩ = 120“ klickt, 96 eingibt und Escape drückt
- **THEN** steht weiterhin „♩ = 120 (Song-Tempo)“ und der Song ist unverändert

#### Scenario: Tempo während der Wiedergabe
- **WHEN** die Wiedergabe läuft und der Nutzer das Tempo ändert
- **THEN** läuft die Wiedergabe ohne Neustart im neuen Tempo weiter

#### Scenario: Ungültiges Tempo
- **WHEN** der Nutzer als Tempo 0 eingibt
- **THEN** zeigt die Angabe wieder das bisherige Tempo und der Song bleibt unverändert
