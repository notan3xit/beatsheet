## MODIFIED Requirements

### Requirement: Song in ein Workbook ziehen
Eine Kachel aus „Meine Songs“ MUST sich auf einen Eintrag der Seitenleiste oder in den Bereich des gewählten Workbooks ziehen lassen; Loslassen dort MUST nach bestätigter Rückfrage den Song in dieses Workbook verschieben, im Bereich an den Platz der Einfügemarke (`song-order`). Während des Ziehens MUST die Kachel dem Zeiger folgen. Loslassen außerhalb eines Ziels, Escape und Abbrechen der Rückfrage MUST nichts ändern.

#### Scenario: Auf einen Eintrag ziehen
- **GIVEN** „Band“ ist gewählt
- **WHEN** der Nutzer die Kachel „Skizze“ aus „Meine Songs“ auf den Eintrag „Proberaum“ zieht, loslässt und die Rückfrage bestätigt
- **THEN** steht „Skizze“ in „Proberaum“ und nicht mehr in „Meine Songs“

#### Scenario: In das gewählte Workbook ziehen
- **GIVEN** „Band“ ist gewählt
- **WHEN** der Nutzer die Kachel „Skizze“ in den Bereich von „Band“ zieht, loslässt und die Rückfrage bestätigt
- **THEN** steht „Skizze“ in „Band“

#### Scenario: Abbrechen
- **WHEN** der Nutzer „Skizze“ zieht und außerhalb eines Ziels loslässt oder Escape drückt
- **THEN** bleibt „Skizze“ in „Meine Songs“ und nichts wird übertragen

#### Scenario: Rückfrage nach dem Ziehen abgebrochen
- **WHEN** der Nutzer „Skizze“ auf den Eintrag „Band“ zieht, loslässt und die Rückfrage abbricht
- **THEN** bleibt „Skizze“ in „Meine Songs“ und nichts wird übertragen

#### Scenario: Klick statt Ziehen
- **WHEN** der Nutzer die Kachel „Skizze“ anklickt, ohne sie zu bewegen
- **THEN** zeigt die App die Doppelseite von „Skizze“

#### Scenario: Workbook-Kachel
- **WHEN** der Nutzer die Kachel „Uprising“ aus „Band“ auf den Eintrag „Proberaum“ zieht und loslässt
- **THEN** bleibt „Uprising“ in „Band“ und steht nicht in „Proberaum“

### Requirement: Hervorhebung beim Ziehen
Während des Ziehens MUST nur das Ziel unter dem Zeiger hervorgehoben sein, andere Flächen wie „+ Song“ MUST unverändert bleiben. Ist das Ziel das gewählte Workbook, MUST sein Eintrag mit dem Bereich zusammen eine hervorgehobene Fläche bilden. Ist das Ziel „Meine Songs“, MUST der Bereich „Meine Songs“ hervorgehoben sein. Beim Sortieren innerhalb eines Bereichs MUST nur die Einfügemarke erscheinen (`song-order`), der Bereich MUST unverändert bleiben.

#### Scenario: Ziel hervorgehoben
- **WHEN** der Nutzer „Skizze“ über den Eintrag „Proberaum“ zieht
- **THEN** ist „Proberaum“ als Ziel hervorgehoben

#### Scenario: Gewähltes Workbook als Ziel
- **GIVEN** „Band“ ist gewählt
- **WHEN** der Nutzer „Skizze“ über den Bereich von „Band“ zieht
- **THEN** sind Eintrag und Bereich von „Band“ als eine Fläche mit gemeinsamem Rand hervorgehoben
- **AND** „+ Song“ in „Band“ ist nicht hervorgehoben

#### Scenario: „Meine Songs“ als Ziel
- **WHEN** der Nutzer „Uprising“ aus „Band“ über „Meine Songs“ zieht
- **THEN** ist „Meine Songs“ als Ziel hervorgehoben
- **AND** „+ Song“ in „Meine Songs“ ist nicht hervorgehoben

#### Scenario: Sortieren
- **WHEN** der Nutzer „Uprising“ innerhalb von „Band“ zieht
- **THEN** zeigt „Band“ die Einfügemarke, und weder Eintrag noch Bereich von „Band“ sind hervorgehoben

### Requirement: Gesehene Stände abgleichen
Die gesehenen Stände (`song-activity`) aller Mitglieder und die Reihenfolge (`song-order`) eines Workbooks MUST in einem gemeinsamen Dokument des Workbooks liegen, das wie die Songs abgeglichen und nach den Regeln von `song-merge` zusammengeführt wird, auch nach Offline-Arbeit. Jedes Mitglied MUST es lesen können. Beim eigenen Bestand MUST es keine gesehenen Stände enthalten. Es MUST weder als Song erscheinen noch zur Anzahl der Songs oder zur Frage zählen, ob sich das Workbook löschen lässt.

#### Scenario: Gleichzeitig gesehen
- **GIVEN** Artjom und Max sind offline
- **WHEN** beide „Hysteria“ öffnen und danach den Server erreichen
- **THEN** gilt „Hysteria“ für beide als gesehen

#### Scenario: Anzahl der Songs
- **GIVEN** „Band“ hat 3 Songs
- **WHEN** ein Mitglied einen Song von „Band“ geöffnet hat
- **THEN** zeigt der Eintrag „Band“ weiterhin „3 Songs“

#### Scenario: Eigener Bestand
- **WHEN** der Nutzer „Meine Songs“ sortiert und einen Song daraus öffnet
- **THEN** enthält das Dokument seines eigenen Bestands die Reihenfolge und keinen gesehenen Stand

### Requirement: Nur eigene gesehene Stände
Der Server MUST eine Übertragung des Workbook-Dokuments zurückweisen, wenn sie gesehene Stände eines anderen Mitglieds ändert oder das Dokument nicht seiner Form entspricht. Das gespeicherte Dokument MUST dann unverändert bleiben, und das Gerät MUST die Fassung des Servers übernehmen. Änderungen der Reihenfolge MUST der Server von jedem Mitglied annehmen.

#### Scenario: Fremden Eintrag ändern
- **WHEN** ein Client von max@example.org den gesehenen Stand von artjom@example.org ändert
- **THEN** weist der Server die Übertragung zurück und der gesehene Stand von artjom@example.org bleibt unverändert

#### Scenario: Reihenfolge ändern
- **WHEN** ein Client von max@example.org die Position eines Songs ändert, den artjom@example.org zuletzt verschoben hat
- **THEN** nimmt der Server die Übertragung an

### Requirement: Song aus einem Workbook ziehen
Eine Kachel eines Workbooks MUST sich auf den Bereich „Meine Songs“ ziehen lassen; Loslassen dort MUST nach bestätigter Rückfrage eine Kopie an den Platz der Einfügemarke legen (`song-library`, „Song kopieren“; `song-order`). Einträge der Seitenleiste MUST kein Ziel sein; Loslassen im eigenen Workbook MUST sortieren (`song-order`). Loslassen außerhalb dieser Ziele, Escape und Abbrechen der Rückfrage MUST nichts ändern.

#### Scenario: Nach „Meine Songs“ ziehen
- **WHEN** der Nutzer die Kachel „Uprising“ aus „Band“ auf „Meine Songs“ zieht, loslässt und die Rückfrage bestätigt
- **THEN** steht „Uprising (Kopie)“ in „Meine Songs“
- **AND** „Uprising“ steht unverändert in „Band“

#### Scenario: Auf ein anderes Workbook ziehen
- **WHEN** der Nutzer die Kachel „Uprising“ aus „Band“ auf den Eintrag „Proberaum“ zieht und loslässt
- **THEN** ist „Proberaum“ nicht hervorgehoben, die App fragt nichts, und nichts ändert sich

#### Scenario: Im eigenen Workbook loslassen
- **WHEN** der Nutzer die Kachel „Uprising“ innerhalb von „Band“ zieht und loslässt
- **THEN** fragt die App nichts, und „Uprising“ steht an der Einfügemarke

#### Scenario: Escape beim Ziehen
- **WHEN** der Nutzer „Uprising“ aus „Band“ über „Meine Songs“ zieht und Escape drückt
- **THEN** fragt die App nichts, und „Meine Songs“ bleibt unverändert
