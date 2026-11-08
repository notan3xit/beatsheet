# Spec Delta

## MODIFIED Requirements

### Requirement: Breadcrumbs
Die Doppelseite MUST über ihrer Überschrift den Pfad „Songs“ zeigen, der Pattern-Editor und der Verlauf den Pfad „Songs“ und den Songtitel. „Songs“ MUST zur Song-Liste führen, der Songtitel zur Doppelseite des Songs. Die Song-Liste MUST keine eigene Überschrift „Songs“ tragen; sie beginnt mit „Meine Songs“. Eigene Zurück-Knöpfe MUST es nicht mehr geben.

#### Scenario: Pfad im Pattern-Editor
- **WHEN** der Nutzer im Song „Hysteria“ den Groove „Verse“ öffnet
- **THEN** zeigt der Pfad „Songs“ und „Hysteria“, darunter die Überschrift „Verse“

#### Scenario: Zur Doppelseite
- **WHEN** der Nutzer im Pattern-Editor im Pfad auf „Hysteria“ klickt
- **THEN** zeigt die App die Doppelseite von „Hysteria“

#### Scenario: Zur Song-Liste aus dem Pattern-Editor
- **WHEN** der Nutzer im Pattern-Editor im Pfad auf „Songs“ klickt
- **THEN** zeigt die App die Song-Liste

#### Scenario: Pfad auf der Doppelseite
- **WHEN** der Nutzer die Doppelseite von „Hysteria“ öffnet
- **THEN** zeigt der Pfad nur „Songs“ und die Überschrift lautet „Hysteria“
- **AND** es gibt keinen Knopf „Alle Songs“

#### Scenario: Song-Liste ohne Überschrift
- **WHEN** der Nutzer die Song-Liste öffnet
- **THEN** ist „Meine Songs“ ihre erste Überschrift, und eine Überschrift „Songs“ gibt es nicht

#### Scenario: Pfad im Verlauf
- **WHEN** der Nutzer den Verlauf von „Hysteria“ öffnet und im Pfad auf „Hysteria“ klickt
- **THEN** zeigt die App die Doppelseite von „Hysteria“

### Requirement: Position in der Adresse
Die Adresse der App MUST die aktuelle Ansicht nennen: die Song-Liste, die Doppelseite eines Songs, den Verlauf eines Songs oder den Pattern-Editor eines Patterns, jeweils über die IDs von Song und Pattern. Die Adresse MUST jeder Navigation in der App folgen. Beim Start MUST die App die Ansicht öffnen, die die Adresse nennt.

#### Scenario: Adresse folgt der Navigation
- **WHEN** der Nutzer in der Song-Liste den Song „Hysteria“ öffnet und dort den Groove „Verse“
- **THEN** nennt die Adresse den Song „Hysteria“ und den Groove „Verse“

#### Scenario: Neuladen im Pattern-Editor
- **WHEN** der Nutzer im Pattern-Editor von „Verse“ die Seite neu lädt
- **THEN** zeigt die App wieder den Pattern-Editor von „Verse“ im Song „Hysteria“

#### Scenario: Link auf einen Song
- **WHEN** die App mit einer Adresse gestartet wird, die die Doppelseite von „Hysteria“ nennt
- **THEN** zeigt die App die Doppelseite von „Hysteria“

#### Scenario: Zur Song-Liste
- **WHEN** der Nutzer im Pfad „Songs“ wählt
- **THEN** nennt die Adresse die Song-Liste

#### Scenario: Neuladen im Verlauf
- **WHEN** der Nutzer im Verlauf von „Hysteria“ die Seite neu lädt
- **THEN** zeigt die App wieder den Verlauf von „Hysteria“
