# Spec Delta

## MODIFIED Requirements

### Requirement: Abmelden mit Workbook-Songs
Beim Abmelden MUST die App noch nicht übertragene Änderungen an Workbook-Songs übertragen und die Workbook-Songs danach vom Gerät entfernen. Können Änderungen nicht übertragen werden, MUST die App vor dem Abmelden nachfragen und darauf hinweisen, dass sie verloren gehen. Für eigene Songs gilt `account-songs`.

#### Scenario: Abmelden
- **WHEN** der Nutzer sich abmeldet
- **THEN** zeigt die Startseite keine Workbook-Karten mehr

#### Scenario: Abmelden mit nicht übertragenen Änderungen
- **GIVEN** der Nutzer hat „Intro“ aus „Band“ offline geändert
- **WHEN** er sich abmeldet
- **THEN** fragt die App nach, ob die nicht übertragenen Änderungen verworfen werden sollen
- **AND** lehnt er ab, bleibt er angemeldet und die Änderung bleibt erhalten
