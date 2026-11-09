# Spec Delta

## ADDED Requirements

### Requirement: Länge im Pattern-Editor
Der Pattern-Editor MUST die Länge des Patterns als „<n> Beats“ bzw. „1 Beat“ zeigen. Entsperrt MUST dieselbe Angabe eine Auswahl der Längen 1 bis 16 öffnen und ohne Rahmen und Pfeil wie die Tempoangabe erscheinen, auf jedem Gerät mit dessen eigener Auswahlliste. Gesperrt und entsperrt MUST die Angabe nur die Breite ihres Texts belegen.

#### Scenario: Ohne Lücke
- **WHEN** der Nutzer einen gesperrten Groove mit 6 Beats ansieht
- **THEN** folgt auf „6 Beats“ das Taktart-Symbol im üblichen Abstand der Kopfzeile, ohne zusätzlichen Leerraum

#### Scenario: Länge wählen
- **WHEN** der Nutzer im entsperrten Song die Angabe „4 Beats“ öffnet und „6 Beats“ wählt
- **THEN** hat das Pattern 6 Beats und die Angabe lautet „6 Beats“
