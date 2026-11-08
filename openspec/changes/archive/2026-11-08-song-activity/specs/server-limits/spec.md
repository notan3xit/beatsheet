# Spec Delta

## MODIFIED Requirements

### Requirement: Speichergrenze je Account
Die Songs und das Workbook-Dokument (`workbook-sync`) eines Workbooks belegen Speicher beim Besitzer des Workbooks, der eigene Bestand beim Account selbst. Übersteigt eine Änderung oder ein neuer Song die Grenze von 20 MB je Account, MUST der Server sie abweisen und den gespeicherten Stand unverändert lassen. Änderungen, die keinen zusätzlichen Speicher belegen, und Löschen MUST immer möglich sein.

#### Scenario: Neuer Song über der Grenze
- **GIVEN** der Bestand von ich@example.com hat die Grenze erreicht
- **WHEN** das Gerät den neuen Song „Skizze“ überträgt
- **THEN** weist der Server ihn ab
- **AND** „Skizze“ bleibt auf dem Gerät in „Meine Songs“

#### Scenario: Mitglied schreibt in ein volles Workbook
- **GIVEN** die Besitzerin von „Band“ hat die Grenze erreicht
- **WHEN** ein Mitglied „Intro“ aus „Band“ so ändert, dass der Song größer wird
- **THEN** weist der Server die Änderung ab, und die anderen Mitglieder sehen „Intro“ unverändert

#### Scenario: Löschen gibt Speicher frei
- **GIVEN** der Bestand von ich@example.com hat die Grenze erreicht
- **WHEN** er einen Song löscht
- **THEN** nimmt der Server danach wieder neue Songs an, soweit der frei gewordene Platz reicht

#### Scenario: Verschieben in ein volles Workbook
- **GIVEN** die Besitzerin von „Band“ hat die Grenze erreicht
- **WHEN** ein Mitglied einen eigenen Song nach „Band“ verschieben will
- **THEN** meldet die App, dass der Speicher des Workbooks voll ist, und der Song bleibt in „Meine Songs“

#### Scenario: Gesehene Stände belegen Speicher
- **GIVEN** das Workbook-Dokument von „Band“ belegt Speicher
- **WHEN** die Besitzerin von „Band“ so nahe an der Grenze ist, dass ein Song ohne dieses Dokument noch passen würde
- **THEN** weist der Server den Song ab
