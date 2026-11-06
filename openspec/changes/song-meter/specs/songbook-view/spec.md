# Spec Delta

## MODIFIED Requirements

### Requirement: Neues Pattern ziehen
Die Knöpfe „Neuer Groove“ und „Neuer Fill“ der rechten Seite MUST sich wie Pattern-Karten auf Takte ziehen lassen. Beim Loslassen auf einem Takt MUST ein leeres Pattern mit automatischem Namen und der nächsten freien Farbe entstehen (Groove so lang wie der Standard-Takt des Songs, Fill 1 Beat) und den Zieltakten zugewiesen werden. Ein Klick ohne Ziehen MUST wie bisher ein neues Pattern anlegen und im Pattern-Editor öffnen.

#### Scenario: Neuen Groove ziehen
- **WHEN** der Song Groove 1 hat und der Nutzer „Neuer Groove“ auf Takt 1 zieht
- **THEN** gibt es einen leeren „Groove 2“ in der nächsten freien Farbe und Takt 1 hat diesen Groove
- **AND** die Doppelseite bleibt geöffnet

#### Scenario: Neuen Groove im Standard-Takt ziehen
- **WHEN** der Song in 3/4 steht und der Nutzer „Neuer Groove“ auf Takt 1 zieht
- **THEN** hat der neue Groove 3 Beats

#### Scenario: Klick auf „Neuer Groove“
- **WHEN** der Nutzer „Neuer Groove“ anklickt, ohne zu ziehen
- **THEN** öffnet sich der Pattern-Editor mit einem neuen Groove

### Requirement: Kompakte Pattern-Karten
Die Noten auf der Patternseite MUST verkleinert und in allen Karten im gleichen Maßstab erscheinen, ohne eigenen Rahmen. Reicht die Breite der Patternseite nicht, MUST die Notation in der Karte umbrechen. Eine Fill-Karte MUST wie die Fill-Blöcke der Struktur ringsum in ihrer Farbe gerahmt und mit ihrer Farbe getönt erscheinen, eine Groove-Karte wie die Groove-Balken mit einer Kante links in ihrer Farbe und ohne Tönung. Die Kopfzeile MUST einzeilig sein und nur den Namen in der Farbe des Patterns und die Länge zeigen, dahinter die Taktart, wenn sie vom Standard-Takt des Songs abweicht. Passt der Name nicht neben die Länge, MUST er mit „…“ gekürzt erscheinen und vollständig als Tooltip verfügbar sein. Ein Klick auf den Namen MUST den Pattern-Editor öffnen. Die Knöpfe zum Anlegen MUST als „+ Groove“ und „+ Fill“ erscheinen.

#### Scenario: Gleicher Maßstab
- **WHEN** der Song einen Groove mit 4 Beats und einen Groove mit 8 Beats hat, beide mit Vierteln auf der Snare
- **THEN** ist ein Beat in beiden Karten gleich breit

#### Scenario: Fill und Groove unterscheiden
- **WHEN** die rechte Seite den Groove „Verse-Beat“ und den Fill „Tom-Fill“ zeigt
- **THEN** ist die Karte von „Tom-Fill“ ringsum gerahmt und getönt und die Karte von „Verse-Beat“ hat nur eine Kante links

#### Scenario: Kopfzeile
- **WHEN** die rechte Seite den Groove „Verse-Beat“ mit 4 Beats zeigt, der dem Song folgt
- **THEN** enthält seine Kopfzeile nur „Verse-Beat“ und „4 Beats“, ohne „Groove“, ohne Taktart und ohne einen Knopf „Bearbeiten“

#### Scenario: Abweichende Taktart
- **WHEN** der Song in 4/4 steht und die rechte Seite die „Bridge“ mit 7 Beats und der eigenen Taktart 7/4 zeigt
- **THEN** enthält ihre Kopfzeile „Bridge“, „7 Beats“ und „7/4“

#### Scenario: Eigene Taktart gleich dem Standard-Takt
- **WHEN** der Song in 4/4 steht und ein Groove die eigene Taktart 4/4 hat
- **THEN** enthält seine Kopfzeile keine Taktart

#### Scenario: Langer Name
- **WHEN** die rechte Seite in einem 390 px breiten Fenster den Groove „Verse-Beat mit Ghost Notes und offener Hi-Hat im Refrain“ zeigt
- **THEN** ist seine Kopfzeile einzeilig, der Name endet mit „…“ und der vollständige Name ist als Tooltip verfügbar

#### Scenario: Name öffnet den Editor
- **WHEN** der Nutzer auf der rechten Seite auf den Namen „Verse-Beat“ klickt
- **THEN** öffnet sich der Pattern-Editor für „Verse-Beat“

#### Scenario: Anlegen-Knöpfe
- **WHEN** der Nutzer einen Song öffnet
- **THEN** zeigt die rechte Seite die Knöpfe „+ Groove“ und „+ Fill“, die wie „Neuer Groove“ und „Neuer Fill“ funktionieren
