# Spec Delta

## ADDED Requirements

### Requirement: Höhe des Notenbilds der Pattern-Karte
Die Höhe des Notenbilds einer Pattern-Karte MUST seinen sichtbaren Zeichen folgen: Kein Zeichen MUST abgeschnitten sein, und über dem obersten wie unter dem untersten Zeichen MUST nur ein schmaler Rand bleiben.

#### Scenario: Balken unter dem System
- **WHEN** die rechte Seite einen Groove mit Sechzehnteln auf der Bassdrum zeigt, deren Balken unter dem System liegen
- **THEN** sind Hälse und Balken in der Karte vollständig zu sehen

#### Scenario: Triolenklammer oben
- **WHEN** die rechte Seite einen Fill mit Sextolen auf Snare und Toms zeigt
- **THEN** liegt über der Triolenklammer mit „6“ nur der schmale Rand
