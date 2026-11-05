# Spec Delta

## MODIFIED Requirements

### Requirement: Breadcrumbs
Die Doppelseite MUST über ihrer Überschrift den Pfad „Songs“ zeigen, der Pattern-Editor den Pfad „Songs“ und den Songtitel. „Songs“ MUST zur Song-Liste führen, der Songtitel zur Doppelseite des Songs. Die Song-Liste MUST keine eigene Überschrift „Songs“ tragen; sie beginnt mit „Meine Songs“. Eigene Zurück-Knöpfe MUST es nicht mehr geben.

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
