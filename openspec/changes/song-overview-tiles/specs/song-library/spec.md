# Spec Delta

## MODIFIED Requirements

### Requirement: Song-Liste
Die Startseite MUST oben „Meine Songs“ mit den lokalen und den zum Account gehörenden Songs zeigen (siehe `account-songs`), darunter angemeldet die Workbooks (siehe `workbooks`). Songs MUST als Kacheln erscheinen, alphabetisch nach Titel, nebeneinander und umbrechend. Jede Kachel MUST das Motiv des Songs (siehe `song-motif`) und darunter Titel, Anzahl der Takte und Tempo zeigen. Ist „Meine Songs“ leer, MUST ein Hinweis zeigen, wie man den ersten Song anlegt. Die Auswahl einer Kachel MUST die Doppelseite des Songs öffnen.

#### Scenario: Sortierte Liste
- **WHEN** die Songs „Uprising“ (32 Takte, Tempo 128) und „Hysteria“ (0 Takte, Tempo 120) in „Meine Songs“ existieren
- **THEN** zeigt „Meine Songs“ zuerst die Kachel „Hysteria“ mit „0 Takte“ und „♩ = 120“, dann „Uprising“ mit „32 Takte“ und „♩ = 128“

#### Scenario: Leere Liste
- **WHEN** keine Songs existieren
- **THEN** zeigt „Meine Songs“ einen Hinweis zum Anlegen des ersten Songs

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

### Requirement: Song über die Kachel „+ Song“ anlegen
„Meine Songs“ MUST als letzte Kachel „+ Song“ zeigen. Sie MUST einen Song „Neuer Song“ in „Meine Songs“ anlegen und seine Doppelseite öffnen, wo er sich umbenennen lässt.

#### Scenario: Doppelseite des neuen Songs
- **WHEN** der Nutzer in „Meine Songs“ „+ Song“ wählt
- **THEN** zeigt die App die Doppelseite von „Neuer Song“
