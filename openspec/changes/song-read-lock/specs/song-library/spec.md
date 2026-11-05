# Spec Delta

## MODIFIED Requirements

### Requirement: Tempo auf der Doppelseite
Die Doppelseite MUST im Kopf neben dem Songtitel das Tempo des Songs als Tempoangabe „♩ = <BPM>“ zeigen. Ein Klick auf die Angabe MUST sie in ein Zahlenfeld mit dem aktuellen Tempo verwandeln. Enter oder Verlassen des Felds MUST das Tempo übernehmen, Escape MUST die Eingabe verwerfen. Danach MUST wieder die Tempoangabe erscheinen. Ein abgelehntes Tempo MUST das bisherige stehen lassen. „♩ =“ MUST dabei stehen bleiben, und das Feld MUST genau den Platz der Zahl einnehmen, sodass sich nichts daneben verschiebt.

#### Scenario: Tempoangabe
- **WHEN** der Nutzer die Doppelseite eines Songs mit Tempo 120 öffnet
- **THEN** steht neben dem Songtitel „♩ = 120“

#### Scenario: Tempo auf der Doppelseite ändern
- **WHEN** der Nutzer auf „♩ = 120“ klickt, 96 eingibt und Enter drückt
- **THEN** steht neben dem Songtitel „♩ = 96“ und der Song hat das Tempo 96
- **AND** der Pattern-Editor jedes Patterns des Songs zeigt das Song-Tempo 96

#### Scenario: Eingabe verwerfen
- **WHEN** der Nutzer auf „♩ = 120“ klickt, 96 eingibt und Escape drückt
- **THEN** steht weiterhin „♩ = 120“ und der Song ist unverändert

#### Scenario: Ungültiges Tempo auf der Doppelseite
- **WHEN** der Nutzer auf „♩ = 120“ klickt, 0 eingibt und das Feld verlässt
- **THEN** steht weiterhin „♩ = 120“ und der Song ist unverändert

#### Scenario: Platz beim Bearbeiten
- **WHEN** der Nutzer auf „♩ = 120“ klickt
- **THEN** steht weiterhin „♩ =“ da, nur die Zahl ist ein Eingabefeld ohne Pfeil-Knöpfe
- **AND** alles neben der Angabe bleibt an seiner Stelle
