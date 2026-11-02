# Spec Delta

## MODIFIED Requirements

### Requirement: Patternseite
Die rechte Seite MUST jedes Pattern des Songs genau einmal mit Name, Farbe, Länge und Noten zeigen, Grooves vor Fills, jeweils in der Reihenfolge des ersten Auftretens in der Struktur, nicht verwendete Patterns danach alphabetisch. Ein leeres Pattern MUST als leeres System seiner Länge erscheinen, mit einer Viertelpause pro Beat.

#### Scenario: Reihenfolge
- **WHEN** die Struktur zuerst Groove B, dann Groove A verwendet und Groove C nicht verwendet wird
- **THEN** zeigt die rechte Seite B, A, C und danach die Fills

#### Scenario: Leerer Platzhalter
- **WHEN** der Groove „Verse-Beat“ mit 4 Beats noch keine Schläge hat
- **THEN** zeigt die rechte Seite „Verse-Beat“ mit einem leeren System aus 4 Viertelpausen

## ADDED Requirements

### Requirement: Zweispaltige Patternseite
Die Pattern-Karten der rechten Seite MUST in zwei Spalten stehen, in der Reihenfolge der Anforderung „Patternseite“ zeilenweise von links nach rechts. Zwischen den Kartenzeilen MUST derselbe Abstand stehen wie zwischen den Segmenten der Struktur. Ein Pattern mit höchstens 4 Beats MUST eine Spalte belegen, ein längeres MUST beide Spalten belegen.

#### Scenario: Kurze Patterns nebeneinander
- **WHEN** der Song die Grooves A und B mit je 4 Beats hat
- **THEN** stehen die Karten von A und B nebeneinander, jede eine Spalte breit

#### Scenario: Langes Pattern über beide Spalten
- **WHEN** der Song den Groove A mit 8 Beats und den Fill f1 mit 2 Beats hat
- **THEN** belegt die Karte von A beide Spalten und die Karte von f1 eine Spalte

### Requirement: Kompakte Pattern-Karten
Die Noten auf der Patternseite MUST verkleinert und in allen Karten im gleichen Maßstab erscheinen, ohne Rahmen. Reicht die Breite einer Karte nicht, MUST die Notation in der Karte umbrechen. Die Kopfzeile MUST einzeilig sein und nur den Namen in der Farbe des Patterns und die Länge zeigen. Ein Klick auf den Namen MUST den Pattern-Editor öffnen. Die Knöpfe zum Anlegen MUST als „+ Groove“ und „+ Fill“ erscheinen.

#### Scenario: Gleicher Maßstab
- **WHEN** der Song einen Groove mit 4 Beats und einen Groove mit 8 Beats hat, beide mit Vierteln auf der Snare
- **THEN** ist ein Beat in beiden Karten gleich breit

#### Scenario: Kopfzeile
- **WHEN** die rechte Seite den Groove „Verse-Beat“ mit 4 Beats zeigt
- **THEN** enthält seine Kopfzeile nur „Verse-Beat“ und „4 Beats“, ohne „Groove“ und ohne einen Knopf „Bearbeiten“

#### Scenario: Name öffnet den Editor
- **WHEN** der Nutzer auf der rechten Seite auf den Namen „Verse-Beat“ klickt
- **THEN** öffnet sich der Pattern-Editor für „Verse-Beat“

#### Scenario: Anlegen-Knöpfe
- **WHEN** der Nutzer einen Song öffnet
- **THEN** zeigt die rechte Seite die Knöpfe „+ Groove“ und „+ Fill“, die wie „Neuer Groove“ und „Neuer Fill“ funktionieren
