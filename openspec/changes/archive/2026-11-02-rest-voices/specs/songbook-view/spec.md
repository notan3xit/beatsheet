# Spec Delta

## MODIFIED Requirements

### Requirement: Patternseite
Die rechte Seite MUST jedes Pattern des Songs genau einmal mit Name, Farbe, Länge und Noten zeigen, Grooves vor Fills, jeweils in der Reihenfolge des ersten Auftretens in der Struktur, nicht verwendete Patterns danach alphabetisch. Ein leeres Pattern MUST als leeres System seiner Länge erscheinen, mit Pausen nach der Anforderung „Leeres Pattern“ der Notation.

#### Scenario: Reihenfolge
- **WHEN** die Struktur zuerst Groove B, dann Groove A verwendet und Groove C nicht verwendet wird
- **THEN** zeigt die rechte Seite B, A, C und danach die Fills

#### Scenario: Leerer Platzhalter
- **WHEN** der Groove „Verse-Beat“ mit 4 Beats noch keine Schläge hat
- **THEN** zeigt die rechte Seite „Verse-Beat“ mit einem leeren System und einer Ganzen Pause
