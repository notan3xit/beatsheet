# navigation Specification

## Purpose

Zeigt, wo im Notenbuch man sich befindet (Song-Liste, Doppelseite eines Songs, Pattern-Editor), erlaubt den direkten Wechsel auf jede übergeordnete Ebene und benennt das aktuelle Blatt mit einer Überschrift, die sich an Ort und Stelle umbenennen lässt.

## ADDED Requirements

### Requirement: Breadcrumbs
Die Doppelseite MUST über ihrer Überschrift den Pfad „Songs“ zeigen, der Pattern-Editor den Pfad „Songs“ und den Songtitel. „Songs“ MUST zur Song-Liste führen, der Songtitel zur Doppelseite des Songs. Die Song-Liste MUST die Überschrift „Songs“ tragen. Eigene Zurück-Knöpfe MUST es nicht mehr geben.

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

### Requirement: Editierbare Überschrift
Songtitel auf der Doppelseite und Patternname im Pattern-Editor MUST als Überschrift erscheinen. Ein Klick auf die Überschrift MUST sie in ein Eingabefeld mit dem aktuellen Namen verwandeln. Enter oder Verlassen des Felds MUST den Namen übernehmen, Escape MUST die Eingabe verwerfen. Danach MUST wieder die Überschrift erscheinen. Ein abgelehnter Name MUST den bisherigen Namen stehen lassen.

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
