## MODIFIED Requirements

### Requirement: Workbooks auf der Startseite
Angemeldet MUST unter „Meine Songs“ der Bereich „Workbooks“ stehen: eine Seitenleiste mit einem Eintrag je Workbook des Nutzers, alphabetisch, mit Titel, Anzahl der Songs und der Mitglieder; daneben das gewählte Workbook mit Titel, Mitgliedern und den Kacheln seiner Songs. Der eigene Bestand (`account-songs`) MUST weder in der Seitenleiste noch als Ziel von „Zu Workbook …“ oder beim Ziehen aus „Meine Songs“ erscheinen. Ein Workbook MUST keine eigene Ansicht und keine eigene Adresse haben.

#### Scenario: Zwei Workbooks
- **GIVEN** der Nutzer ist Mitglied von „Proberaum“ und „Band“ und hat den eigenen Song „Skizze“
- **WHEN** er die Startseite öffnet
- **THEN** zeigt die Seitenleiste „Band“ und „Proberaum“ in dieser Reihenfolge
- **AND** „Skizze“ steht nur in „Meine Songs“

#### Scenario: Angaben in der Seitenleiste
- **GIVEN** „Band“ hat 3 Songs und 2 Mitglieder
- **WHEN** der Nutzer die Startseite öffnet
- **THEN** zeigt der Eintrag „Band“ „3 Songs“ und „2 Mitglieder“

#### Scenario: Ohne Workbooks
- **GIVEN** der Nutzer ist angemeldet und in keinem Workbook Mitglied
- **WHEN** er die Startseite öffnet
- **THEN** enthält die Seitenleiste nur „+ Workbook“
- **AND** die App bietet „Zu Workbook …“ nicht an
