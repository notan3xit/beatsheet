# Spec Delta

## MODIFIED Requirements

### Requirement: Tempo im Pattern-Editor
Der Pattern-Editor MUST das Tempo des Songs in BPM neben der Abspiel-Taste zeigen und ändern lassen. Das Feld MUST als „Song-Tempo (BPM)“ beschriftet sein, und ein Hinweis am Feld MUST nennen, dass es für alle Patterns des Songs gilt, mit dem Songtitel. Eine Änderung MUST für alle Patterns des Songs gelten und eine laufende Wiedergabe ab dem nächsten Schlag im neuen Tempo fortsetzen. Ein ungültiger Wert MUST abgelehnt werden; das Feld zeigt dann wieder das bisherige Tempo.

#### Scenario: Tempo ändern
- **WHEN** der Nutzer im Pattern-Editor das Tempo von 120 auf 90 BPM ändert
- **THEN** zeigt das Tempo-Feld 90
- **AND** im Pattern-Editor eines anderen Patterns desselben Songs steht ebenfalls 90

#### Scenario: Kennzeichnung als Song-Tempo
- **WHEN** der Nutzer im Song „Hysteria“ den Pattern-Editor des Grooves „Verse“ öffnet
- **THEN** heißt das Feld „Song-Tempo (BPM)“
- **AND** der Hinweis am Feld lautet „gilt für alle Patterns von „Hysteria““

#### Scenario: Tempo während der Wiedergabe
- **WHEN** die Wiedergabe läuft und der Nutzer das Tempo ändert
- **THEN** läuft die Wiedergabe ohne Neustart im neuen Tempo weiter

#### Scenario: Ungültiges Tempo
- **WHEN** der Nutzer als Tempo 0 eingibt
- **THEN** zeigt das Feld wieder das bisherige Tempo und der Song bleibt unverändert
