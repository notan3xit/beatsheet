# Spec Delta

## MODIFIED Requirements

### Requirement: Anordnung im Kopf
Die Köpfe von Doppelseite und Pattern-Editor MUST Song-Tempo, Abspiel-Knöpfe und Übetempo (`practice-tempo`) in dieser Reihenfolge zeigen, den Knopf für einen Durchlauf vor dem für die Schleife.

#### Scenario: Pattern-Editor
- **WHEN** der Nutzer den Pattern-Editor ansieht
- **THEN** folgen im Kopf „♩ = 120 (Song-Tempo)“, „Einmal abspielen“, „In Schleife abspielen“ und „Tempo“ in dieser Reihenfolge

#### Scenario: Doppelseite
- **WHEN** der Nutzer die Doppelseite ansieht
- **THEN** folgen im Kopf „♩ = 120“, „Song abspielen“, „Song in Schleife abspielen“ und „Tempo“ in dieser Reihenfolge
