## Purpose

Legt die Reihenfolge der Songs in „Meine Songs“ und in Workbooks fest: wie sie angezeigt wird, wie der Nutzer sie durch Ziehen ändert und wie sie zwischen Geräten und Mitgliedern übereinstimmt.

## ADDED Requirements

### Requirement: Reihenfolge der Kacheln
Angemeldet MUST jeder Song in „Meine Songs“ und in einem Workbook eine Position haben können. Kacheln mit Position MUST nach ihrer Position stehen, danach die Kacheln ohne Position, alphabetisch nach Titel. „+ Song“ MUST zuletzt stehen. Abgemeldet MUST „Meine Songs“ alphabetisch nach Titel stehen.

#### Scenario: Noch nicht sortiert
- **GIVEN** „Band“ enthält „Uprising“ und „Hysteria“, und niemand hat „Band“ sortiert
- **WHEN** der Nutzer „Band“ wählt
- **THEN** stehen „Hysteria“, „Uprising“ und „+ Song“ in dieser Reihenfolge

#### Scenario: Neuer Song nach sortierten Songs
- **GIVEN** „Band“ ist in der Reihenfolge „Uprising“, „Hysteria“ sortiert
- **WHEN** ein Mitglied in „Band“ „+ Song“ wählt
- **THEN** stehen „Uprising“, „Hysteria“, „Neuer Song“ und „+ Song“ in dieser Reihenfolge

#### Scenario: Abgemeldet
- **GIVEN** der Nutzer ist nicht angemeldet und hat „Uprising“ und „Hysteria“
- **WHEN** er die Startseite öffnet
- **THEN** steht „Hysteria“ vor „Uprising“

### Requirement: Sortieren durch Ziehen
Angemeldet MUST sich eine Kachel innerhalb ihres Bereichs, „Meine Songs“ oder das gewählte Workbook, an einen anderen Platz ziehen lassen. Während des Ziehens MUST eine Einfügemarke den Platz zwischen zwei Kacheln oder vor „+ Song“ zeigen. Loslassen MUST den Song ohne Rückfrage an diesen Platz stellen; die Reihenfolge der übrigen Songs MUST erhalten bleiben. Escape und Loslassen außerhalb des Bereichs MUST nichts ändern.

#### Scenario: Im Workbook sortieren
- **GIVEN** „Band“ zeigt „Hysteria“, „Outro“, „Uprising“
- **WHEN** der Nutzer „Uprising“ vor „Hysteria“ zieht und loslässt
- **THEN** zeigt „Band“ „Uprising“, „Hysteria“, „Outro“, und die App fragt nichts

#### Scenario: In „Meine Songs“ sortieren
- **GIVEN** „Meine Songs“ zeigt „Hysteria“, „Skizze“
- **WHEN** der Nutzer „Hysteria“ vor „+ Song“ zieht und loslässt
- **THEN** zeigt „Meine Songs“ „Skizze“, „Hysteria“

#### Scenario: Einfügemarke
- **WHEN** der Nutzer „Uprising“ zwischen „Hysteria“ und „Outro“ zieht
- **THEN** zeigt eine Einfügemarke den Platz zwischen „Hysteria“ und „Outro“
- **AND** keine Kachel ändert dabei ihren Platz

#### Scenario: Escape
- **WHEN** der Nutzer „Uprising“ vor „Hysteria“ zieht und Escape drückt
- **THEN** bleibt die Reihenfolge unverändert

### Requirement: Position beim Ablegen in einem anderen Bereich
Wird eine Kachel aus „Meine Songs“ in den Bereich des gewählten Workbooks oder eine Workbook-Kachel nach „Meine Songs“ gezogen, MUST die Einfügemarke auch dort den Platz zeigen, und nach bestätigter Rückfrage MUST der verschobene Song bzw. die Kopie an diesem Platz stehen. Ablegen auf einem Eintrag der Seitenleiste sowie Verschieben und Kopieren über Menü oder Symbol MUST den Song ohne Position lassen. Scheitert das Verschieben, MUST sich keine Reihenfolge ändern.

#### Scenario: In das gewählte Workbook ziehen
- **GIVEN** „Band“ ist gewählt und zeigt „Hysteria“, „Uprising“
- **WHEN** der Nutzer „Skizze“ aus „Meine Songs“ zwischen „Hysteria“ und „Uprising“ zieht, loslässt und die Rückfrage bestätigt
- **THEN** zeigt „Band“ „Hysteria“, „Skizze“, „Uprising“

#### Scenario: Nach „Meine Songs“ kopieren
- **GIVEN** „Meine Songs“ zeigt „Hysteria“, „Skizze“
- **WHEN** der Nutzer „Uprising“ aus „Band“ vor „Skizze“ zieht, loslässt und die Rückfrage bestätigt
- **THEN** zeigt „Meine Songs“ „Hysteria“, „Uprising (Kopie)“, „Skizze“

#### Scenario: Über das Menü verschieben
- **GIVEN** „Band“ ist in der Reihenfolge „Uprising“, „Hysteria“ sortiert
- **WHEN** der Nutzer „Skizze“ über „Zu Workbook …“ zu „Band“ verschiebt
- **THEN** zeigt „Band“ „Uprising“, „Hysteria“, „Skizze“

#### Scenario: Verschieben scheitert
- **WHEN** der Nutzer bei nicht erreichbarem Server „Skizze“ zwischen zwei Kacheln von „Band“ zieht und die Rückfrage bestätigt
- **THEN** bleibt „Skizze“ in „Meine Songs“ und die Reihenfolge von „Band“ unverändert

### Requirement: Gemeinsame Reihenfolge
Die Reihenfolge eines Workbooks MUST für alle Mitglieder gelten, jedes Mitglied MUST sie ändern können, und sie MUST auf allen ihren Geräten binnen 5 Sekunden erscheinen, sobald sie den Server erreichen. Die Reihenfolge von „Meine Songs“ MUST auf allen Geräten des Kontos gelten. Sortieren MUST offline möglich sein und beim nächsten Kontakt übertragen werden. Sortieren MUST keinen Song ändern und nicht in seinem Verlauf erscheinen.

#### Scenario: Ein Mitglied sortiert
- **WHEN** Max „Uprising“ in „Band“ an den Anfang zieht
- **THEN** steht „Uprising“ auch bei Artjom an erster Stelle von „Band“

#### Scenario: Offline sortiert
- **GIVEN** Artjom ist offline
- **WHEN** er „Band“ sortiert und danach den Server erreicht
- **THEN** sehen alle Mitglieder seine Reihenfolge

#### Scenario: Kein Eintrag im Verlauf
- **WHEN** der Nutzer „Uprising“ an einen anderen Platz zieht
- **THEN** zeigt der Verlauf von „Uprising“ keine neue Änderung, und die letzte Änderung der Kachel bleibt gleich

### Requirement: Gleichzeitig sortiert
Sortieren zwei Mitglieder gleichzeitig oder offline, MUST danach auf allen Geräten dieselbe Reihenfolge gelten, in der jeder Song genau einmal steht. Haben sie in einem sortierten Bereich verschiedene Songs verschoben, MUST jeder zwischen den Nachbarn stehen, zwischen die er gezogen wurde, sofern diese nicht selbst verschoben wurden. Haben beide denselben Song verschoben, MUST eine der beiden Positionen gelten.

#### Scenario: Denselben Song verschoben
- **GIVEN** „Band“ ist sortiert, und Artjom und Max sind offline
- **WHEN** Artjom „Uprising“ an den Anfang und Max „Uprising“ ans Ende zieht und beide danach den Server erreichen
- **THEN** steht „Uprising“ bei beiden genau einmal, und zwar bei beiden am selben Platz

#### Scenario: Verschiedene Songs verschoben
- **GIVEN** „Band“ ist in der Reihenfolge „A“, „B“, „C“, „D“ sortiert, und Artjom und Max sind offline
- **WHEN** Artjom „D“ vor „A“ zieht und Max „C“ vor „B“ zieht und beide danach den Server erreichen
- **THEN** zeigt „Band“ bei beiden „D“, „A“, „C“, „B“
