# Spec Delta

## MODIFIED Requirements

### Requirement: Workbooks auf der Startseite
Die Startseite MUST für jedes Workbook, in dem der angemeldete Nutzer Mitglied ist, eine Karte mit Titel, Mitgliedern und den Songs des Workbooks zeigen, alphabetisch nach Titel, gefolgt von der Karte „Meine Songs“. Der eigene Bestand des Accounts (siehe `account-songs`) MUST nicht als Workbook erscheinen, weder als Karte noch als Ziel von „Zu Workbook …“. Ein Workbook MUST keine eigene Ansicht und keine eigene Adresse haben.

#### Scenario: Zwei Workbooks
- **GIVEN** der Nutzer ist Mitglied von „Proberaum“ und „Band“ und hat den eigenen Song „Skizze“
- **WHEN** er die Startseite öffnet
- **THEN** zeigt sie die Karten „Band“, „Proberaum“ und „Meine Songs“ in dieser Reihenfolge
- **AND** „Skizze“ steht nur in „Meine Songs“

#### Scenario: Ohne Workbooks
- **GIVEN** der Nutzer ist angemeldet und in keinem Workbook Mitglied
- **WHEN** er die Startseite öffnet
- **THEN** zeigt sie nur die Karte „Meine Songs“ und bietet „Zu Workbook …“ nicht an
