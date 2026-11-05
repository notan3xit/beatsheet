# navigation Specification

## Purpose

Zeigt, wo im Notenbuch man sich befindet (Song-Liste, Doppelseite eines Songs, Pattern-Editor), erlaubt den direkten Wechsel auf jede übergeordnete Ebene und benennt das aktuelle Blatt mit einer Überschrift, die sich an Ort und Stelle umbenennen lässt.

## Requirements

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

### Requirement: Editierbare Überschrift
Songtitel auf der Doppelseite und Patternname im Pattern-Editor MUST als Überschrift erscheinen. Bei entsperrtem Song MUST ein Klick auf die Überschrift sie in ein Eingabefeld mit dem aktuellen Namen verwandeln. Enter oder Verlassen des Felds MUST den Namen übernehmen, Escape MUST die Eingabe verwerfen. Danach MUST wieder die Überschrift erscheinen. Ein abgelehnter Name MUST den bisherigen Namen stehen lassen.

#### Scenario: Songtitel ändern
- **WHEN** der Nutzer auf die Überschrift „Neuer Song“ klickt, „Uprising“ eingibt und Enter drückt
- **THEN** lautet die Überschrift „Uprising“ und der Song heißt „Uprising“

#### Scenario: Patternname beim Verlassen übernehmen
- **WHEN** der Nutzer im Pattern-Editor auf die Überschrift „Groove 1“ klickt, „Verse“ eingibt und das Feld verlässt
- **THEN** heißt das Pattern „Verse“ und die Überschrift lautet „Verse“

#### Scenario: Escape verwirft
- **WHEN** der Nutzer auf die Überschrift „Hysteria“ klickt, „Xyz“ eingibt und Escape drückt
- **THEN** lautet die Überschrift weiterhin „Hysteria“ und der Song ist unverändert

#### Scenario: Leerer Name
- **WHEN** der Nutzer die Überschrift „Hysteria“ leert und Enter drückt
- **THEN** lautet die Überschrift weiterhin „Hysteria“

#### Scenario: Gesperrter Song
- **WHEN** der Song gesperrt ist und der Nutzer auf die Überschrift „Hysteria“ klickt
- **THEN** erscheint kein Eingabefeld und die Überschrift lautet weiterhin „Hysteria“

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

### Requirement: Gleiche Höhe der Kopfzeile
Pfad und Überschrift MUST auf der Doppelseite und im Pattern-Editor denselben Abstand zum oberen Rand des Inhalts und zueinander haben.

#### Scenario: Wechsel in den Pattern-Editor
- **WHEN** der Nutzer von der Doppelseite in den Pattern-Editor wechselt
- **THEN** stehen Pfad und Überschrift in beiden Ansichten auf derselben Höhe
