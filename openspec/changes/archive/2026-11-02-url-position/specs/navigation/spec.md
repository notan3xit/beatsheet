# Spec Delta

## ADDED Requirements

### Requirement: Position in der Adresse
Die Adresse der App MUST die aktuelle Ansicht nennen: die Song-Liste, die Doppelseite eines Songs oder den Pattern-Editor eines Patterns, jeweils über die IDs von Song und Pattern. Die Adresse MUST jeder Navigation in der App folgen. Beim Start MUST die App die Ansicht öffnen, die die Adresse nennt.

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

### Requirement: Browser-Verlauf
Jede Navigation in der App MUST einen Eintrag im Browser-Verlauf anlegen. Zurück und Vor im Browser MUST zur jeweiligen Ansicht wechseln.

#### Scenario: Zurück aus dem Pattern-Editor
- **WHEN** der Nutzer von der Doppelseite von „Hysteria“ den Groove „Verse“ öffnet und im Browser Zurück wählt
- **THEN** zeigt die App die Doppelseite von „Hysteria“

#### Scenario: Vor nach Zurück
- **WHEN** der Nutzer danach im Browser Vor wählt
- **THEN** zeigt die App wieder den Pattern-Editor von „Verse“

### Requirement: Unbekannte Adresse
Nennt die Adresse einen Song, den es nicht gibt, MUST die App die Song-Liste zeigen. Nennt sie ein Pattern, das es im genannten Song nicht gibt, MUST die App die Doppelseite des Songs zeigen. Eine nicht lesbare Adresse MUST zur Song-Liste führen. In allen Fällen MUST die Adresse danach die tatsächlich gezeigte Ansicht nennen, ohne einen zusätzlichen Verlaufseintrag.

#### Scenario: Gelöschter Song
- **WHEN** die App mit einer Adresse gestartet wird, deren Song nicht existiert
- **THEN** zeigt die App die Song-Liste und die Adresse nennt die Song-Liste

#### Scenario: Gelöschtes Pattern
- **WHEN** die App mit einer Adresse gestartet wird, die „Hysteria“ und ein nicht existierendes Pattern nennt
- **THEN** zeigt die App die Doppelseite von „Hysteria“ und die Adresse nennt diese Doppelseite

#### Scenario: Pattern löschen im Editor
- **WHEN** der Nutzer im Pattern-Editor das Pattern löscht
- **THEN** nennt die Adresse die Doppelseite des Songs
