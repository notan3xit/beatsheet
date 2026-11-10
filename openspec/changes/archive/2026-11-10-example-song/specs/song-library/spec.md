## MODIFIED Requirements

### Requirement: Song-Liste
Oben auf der Startseite MUST „Meine Songs“ die lokalen und die zum Account gehörenden Songs zeigen (`account-songs`), darunter angemeldet die Workbooks (`workbooks`). Songs MUST als umbrechende Kacheln in der Reihenfolge nach `song-order` erscheinen, jede mit Motiv (`song-motif`), Titel, Taktzahl, Tempo und letzter Änderung (`song-activity`). Ein leeres „Meine Songs“ MUST nur die Kacheln „+ Beispiel-Song“ und „+ Song“ zeigen. Die Auswahl einer Kachel MUST die Doppelseite des Songs öffnen.

#### Scenario: Sortierte Liste
- **WHEN** die Songs „Uprising“ (32 Takte, Tempo 128) und „Hysteria“ (0 Takte, Tempo 120) in „Meine Songs“ existieren
- **THEN** zeigt „Meine Songs“ zuerst die Kachel „Hysteria“ mit „0 Takte“ und „♩ = 120“, dann „Uprising“ mit „32 Takte“ und „♩ = 128“

#### Scenario: Leere Liste
- **WHEN** keine Songs existieren
- **THEN** zeigt „Meine Songs“ die Kacheln „+ Beispiel-Song“ und „+ Song“ in dieser Reihenfolge und keinen Hinweistext

#### Scenario: Song öffnen
- **WHEN** der Nutzer die Kachel „Hysteria“ auswählt
- **THEN** zeigt die App die Doppelseite von „Hysteria“

#### Scenario: Song per Tastatur öffnen
- **WHEN** der Nutzer die Kachel „Hysteria“ mit der Tastatur fokussiert und Enter drückt
- **THEN** zeigt die App die Doppelseite von „Hysteria“

#### Scenario: Neuer Song landet in „Meine Songs“
- **WHEN** der Nutzer in „Meine Songs“ „+ Song“ wählt und danach zur Startseite zurückkehrt
- **THEN** steht „Neuer Song“ in „Meine Songs“

## ADDED Requirements

### Requirement: Beispiel-Song anlegen
Solange „Meine Songs“ keinen Song enthält, MUST dort vor „+ Song“ die Kachel „+ Beispiel-Song“ stehen, angemeldet wie abgemeldet. Sie MUST in „Meine Songs“ einen Song „Beispiel-Song“ mit neuer ID und ohne Verlauf anlegen und seine Doppelseite öffnen. Er MUST Patterns und Segmente enthalten und danach ein gewöhnlicher eigener Song sein. Enthält „Meine Songs“ einen Song, MUST die Kachel fehlen.

#### Scenario: Beispiel-Song anlegen
- **GIVEN** „Meine Songs“ ist leer
- **WHEN** der Nutzer „+ Beispiel-Song“ wählt
- **THEN** zeigt die App die Doppelseite von „Beispiel-Song“ mit Segmenten links und Patterns rechts
- **AND** nach der Rückkehr zur Startseite steht „Beispiel-Song“ in „Meine Songs“, ohne die Kachel „+ Beispiel-Song“

#### Scenario: Kachel fehlt bei vorhandenem Song
- **GIVEN** „Skizze“ liegt in „Meine Songs“
- **WHEN** der Nutzer die Startseite öffnet
- **THEN** zeigt „Meine Songs“ keine Kachel „+ Beispiel-Song“

#### Scenario: Kachel nach dem Löschen des letzten Songs
- **GIVEN** „Beispiel-Song“ ist der einzige Song in „Meine Songs“
- **WHEN** der Nutzer ihn löscht
- **THEN** zeigt „Meine Songs“ wieder „+ Beispiel-Song“ und „+ Song“

#### Scenario: Zweimal angelegt
- **GIVEN** der Nutzer hat „+ Beispiel-Song“ gewählt und den Song danach gelöscht
- **WHEN** er erneut „+ Beispiel-Song“ wählt
- **THEN** hat der neue „Beispiel-Song“ eine andere ID als der gelöschte

#### Scenario: Angemeldet angelegt
- **GIVEN** der Nutzer ist angemeldet und hat keine eigenen Songs
- **WHEN** er „+ Beispiel-Song“ wählt
- **THEN** gehört „Beispiel-Song“ zu seinem Account und erscheint auf seinen anderen Geräten in „Meine Songs“
