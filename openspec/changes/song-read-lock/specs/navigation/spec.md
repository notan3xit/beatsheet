# Spec Delta

## ADDED Requirements

### Requirement: Gleiche Höhe der Kopfzeile
Pfad und Überschrift MUST auf der Doppelseite und im Pattern-Editor denselben Abstand zum oberen Rand des Inhalts und zueinander haben.

#### Scenario: Wechsel in den Pattern-Editor
- **WHEN** der Nutzer von der Doppelseite in den Pattern-Editor wechselt
- **THEN** stehen Pfad und Überschrift in beiden Ansichten auf derselben Höhe

## MODIFIED Requirements

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
