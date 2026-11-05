# Spec Delta

## MODIFIED Requirements

### Requirement: Doppelseite
Die Ansicht eines Songs MUST links die Struktur und rechts die Patterns des Songs nebeneinander zeigen, solange daneben die Struktur in voller Breite pro Beat und die Patternseite mit einer Karte von 4 Beats Platz haben. Nebeneinander MUST der übrige Platz im Verhältnis 3:2 an Struktur und Patternseite gehen, bis die Struktur ihre größte Breite pro Beat und die Patternseite ihre größte Breite von zwei Karten mit je 4 Beats erreicht hat; weiterer Platz bleibt frei. Sonst MUST die Patternseite unter der Struktur stehen, und beide Seiten MUST die volle Breite einnehmen. Die Auswahl eines Patterns auf der rechten Seite MUST den Pattern-Editor für dieses Pattern öffnen, von dem aus man zur Doppelseite zurückkehrt.

#### Scenario: Song öffnen
- **WHEN** der Nutzer einen Song mit Struktur und Patterns öffnet
- **THEN** zeigt die linke Seite die Segmente und die rechte Seite die Patterns

#### Scenario: Pattern bearbeiten
- **WHEN** der Nutzer den Song entsperrt, rechts den Groove „Verse-Beat“ auswählt, einen Schlag setzt und zurückkehrt
- **THEN** zeigt die Doppelseite den geänderten Groove

#### Scenario: Tablet quer
- **WHEN** der Nutzer einen Song mit 16-Beat-Zeilen in einem 1024 px breiten Fenster öffnet
- **THEN** stehen Struktur und Patterns nebeneinander und die Struktur liegt vollständig in ihrer Seite

#### Scenario: Tablet hochkant
- **WHEN** der Nutzer einen Song mit 16-Beat-Zeilen in einem 768 px breiten Fenster öffnet
- **THEN** steht die Patternseite unter der Struktur, beide Seiten sind gleich breit und die Breite pro Beat beträgt mindestens 2,25rem

#### Scenario: Großes Fenster
- **WHEN** der Nutzer einen Song mit 16-Beat-Zeilen in einem 1650 px breiten Fenster öffnet
- **THEN** ist die Struktur breiter als in einem 1024 px breiten Fenster und die Patternseite höchstens so breit wie zwei Karten mit je 4 Beats

### Requirement: Patternseite
Die rechte Seite MUST jedes Pattern des Songs genau einmal mit Name, Farbe, Länge und Noten zeigen, Grooves und Fills gemischt in der Reihenfolge ihres ersten Auftretens in der Struktur. Haben Groove und Fill ihr erstes Auftreten im selben Takt, MUST der Groove vorn stehen. Nicht verwendete Patterns MUST danach folgen, Grooves vor Fills, jeweils alphabetisch. Ein leeres Pattern MUST als leeres System seiner Länge erscheinen, mit Pausen nach der Anforderung „Leeres Pattern“ der Notation.

#### Scenario: Reihenfolge
- **WHEN** die Struktur in Takt 1 Groove B, in Takt 2 Groove B mit Fill f1 und in Takt 3 Groove A verwendet und Groove C und Fill f2 nicht verwendet werden
- **THEN** zeigt die rechte Seite B, f1, A, C, f2

#### Scenario: Leerer Platzhalter
- **WHEN** der Groove „Verse-Beat“ mit 4 Beats noch keine Schläge hat
- **THEN** zeigt die rechte Seite „Verse-Beat“ mit einem leeren System und einer Ganzen Pause

### Requirement: Kompakte Pattern-Karten
Die Noten auf der Patternseite MUST verkleinert und in allen Karten im gleichen Maßstab erscheinen, ohne eigenen Rahmen. Reicht die Breite der Patternseite nicht, MUST die Notation in der Karte umbrechen. Eine Fill-Karte MUST wie die Fill-Blöcke der Struktur ringsum in ihrer Farbe gerahmt und mit ihrer Farbe getönt erscheinen, eine Groove-Karte wie die Groove-Balken mit einer Kante links in ihrer Farbe und ohne Tönung. Die Kopfzeile MUST einzeilig sein und nur den Namen in der Farbe des Patterns und die Länge zeigen. Passt der Name nicht neben die Länge, MUST er mit „…“ gekürzt erscheinen und vollständig als Tooltip verfügbar sein. Ein Klick auf den Namen MUST den Pattern-Editor öffnen. Die Knöpfe zum Anlegen MUST als „+ Groove“ und „+ Fill“ erscheinen.

#### Scenario: Gleicher Maßstab
- **WHEN** der Song einen Groove mit 4 Beats und einen Groove mit 8 Beats hat, beide mit Vierteln auf der Snare
- **THEN** ist ein Beat in beiden Karten gleich breit

#### Scenario: Fill und Groove unterscheiden
- **WHEN** die rechte Seite den Groove „Verse-Beat“ und den Fill „Tom-Fill“ zeigt
- **THEN** ist die Karte von „Tom-Fill“ ringsum gerahmt und getönt und die Karte von „Verse-Beat“ hat nur eine Kante links

#### Scenario: Kopfzeile
- **WHEN** die rechte Seite den Groove „Verse-Beat“ mit 4 Beats zeigt
- **THEN** enthält seine Kopfzeile nur „Verse-Beat“ und „4 Beats“, ohne „Groove“ und ohne einen Knopf „Bearbeiten“

#### Scenario: Langer Name
- **WHEN** die rechte Seite in einem 390 px breiten Fenster den Groove „Verse-Beat mit Ghost Notes und offener Hi-Hat im Refrain“ zeigt
- **THEN** ist seine Kopfzeile einzeilig, der Name endet mit „…“ und der vollständige Name ist als Tooltip verfügbar

#### Scenario: Name öffnet den Editor
- **WHEN** der Nutzer auf der rechten Seite auf den Namen „Verse-Beat“ klickt
- **THEN** öffnet sich der Pattern-Editor für „Verse-Beat“

#### Scenario: Anlegen-Knöpfe
- **WHEN** der Nutzer einen Song öffnet
- **THEN** zeigt die rechte Seite die Knöpfe „+ Groove“ und „+ Fill“, die wie „Neuer Groove“ und „Neuer Fill“ funktionieren

### Requirement: Pattern-Chips
Groove und Fill MUST im Takt-Popover als Chips in der Farbe des jeweiligen Patterns wählbar sein, ergänzt um „neu“ und „kein“. Die Chips der Patterns MUST in der Reihenfolge der Anforderung „Patternseite“ stehen. Der Chip „neu“ MUST die Farbe zeigen, die ein neues Pattern erhalten würde. Ein Chip MUST als gewählt erscheinen, wenn alle ausgewählten Takte dieses Pattern haben. Ein gewählter Chip MUST in seiner Patternfarbe gefüllt sein und einen Haken zeigen, ohne zusätzlichen Rahmen in einer anderen Farbe.

#### Scenario: Groove-Chips
- **WHEN** der Song die Grooves A (blau) und B (grün) hat und der Nutzer Takte mit Groove A auswählt
- **THEN** zeigt das Popover die Chips „kein“, „neu“ in der nächsten freien Farbe, A und B, und A erscheint als gewählt

#### Scenario: Chips in Reihenfolge des Songs
- **WHEN** der Groove A vor dem Groove B angelegt wurde, die Struktur aber zuerst B und dann A verwendet und der Nutzer einen Takt auswählt
- **THEN** zeigt die Zeile Groove die Chips von B vor denen von A

#### Scenario: Gemischte Auswahl
- **WHEN** der Nutzer einen Takt mit Groove A und einen Takt mit Groove B auswählt
- **THEN** erscheint keiner der Groove-Chips als gewählt

#### Scenario: Gewählter Chip mit Haken
- **WHEN** der Nutzer Takte mit Groove A auswählt
- **THEN** zeigt der Chip A einen Haken und die anderen Groove-Chips nicht

## ADDED Requirements

### Requirement: Karten im Fluss
Die Pattern-Karten der rechten Seite MUST in der Reihenfolge der Anforderung „Patternseite“ zeilenweise von links nach rechts stehen. Jede Karte MUST so breit sein wie ihre ungeschrumpften Noten, mindestens aber 7,5rem und höchstens so breit wie die Patternseite. Passt eine Karte nicht mehr in die laufende Zeile, MUST sie am Anfang der nächsten stehen. Zwischen den Kartenzeilen MUST derselbe Abstand stehen wie zwischen den Segmenten der Struktur.

#### Scenario: Kurze Patterns nebeneinander
- **WHEN** der Song die Grooves A und B mit je 4 Beats in Achteln hat und die Patternseite ihre größte Breite hat
- **THEN** stehen die Karten von A und B nebeneinander

#### Scenario: Umbruch in Reihenfolge
- **WHEN** die Patternseite ihre größte Breite hat und der Song nacheinander den Groove A mit 4 Beats, den Fill f1 mit 2 Beats und den Groove B mit 4 Beats verwendet, alle in Achteln
- **THEN** stehen A und f1 in der ersten Zeile und B am Anfang der zweiten

#### Scenario: Langes Pattern
- **WHEN** der Song den Groove A mit 8 Beats in Achteln hat und die Patternseite ihre größte Breite hat
- **THEN** ist die Karte von A so breit wie ihre Noten in einer Zeile und nicht verkleinert

#### Scenario: Kurzer Fill
- **WHEN** der Song den Fill „f“ mit 1 Beat hat
- **THEN** ist seine Karte mindestens 7,5rem breit und die Kopfzeile zeigt „f“ und „1 Beat“ ungekürzt

#### Scenario: Schmale Patternseite
- **WHEN** der Nutzer einen Song mit den Grooves A und B mit je 4 Beats in einem 1024 px breiten Fenster öffnet
- **THEN** steht die Karte von B unter der Karte von A und die Noten beider Karten sind nicht verkleinert

## REMOVED Requirements

### Requirement: Zweispaltige Patternseite
**Reason**: Das Raster aus zwei Spalten reißt Löcher, sobald eine Karte beide Spalten belegt, und verträgt keine kurzen Fills zwischen den Grooves.
**Migration**: Ersetzt durch „Karten im Fluss“: Karten in natürlicher Breite, zeilenweise in der Reihenfolge der Patternseite.
