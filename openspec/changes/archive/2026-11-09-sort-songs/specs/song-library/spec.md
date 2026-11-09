## MODIFIED Requirements

### Requirement: Song-Liste
Oben auf der Startseite MUST „Meine Songs“ die lokalen und die zum Account gehörenden Songs zeigen (`account-songs`), darunter angemeldet die Workbooks (`workbooks`). Songs MUST als umbrechende Kacheln in der Reihenfolge nach `song-order` erscheinen, jede mit Motiv (`song-motif`), Titel, Taktzahl, Tempo und letzter Änderung (`song-activity`). Ein leeres „Meine Songs“ MUST zeigen, wie man den ersten Song anlegt. Die Auswahl einer Kachel MUST die Doppelseite des Songs öffnen.

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
