# account-songs Specification

## Purpose

Bindet „Meine Songs“ an den Account: Sie erreichen alle Geräte mit demselben Login, bleiben offline nutzbar und verlassen beim Abmelden das Gerät. Ohne Anmeldung bleibt die App rein lokal.

## Requirements

### Requirement: Eigene Songs im Account
Solange der Nutzer angemeldet ist, MUST jeder Song in „Meine Songs“ zu seinem Account gehören. Neue, geänderte und gelöschte eigene Songs MUST auf jedem anderen Gerät mit demselben Login, das die App geöffnet hat und den Server erreicht, binnen 5 Sekunden erscheinen, ohne Neuladen. Gleichzeitige Änderungen MUST nach den Regeln von `song-merge` zusammengeführt werden.

#### Scenario: Zweites Gerät
- **GIVEN** der Nutzer hat auf dem ersten Gerät den Song „Skizze“ in „Meine Songs“
- **WHEN** er sich auf einem zweiten Gerät mit derselben Adresse anmeldet
- **THEN** steht „Skizze“ dort in „Meine Songs“ mit denselben Takten und Patterns

#### Scenario: Neuer Song auf einem Gerät
- **GIVEN** derselbe Nutzer ist auf zwei Geräten angemeldet
- **WHEN** er auf dem ersten Gerät den Song „Neu“ anlegt
- **THEN** zeigt das zweite Gerät „Neu“ binnen 5 Sekunden in „Meine Songs“

#### Scenario: Song gelöscht
- **GIVEN** derselbe Nutzer ist auf zwei Geräten angemeldet
- **WHEN** er auf dem ersten Gerät „Skizze“ löscht
- **THEN** ist „Skizze“ auf dem zweiten Gerät binnen 5 Sekunden nicht mehr vorhanden

### Requirement: Übernahme beim Anmelden
Beim Anmelden MUST die App lokale Songs mit unveränderter ID und unverändertem Inhalt in den Bestand des Accounts einfügen und den Bestand des Accounts auf das Gerät holen. Sie MUST darauf hinweisen, wie viele Songs übernommen wurden.

#### Scenario: Erste Anmeldung mit lokalen Songs
- **GIVEN** der Nutzer hat vor der Anmeldung die lokalen Songs „Skizze“ und „Intro“
- **WHEN** er sich anmeldet
- **THEN** stehen beide in „Meine Songs“ und gehören zum Account
- **AND** die App meldet, dass 2 Songs in den Account übernommen wurden

#### Scenario: Bestand zweier Geräte
- **GIVEN** das erste Gerät hat den lokalen Song „A“, das zweite den lokalen Song „B“
- **WHEN** der Nutzer sich auf beiden mit derselben Adresse anmeldet
- **THEN** stehen auf beiden Geräten „A“ und „B“ in „Meine Songs“

### Requirement: Fassungen beim Anmelden
Liegt im Account bereits ein Song mit derselben ID und einer anderen Fassung, MUST die Fassung des Accounts unter dem Titel bleiben und die lokale Fassung als „<Titel> (Kopie)“ mit neuer ID hinzukommen. Bei inhaltlich gleicher Fassung MUST keine Kopie entstehen. Ist die ID durch einen im Account gelöschten Song belegt, MUST die lokale Fassung ebenso als Kopie hinzukommen.

#### Scenario: Dieselbe Datei auf zwei Geräten
- **GIVEN** der Nutzer hat dieselbe Exportdatei unverändert auf zwei Geräten importiert
- **WHEN** er sich auf beiden anmeldet
- **THEN** steht jeder Song der Datei genau einmal in „Meine Songs“

#### Scenario: Abweichende Fassung
- **GIVEN** „Intro“ liegt im Account
- **AND** ein Gerät hat „Intro“ mit derselben ID, aber anderem Inhalt lokal
- **WHEN** der Nutzer sich auf diesem Gerät anmeldet
- **THEN** stehen „Intro“ in der Fassung des Accounts und „Intro (Kopie)“ in der lokalen Fassung in „Meine Songs“

#### Scenario: Im Account gelöschter Song
- **GIVEN** „Intro“ wurde im Account gelöscht
- **AND** ein Gerät hat „Intro“ mit derselben ID aus einer alten Exportdatei lokal
- **WHEN** der Nutzer sich auf diesem Gerät anmeldet
- **THEN** steht „Intro (Kopie)“ in der lokalen Fassung in „Meine Songs“

### Requirement: Eigene Songs ohne Verbindung
Angemeldet MUST der Nutzer eigene Songs ohne erreichbaren Server anlegen, ändern und löschen können. Die Änderungen MUST lokal gespeichert und beim nächsten Kontakt übertragen werden. Ein gelöschter Song MUST auf dem Gerät gelöscht bleiben, auch über ein Neuladen hinweg.

#### Scenario: Anlegen ohne Verbindung
- **WHEN** der Nutzer bei nicht erreichbarem Server „Offline“ anlegt und der Server danach wieder erreichbar ist
- **THEN** steht „Offline“ auf seinen anderen Geräten in „Meine Songs“

#### Scenario: Löschen ohne Verbindung
- **GIVEN** „Skizze“ liegt im Account
- **WHEN** der Nutzer „Skizze“ bei nicht erreichbarem Server löscht, die App neu lädt und der Server danach wieder erreichbar ist
- **THEN** bleibt „Skizze“ auf diesem Gerät gelöscht und verschwindet auch von seinen anderen Geräten

### Requirement: Eigene Songs beim Abmelden
Beim Abmelden MUST die App noch nicht übertragene eigene Songs und Änderungen übertragen und alle zum Account gehörenden Songs danach vom Gerät entfernen. Bei der nächsten Anmeldung MUST sie zurückkommen. Können Änderungen an Songs im Account nicht übertragen werden, MUST die App vorher nachfragen und darauf hinweisen, dass sie verloren gehen. Ein Song, der nie übertragen werden konnte, MUST lokal auf dem Gerät bleiben.

#### Scenario: Abmelden und wieder anmelden
- **GIVEN** „Skizze“ liegt im Account
- **WHEN** der Nutzer sich abmeldet
- **THEN** ist „Skizze“ nicht mehr auf dem Gerät
- **WHEN** er sich wieder anmeldet
- **THEN** steht „Skizze“ wieder in „Meine Songs“

#### Scenario: Nie übertragener Song
- **GIVEN** der Nutzer hat bei nicht erreichbarem Server „Offline“ angelegt
- **WHEN** er sich abmeldet, sobald der Server wieder antwortet, die Übertragung von „Offline“ aber abgewiesen wird
- **THEN** steht „Offline“ weiter lokal in „Meine Songs“

#### Scenario: Anderer Account auf demselben Gerät
- **GIVEN** die Songs von ich@example.com liegen in dessen Account, und er hat sich abgemeldet
- **WHEN** sich anna@example.com auf demselben Gerät anmeldet
- **THEN** sieht sie die Songs von ich@example.com nicht

### Requirement: Eigene Songs ohne Anmeldung
Ohne Anmeldung MUST die App Songs nur lokal führen und nichts an den Server übertragen.

#### Scenario: Abgemeldet anlegen
- **WHEN** der nicht angemeldete Nutzer „Skizze“ anlegt
- **THEN** steht „Skizze“ in „Meine Songs“, und der Server kennt den Song nicht

### Requirement: Eigenen Song in ein Workbook verschieben
Ein eigener Song MUST sich mit unveränderter ID in ein Workbook verschieben lassen. Auf den anderen Geräten desselben Nutzers MUST er danach im Workbook stehen und nicht mehr in „Meine Songs“. Dort noch nicht übertragene Änderungen MUST erhalten bleiben und im Workbook ankommen.

#### Scenario: Zweites Gerät mit offenen Änderungen
- **GIVEN** der Nutzer ändert „Skizze“ auf dem zweiten Gerät offline
- **AND** auf dem ersten Gerät verschiebt er „Skizze“ nach „Band“
- **WHEN** das zweite Gerät wieder den Server erreicht
- **THEN** steht „Skizze“ dort in „Band“ und nicht mehr in „Meine Songs“
- **AND** alle Mitglieder von „Band“ sehen die Änderung

### Requirement: Zugriff auf eigene Songs
Der Server MUST eigene Songs nur dem Account zeigen und nur von ihm ändern lassen. Der Bestand eines Accounts MUST sich nicht teilen, umbenennen oder löschen lassen.

#### Scenario: Fremder Zugriff
- **WHEN** ein anderer angemeldeter Nutzer den Bestand von ich@example.com abruft, ändert oder dorthin einlädt
- **THEN** antwortet der Server wie bei einem nicht vorhandenen Workbook und ändert nichts

#### Scenario: Teilen ausgeschlossen
- **WHEN** ich@example.com versucht, jemanden zu seinem eigenen Bestand einzuladen, ihn umzubenennen oder zu löschen
- **THEN** weist der Server das ab und ändert nichts
