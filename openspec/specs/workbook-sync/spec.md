# workbook-sync Specification

## Purpose

Hält die Songs eines Workbooks auf allen Geräten seiner Mitglieder auf demselben Stand: Songs ins Workbook bringen, darin anlegen und löschen, Änderungen abgleichen, auch nach Offline-Arbeit.

## Requirements

### Requirement: Song in ein Workbook verschieben
Der angemeldete Nutzer MUST einen Song aus „Meine Songs“ in eines seiner Workbooks verschieben können, über „Zu Workbook …“ an der Kachel oder durch Ziehen (siehe „Song in ein Workbook ziehen“). Der Song MUST danach mit unveränderter ID und unverändertem Inhalt im Workbook stehen, bei allen Mitgliedern erscheinen und nicht mehr in „Meine Songs“ stehen. Ist der Server nicht erreichbar, MUST die App das melden und den Song in „Meine Songs“ lassen.

#### Scenario: Verschieben
- **WHEN** der Nutzer „Uprising“ über „Zu Workbook …“ aus „Meine Songs“ zu „Band“ verschiebt
- **THEN** steht „Uprising“ in „Band“ und nicht mehr in „Meine Songs“
- **AND** die anderen Mitglieder von „Band“ sehen „Uprising“ mit denselben Takten und Patterns

#### Scenario: Server nicht erreichbar
- **WHEN** der Nutzer bei nicht erreichbarem Server „Uprising“ zu „Band“ verschieben will
- **THEN** meldet die App, dass der Server nicht erreichbar ist, und „Uprising“ bleibt in „Meine Songs“

### Requirement: Song in einem Workbook anlegen
Im gewählten Workbook MUST als letzte Kachel „+ Song“ stehen. Sie MUST einen Song „Neuer Song“ anlegen, der direkt zum Workbook gehört und bei allen Mitgliedern erscheint, und seine Doppelseite öffnen. Ist der Server nicht erreichbar, MUST die App das melden und keinen Song anlegen.

#### Scenario: Anlegen in der Karte
- **WHEN** der Nutzer im gewählten Workbook „Band“ „+ Song“ wählt
- **THEN** zeigt die App die Doppelseite von „Neuer Song“
- **AND** „Neuer Song“ steht in „Band“, auch bei allen Mitgliedern

### Requirement: Workbook-Song löschen
Das Löschen eines Songs, der zu einem Workbook gehört, MUST ihn für alle Mitglieder löschen. Die Nachfrage MUST darauf hinweisen. Ein gelöschter Song MUST auch auf Geräten verschwinden, die ihn in der Zwischenzeit offline geändert haben. Ist der Server nicht erreichbar, MUST die App das melden und den Song behalten.

#### Scenario: Löschen für alle
- **WHEN** ein Mitglied „Intro“ aus „Band“ löscht und die Nachfrage bestätigt, die nennt, dass der Song für alle Mitglieder von „Band“ gelöscht wird
- **THEN** ist „Intro“ bei allen Mitgliedern nicht mehr vorhanden

#### Scenario: Löschen bei nicht erreichbarem Server
- **WHEN** der Nutzer „Intro“ aus „Band“ bei nicht erreichbarem Server löschen will
- **THEN** meldet die App, dass der Server nicht erreichbar ist, und „Intro“ bleibt erhalten

#### Scenario: Offline geändert, inzwischen gelöscht
- **GIVEN** ein Mitglied ändert „Intro“ offline
- **AND** ein anderes Mitglied löscht „Intro“
- **WHEN** das erste Gerät wieder den Server erreicht
- **THEN** ist „Intro“ dort nicht mehr vorhanden

### Requirement: Änderungen abgleichen
Änderungen an einem Workbook-Song MUST auf jedem anderen Gerät, das die App geöffnet hat und den Server erreicht, binnen 5 Sekunden erscheinen, ohne Neuladen. Neue, umbenannte und gelöschte Songs und Workbooks und geänderte Mitgliedschaften MUST ebenso erscheinen.

#### Scenario: Zwei Geräte
- **GIVEN** derselbe Nutzer hat „Band“ auf zwei Geräten geöffnet
- **WHEN** er auf dem ersten Gerät in „Intro“ einen Takt hinzufügt
- **THEN** zeigt das zweite Gerät den Takt binnen 5 Sekunden

#### Scenario: Neuer Song eines anderen Mitglieds
- **WHEN** anna@example.com einen Song zu „Band“ hinzufügt, während ein anderes Mitglied die Startseite mit gewähltem „Band“ geöffnet hat
- **THEN** erscheint der Song binnen 5 Sekunden bei diesem Mitglied in „Band“, und die Anzahl im Eintrag „Band“ steigt

### Requirement: Offline arbeiten
Workbook-Songs MUST ohne erreichbaren Server lesbar und bearbeitbar bleiben. Offline gemachte Änderungen MUST lokal gespeichert und beim nächsten Kontakt mit dem Server übertragen werden. Gleichzeitige Änderungen MUST nach den Regeln von `song-merge` zusammengeführt werden. Solange ein angemeldeter Nutzer oder ein Nutzer mit bekannten Workbooks den Server nicht erreicht, MUST die App oben einen Hinweis zeigen, dass er weiterarbeiten kann und die Änderungen später übertragen werden.

#### Scenario: Hinweis ohne Verbindung
- **GIVEN** der Nutzer ist angemeldet
- **WHEN** der Server nicht mehr erreichbar ist
- **THEN** zeigt die App einen Hinweis, dass er weiterarbeiten kann und die Änderungen später übertragen werden
- **AND** der Hinweis verschwindet, sobald der Server wieder erreichbar ist

#### Scenario: Gleichzeitig offline
- **GIVEN** zwei Mitglieder sind offline
- **WHEN** das eine in „Intro“ den Groove „Verse“ ändert, das andere in „Intro“ einen Takt hinzufügt, und beide wieder den Server erreichen
- **THEN** zeigen beide Geräte „Intro“ mit beiden Änderungen

#### Scenario: Neuladen ohne Server
- **WHEN** der Nutzer die App bei nicht erreichbarem Server neu lädt
- **THEN** zeigt die Startseite seine Workbooks mit ihren Songs wie zuletzt bekannt

### Requirement: Unabhängig entstandene Fassung
Hat ein Gerät einen Song unter derselben ID wie ein Workbook-Song, ohne dass er von dessen Fassung auf dem Server abstammt (etwa durch Import einer Exportdatei auf einem neuen Gerät), MUST der Server die Fassung des Geräts zurückweisen. Das Gerät MUST die Fassung des Servers übernehmen und seine eigene als Song „<Titel> (Kopie)“ mit neuer ID in „Meine Songs“ behalten.

#### Scenario: Import vor dem Abgleich
- **GIVEN** „Intro“ gehört zu „Band“
- **AND** ein Mitglied importiert auf einem neuen Gerät eine Exportdatei mit „Intro“, bevor die Songs von „Band“ dort angekommen sind
- **WHEN** das Gerät den Server erreicht
- **THEN** steht in „Band“ „Intro“ in der Fassung des Servers
- **AND** in „Meine Songs“ steht „Intro (Kopie)“ in der Fassung der Datei

### Requirement: Ungültige Song-Daten
Der Server MUST eine übertragene Fassung zurückweisen, wenn der entstehende Song die Strukturregeln des Dateiformats verletzt oder die Übertragung 2 MB überschreitet. Der gespeicherte Song MUST dann unverändert bleiben.

#### Scenario: Kaputte Daten
- **WHEN** ein Client für „Intro“ Daten sendet, aus denen kein gültiger Song entsteht
- **THEN** weist der Server sie zurück und die anderen Mitglieder sehen „Intro“ unverändert

### Requirement: Abmelden mit Workbook-Songs
Beim Abmelden MUST die App noch nicht übertragene Änderungen an Workbook-Songs übertragen und die Workbook-Songs danach vom Gerät entfernen. Können Änderungen nicht übertragen werden, MUST die App vor dem Abmelden nachfragen und darauf hinweisen, dass sie verloren gehen. Für eigene Songs gilt `account-songs`.

#### Scenario: Abmelden
- **WHEN** der Nutzer sich abmeldet
- **THEN** zeigt die Startseite den Bereich „Workbooks“ nicht mehr

#### Scenario: Abmelden mit nicht übertragenen Änderungen
- **GIVEN** der Nutzer hat „Intro“ aus „Band“ offline geändert
- **WHEN** er sich abmeldet
- **THEN** fragt die App nach, ob die nicht übertragenen Änderungen verworfen werden sollen
- **AND** lehnt er ab, bleibt er angemeldet und die Änderung bleibt erhalten

### Requirement: Song in ein Workbook ziehen
Eine Kachel aus „Meine Songs“ MUST sich auf einen Eintrag der Seitenleiste oder in den Bereich des gewählten Workbooks ziehen lassen; Loslassen dort MUST den Song in dieses Workbook verschieben. Während des Ziehens MUST die Kachel dem Zeiger folgen. Loslassen außerhalb eines Ziels und Escape MUST nichts ändern. Kacheln in einem Workbook MUST sich nicht ziehen lassen.

#### Scenario: Auf einen Eintrag ziehen
- **GIVEN** „Band“ ist gewählt
- **WHEN** der Nutzer die Kachel „Skizze“ aus „Meine Songs“ auf den Eintrag „Proberaum“ zieht und loslässt
- **THEN** steht „Skizze“ in „Proberaum“ und nicht mehr in „Meine Songs“

#### Scenario: In das gewählte Workbook ziehen
- **GIVEN** „Band“ ist gewählt
- **WHEN** der Nutzer die Kachel „Skizze“ in den Bereich von „Band“ zieht und loslässt
- **THEN** steht „Skizze“ in „Band“

#### Scenario: Abbrechen
- **WHEN** der Nutzer „Skizze“ zieht und über „Meine Songs“ loslässt oder Escape drückt
- **THEN** bleibt „Skizze“ in „Meine Songs“ und nichts wird übertragen

#### Scenario: Klick statt Ziehen
- **WHEN** der Nutzer die Kachel „Skizze“ anklickt, ohne sie zu bewegen
- **THEN** zeigt die App die Doppelseite von „Skizze“

#### Scenario: Workbook-Kachel
- **WHEN** der Nutzer die Kachel „Uprising“ in „Band“ zu ziehen versucht
- **THEN** wird sie nicht gezogen und bleibt in „Band“

### Requirement: Hervorhebung beim Ziehen
Während des Ziehens MUST nur das Ziel unter dem Zeiger hervorgehoben sein, andere Flächen wie „+ Song“ MUST unverändert bleiben. Ist das Ziel das gewählte Workbook, MUST sein Eintrag mit dem Bereich zusammen eine hervorgehobene Fläche bilden.

#### Scenario: Ziel hervorgehoben
- **WHEN** der Nutzer „Skizze“ über den Eintrag „Proberaum“ zieht
- **THEN** ist „Proberaum“ als Ziel hervorgehoben

#### Scenario: Gewähltes Workbook als Ziel
- **GIVEN** „Band“ ist gewählt
- **WHEN** der Nutzer „Skizze“ über den Bereich von „Band“ zieht
- **THEN** sind Eintrag und Bereich von „Band“ als eine Fläche mit gemeinsamem Rand hervorgehoben
- **AND** „+ Song“ in „Band“ ist nicht hervorgehoben
