## MODIFIED Requirements

### Requirement: Song in ein Workbook verschieben
Der angemeldete Nutzer MUST einen Song aus „Meine Songs“ in eines seiner Workbooks verschieben können, über „Zu Workbook …“ an der Kachel oder durch Ziehen, jeweils erst nach bestätigter Rückfrage. Der Song MUST danach mit unveränderter ID und unverändertem Inhalt im Workbook stehen, bei allen Mitgliedern erscheinen und nicht mehr in „Meine Songs“ stehen. Ist der Server nicht erreichbar, MUST die App das melden und den Song in „Meine Songs“ lassen.

#### Scenario: Verschieben
- **WHEN** der Nutzer „Uprising“ über „Zu Workbook …“ aus „Meine Songs“ zu „Band“ verschiebt und die Rückfrage bestätigt
- **THEN** steht „Uprising“ in „Band“ und nicht mehr in „Meine Songs“
- **AND** die anderen Mitglieder von „Band“ sehen „Uprising“ mit denselben Takten und Patterns

#### Scenario: Verschieben abgebrochen
- **WHEN** der Nutzer „Uprising“ über „Zu Workbook …“ zu „Band“ verschieben will und die Rückfrage abbricht oder Escape drückt
- **THEN** bleibt „Uprising“ in „Meine Songs“ und nichts wird übertragen

#### Scenario: Server nicht erreichbar
- **WHEN** der Nutzer bei nicht erreichbarem Server „Uprising“ zu „Band“ verschieben will und die Rückfrage bestätigt
- **THEN** meldet die App, dass der Server nicht erreichbar ist, und „Uprising“ bleibt in „Meine Songs“

### Requirement: Song in ein Workbook ziehen
Eine Kachel aus „Meine Songs“ MUST sich auf einen Eintrag der Seitenleiste oder in den Bereich des gewählten Workbooks ziehen lassen; Loslassen dort MUST nach bestätigter Rückfrage den Song in dieses Workbook verschieben. Während des Ziehens MUST die Kachel dem Zeiger folgen. Loslassen außerhalb eines Ziels, Escape und Abbrechen der Rückfrage MUST nichts ändern.

#### Scenario: Auf einen Eintrag ziehen
- **GIVEN** „Band“ ist gewählt
- **WHEN** der Nutzer die Kachel „Skizze“ aus „Meine Songs“ auf den Eintrag „Proberaum“ zieht, loslässt und die Rückfrage bestätigt
- **THEN** steht „Skizze“ in „Proberaum“ und nicht mehr in „Meine Songs“

#### Scenario: In das gewählte Workbook ziehen
- **GIVEN** „Band“ ist gewählt
- **WHEN** der Nutzer die Kachel „Skizze“ in den Bereich von „Band“ zieht, loslässt und die Rückfrage bestätigt
- **THEN** steht „Skizze“ in „Band“

#### Scenario: Abbrechen
- **WHEN** der Nutzer „Skizze“ zieht und über „Meine Songs“ loslässt oder Escape drückt
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
Während des Ziehens MUST nur das Ziel unter dem Zeiger hervorgehoben sein, andere Flächen wie „+ Song“ MUST unverändert bleiben. Ist das Ziel das gewählte Workbook, MUST sein Eintrag mit dem Bereich zusammen eine hervorgehobene Fläche bilden. Ist das Ziel „Meine Songs“, MUST der Bereich „Meine Songs“ hervorgehoben sein.

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

## ADDED Requirements

### Requirement: Rückfrage beim Verschieben
Vor dem Verschieben in ein Workbook MUST die App fragen „„<Titel>“ nach „<Workbook>“ verschieben?“ und nennen: Der Song wird ins Workbook verschoben, zurück nach „Meine Songs“ geht nur als Kopie; der Song wird mit den Mitgliedern des Workbooks geteilt; der Verlauf wird ins Workbook übernommen. Die Knöpfe MUST „Abbrechen“ und „Verschieben“ heißen.

#### Scenario: Rückfrage
- **WHEN** der Nutzer „Uprising“ über „Zu Workbook …“ zu „Band“ verschieben will
- **THEN** fragt die App „„Uprising“ nach „Band“ verschieben?“ mit den Knöpfen „Abbrechen“ und „Verschieben“

### Requirement: Song aus einem Workbook ziehen
Eine Kachel eines Workbooks MUST sich auf den Bereich „Meine Songs“ ziehen lassen; Loslassen dort MUST nach bestätigter Rückfrage eine Kopie in „Meine Songs“ anlegen (siehe `song-library`, „Song kopieren“). Einträge der Seitenleiste und das eigene Workbook MUST dabei kein Ziel sein. Loslassen außerhalb von „Meine Songs“, Escape und Abbrechen der Rückfrage MUST nichts ändern.

#### Scenario: Nach „Meine Songs“ ziehen
- **WHEN** der Nutzer die Kachel „Uprising“ aus „Band“ auf „Meine Songs“ zieht, loslässt und die Rückfrage bestätigt
- **THEN** steht „Uprising (Kopie)“ in „Meine Songs“
- **AND** „Uprising“ steht unverändert in „Band“

#### Scenario: Auf ein anderes Workbook ziehen
- **WHEN** der Nutzer die Kachel „Uprising“ aus „Band“ auf den Eintrag „Proberaum“ zieht und loslässt
- **THEN** ist „Proberaum“ nicht hervorgehoben, die App fragt nichts, und nichts ändert sich

#### Scenario: Im eigenen Workbook loslassen
- **WHEN** der Nutzer die Kachel „Uprising“ innerhalb von „Band“ zieht und loslässt
- **THEN** fragt die App nichts, und nichts ändert sich

#### Scenario: Escape beim Ziehen
- **WHEN** der Nutzer „Uprising“ aus „Band“ über „Meine Songs“ zieht und Escape drückt
- **THEN** fragt die App nichts, und „Meine Songs“ bleibt unverändert
