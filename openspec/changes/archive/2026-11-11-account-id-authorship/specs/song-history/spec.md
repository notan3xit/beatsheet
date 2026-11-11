## MODIFIED Requirements

### Requirement: Autor einer Änderung
Jede Änderung, die ein angemeldeter Nutzer an einem Song vornimmt, MUST sein Konto als Autor tragen, auch wenn der Server gerade nicht erreichbar ist. Der Autor MUST das Konto über eine Kennung bezeichnen, die keine Adresse enthält. Änderungen ohne Anmeldung MUST keinen Autor tragen. Der Autor MUST mit der Änderung auf alle Geräte gelangen und unverändert bleiben. Ist der Autor einer Änderung eine Adresse, MUST die App ihn dem Konto dieser Adresse zuordnen und die Änderung für dieses Konto als eigene werten.

#### Scenario: Änderung im Workbook
- **WHEN** der angemeldete Nutzer „max@example.org“ im Workbook-Song „Hysteria“ einen Schlag setzt
- **THEN** zeigt der Verlauf des Songs auf jedem Gerät eines Mitglieds diese Änderung mit dem Autor „max@example.org“

#### Scenario: Keine Adresse im Song
- **WHEN** der angemeldete Nutzer „max@example.org“ einen Song ändert
- **THEN** enthält das gespeicherte Song-Dokument die Adresse „max@example.org“ nicht

#### Scenario: Offline nach Neustart
- **WHEN** der angemeldete Nutzer die App ohne erreichbaren Server neu startet und einen Workbook-Song ändert
- **THEN** trägt die Änderung sein Konto als Autor

#### Scenario: Ohne Anmeldung
- **WHEN** ein nicht angemeldeter Nutzer einen lokalen Song ändert
- **THEN** trägt die Änderung keinen Autor

#### Scenario: Adresse als Autor
- **GIVEN** eine Änderung an „Hysteria“ in „Band“ trägt die Adresse „max@example.org“ als Autor
- **AND** max@example.org ist Mitglied von „Band“ und heißt „Max“
- **WHEN** ein Mitglied den Verlauf von „Hysteria“ öffnet
- **THEN** erscheint die Änderung unter „Max“

#### Scenario: Eigene Adresse
- **GIVEN** eine Änderung an „Hysteria“ trägt die Adresse von Artjom als Autor
- **WHEN** Artjom einen früheren Stand wiederherstellt, der diese Änderung zurücknimmt
- **THEN** weist der Dialog nicht auf Änderungen anderer Autoren hin

### Requirement: Personen im Verlauf
In einem Song eines gemeinsamen Workbooks MUST der Verlauf bei jedem Wechsel des Autors zwischen benachbarten Bearbeitungen eine Kopfzeile mit Kürzel, Farbe und Namen aus dem Profil des Autors zeigen, ohne bekanntes Profil seine Adresse. Ohne Autor oder wenn der Autor kein Mitglied des Workbooks ist, MUST sie „Unbekannt“ zeigen. In lokalen Songs und in „Meine Songs“ MUST der Verlauf keine Personen zeigen.

#### Scenario: Zwei Personen
- **WHEN** Artjom und danach Max den Song „Hysteria“ im gemeinsamen Workbook bearbeiten
- **THEN** zeigt der Verlauf oben eine Kopfzeile „Max“ mit dessen Bearbeitungen und darunter eine Kopfzeile „Artjom“

#### Scenario: Ausgetretenes Mitglied
- **GIVEN** Max hat „Hysteria“ in „Band“ bearbeitet und „Band“ danach verlassen
- **WHEN** ein Mitglied den Verlauf von „Hysteria“ öffnet
- **THEN** zeigt die Kopfzeile von Max’ Bearbeitungen „Unbekannt“

#### Scenario: Wieder eingeladen
- **GIVEN** Max hat „Hysteria“ in „Band“ bearbeitet, wurde aus „Band“ entfernt und wieder eingeladen
- **WHEN** ein Mitglied den Verlauf von „Hysteria“ öffnet
- **THEN** zeigt die Kopfzeile von Max’ Bearbeitungen „Max“

#### Scenario: Eigener Song
- **WHEN** der Nutzer den Verlauf eines Songs in „Meine Songs“ öffnet
- **THEN** zeigt der Verlauf keine Kopfzeilen mit Personen
