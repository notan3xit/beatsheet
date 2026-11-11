# Spec Delta

## ADDED Requirements

### Requirement: Einladen-Formular steht fest
Im Formular „Hinzufügen“ MUST das Feld „Mail-Adresse“ und der Knopf „Einladen“ gleich hoch auf einer Linie stehen. Der Knopf MUST seine Lage behalten, solange das Popover offen ist und sich sein Inhalt nicht ändert.

#### Scenario: Feld und Knopf auf einer Linie
- **WHEN** der Besitzer die Mitglieder von „Band“ öffnet
- **THEN** haben das Feld „Mail-Adresse“ und der Knopf „Einladen“ dieselbe Ober- und Unterkante

#### Scenario: Knopf bleibt stehen
- **GIVEN** der Besitzer hat die Mitglieder von „Band“ geöffnet
- **WHEN** drei Sekunden vergehen, ohne dass er etwas eingibt
- **THEN** steht „Einladen“ an derselben Stelle wie direkt nach dem Öffnen

### Requirement: Kürzel beim Überfahren
Beim Überfahren MUST jedes Kürzel im Kopf eines Workbooks seine Fläche behalten, mit und ohne Profil.

#### Scenario: Überfahren der Kürzel
- **GIVEN** „Band“ hat die Mitglieder anna@example.com mit Profil und ben@example.com ohne Profil
- **WHEN** der Nutzer die Kürzel im Kopf von „Band“ überfährt
- **THEN** behalten das farbige Kürzel von Anna und das graue von Ben ihre Fläche
