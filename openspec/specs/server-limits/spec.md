# server-limits Specification

## Purpose

Begrenzt, was Accounts auf dem Server belegen können, damit niemand ihn mit Daten oder Verbindungen lahmlegt. Eine erreichte Grenze kostet den Nutzer keine Daten.

## Requirements

### Requirement: Speichergrenze je Account
Die Songs eines Workbooks belegen Speicher beim Besitzer des Workbooks, der eigene Bestand beim Account selbst. Übersteigt eine Änderung oder ein neuer Song die Grenze von 20 MB je Account, MUST der Server sie abweisen und den gespeicherten Stand unverändert lassen. Änderungen, die keinen zusätzlichen Speicher belegen, und Löschen MUST immer möglich sein.

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

### Requirement: Gesamtgrenze für den Speicher
Übersteigt eine Änderung oder ein neuer Song die Grenze von 5 GB über alle Accounts, MUST der Server sie abweisen und den Vorfall protokollieren. Löschen MUST möglich bleiben.

#### Scenario: Gesamtgrenze erreicht
- **WHEN** der Server insgesamt die Grenze erreicht hat und ein Account unter seiner eigenen Grenze einen neuen Song überträgt
- **THEN** weist der Server ihn ab, und der Song bleibt auf dem Gerät

### Requirement: Grenzen für Workbooks und Mitglieder
Ein Account MUST höchstens 50 Workbooks besitzen; der eigene Bestand zählt nicht mit. Ein Workbook MUST höchstens 50 Mitglieder haben. Weitere MUST der Server abweisen, und die App MUST das melden.

#### Scenario: Zu viele Workbooks
- **GIVEN** ich@example.com besitzt 50 Workbooks
- **WHEN** er ein weiteres anlegt
- **THEN** meldet die App, dass die Höchstzahl erreicht ist, und es entsteht kein Workbook

#### Scenario: Zu viele Mitglieder
- **GIVEN** „Band“ hat 50 Mitglieder
- **WHEN** der Besitzer eine weitere Adresse einlädt
- **THEN** meldet die App, dass die Höchstzahl erreicht ist, die Person wird nicht Mitglied, und es geht keine Mail hinaus

### Requirement: Grenzen für Ereignis-Verbindungen
Der Server MUST je Account höchstens 10 und insgesamt höchstens 1000 gleichzeitige Ereignis-Verbindungen annehmen. Eine abgewiesene App MUST ohne Ereignisse weiter abgleichen und die Verbindung später erneut versuchen.

#### Scenario: Elfte Verbindung
- **GIVEN** ein Account hat 10 offene Ereignis-Verbindungen
- **WHEN** ein weiteres Gerät sich verbindet
- **THEN** weist der Server die Verbindung ab
- **AND** das Gerät gleicht seine Songs weiter regelmäßig ab

### Requirement: Keine Datenverluste an einer Grenze
Ist eine Speichergrenze erreicht, MUST die App das einmal melden, die Änderungen auf dem Gerät behalten und bei späteren Abgleichen erneut übertragen. Die Fassung des Geräts MUST dabei weder verworfen noch zur Kopie werden. Änderungen anderer MUST das Gerät weiterhin erreichen. Beim Abmelden gelten solche Änderungen als nicht übertragen.

#### Scenario: Änderung wartet auf Platz
- **GIVEN** ein Gerät hat „Intro“ geändert, und der Server hat die Änderung wegen der Grenze abgewiesen
- **WHEN** wieder Platz frei wird und das Gerät erneut abgleicht
- **THEN** kommt die Änderung an, und es gibt keine „Intro (Kopie)“

#### Scenario: Änderungen anderer an einer Grenze
- **GIVEN** der Server hat eine Änderung an „Intro“ von Gerät A wegen der Grenze abgewiesen
- **WHEN** ein anderes Mitglied „Intro“ zuvor geändert hat und Gerät A abgleicht
- **THEN** zeigt Gerät A die Änderung des anderen Mitglieds und behält seine eigene

#### Scenario: Abmelden mit abgewiesener Änderung
- **GIVEN** der Server hat eine Änderung an „Intro“ wegen der Grenze abgewiesen
- **WHEN** der Nutzer sich abmeldet
- **THEN** fragt die App nach, ob die nicht übertragenen Änderungen verworfen werden sollen
