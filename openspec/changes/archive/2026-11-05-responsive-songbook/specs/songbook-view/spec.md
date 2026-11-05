# Spec Delta

## MODIFIED Requirements

### Requirement: Doppelseite
Die Ansicht eines Songs MUST links die Struktur und rechts die Patterns des Songs nebeneinander zeigen, solange daneben die Struktur in voller Breite pro Beat und die Patternseite mit einer Spalte Platz haben. Nebeneinander MUST der übrige Platz im Verhältnis 3:2 an Struktur und Patternseite gehen, bis die Struktur ihre größte Breite pro Beat und die Patternseite ihre größte Breite von zwei Spalten erreicht hat; weiterer Platz bleibt frei. Sonst MUST die Patternseite unter der Struktur stehen, und beide Seiten MUST die volle Breite einnehmen. Die Auswahl eines Patterns auf der rechten Seite MUST den Pattern-Editor für dieses Pattern öffnen, von dem aus man zur Doppelseite zurückkehrt.

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
- **THEN** ist die Struktur breiter als in einem 1024 px breiten Fenster und die Patternseite höchstens so breit wie zwei Spalten

### Requirement: Maßstabsgetreue Struktur
Jedes Segment MUST mit seinem Namen als Überschrift erscheinen, gefolgt von seinen Takten in Zeilen zu höchstens 16 Beats. Ein Takt MUST in der laufenden Zeile stehen, wenn er ganz hineinpasst, sonst in einer neuen. Ein Takt MUST NOT geteilt werden. Die Breite eines Takts MUST proportional zu seinen Beats sein, mit gleicher Breite pro Beat im ganzen Song. Jeder Block und damit jedes Segment MUST in einer neuen Zeile beginnen. Die Breite pro Beat MUST sich nach der Breite der linken Seite richten, sodass eine Zeile von 16 Beats genau hineinpasst, höchstens aber 3rem. Sie MUST mindestens 2,25rem betragen, solange eine Zeile von 16 Beats mit 2,25rem in die linke Seite passt. Die Struktur MUST NOT über die linke Seite hinausragen.

#### Scenario: Unterschiedliche Taktlängen
- **WHEN** ein Segment die Takte 4/4, 2/4, 4/4 enthält
- **THEN** ist der 2/4-Takt halb so breit wie die 4/4-Takte

#### Scenario: Zeilenumbruch
- **WHEN** ein Segment 6 Takte 4/4 hat
- **THEN** stehen 4 Takte in der ersten und 2 Takte in der zweiten Zeile

#### Scenario: Kürzere Takte füllen die Zeile
- **WHEN** ein Block die Takte 3/4, 3/4, 3/4, 3/4, 4/4 enthält
- **THEN** stehen alle 5 Takte in einer Zeile

#### Scenario: Takt passt nicht mehr in die Zeile
- **WHEN** ein Block die Takte 3/4, 3/4, 3/4, 3/4, 3/4, 3/4 enthält
- **THEN** stehen 5 Takte in der ersten und 1 Takt in der zweiten Zeile

#### Scenario: Neuer Block in neuer Zeile
- **WHEN** ein Segment aus einem Block mit 2 Takten und einem Block mit 4 Takten besteht
- **THEN** stehen die 2 Takte des ersten Blocks allein in der ersten Zeile und die 4 Takte des zweiten Blocks in der zweiten Zeile

#### Scenario: Smartphone hochkant
- **WHEN** der Nutzer einen Song mit 16-Beat-Zeilen in einem 390 px breiten Fenster öffnet
- **THEN** stehen weiterhin 4 Takte 4/4 in einer Zeile, die Zeile liegt vollständig in der linken Seite und die Seite ist nicht breiter als das Fenster

### Requirement: Bearbeiten über die Auswahl
Ein Klick auf einen Segmentnamen MUST das Segment auswählen. Ein Klick auf einen Takt MUST diesen Takt auswählen, Shift+Klick einen Bereich in Songreihenfolge. Es MUST immer nur entweder ein Segment oder Takte ausgewählt sein. Zur Auswahl MUST ein Popover an der Auswahl erscheinen, das alle Aktionen für diese Auswahl enthält, die der Sperrzustand des Songs zulässt. Das Popover MUST innerhalb der Breite der linken Seite liegen und nach links rücken, wo es an der Auswahl über den rechten Rand ragen würde. Escape oder ein Klick außerhalb von Struktur und Popover MUST die Auswahl aufheben und das Popover schließen.

#### Scenario: Takte auswählen
- **WHEN** der Nutzer Takt 5 anklickt und mit Shift Takt 8 anklickt
- **THEN** sind die Takte 5 bis 8 ausgewählt und ein Popover für diese Takte ist geöffnet

#### Scenario: Segment auswählen
- **WHEN** Takt 2 ausgewählt ist und der Nutzer auf den Segmentnamen „Verse“ klickt
- **THEN** ist nur das Segment „Verse“ ausgewählt und das Popover zeigt die Aktionen für das Segment

#### Scenario: Auswahl aufheben
- **WHEN** Takte ausgewählt sind und der Nutzer Escape drückt
- **THEN** ist nichts mehr ausgewählt und kein Popover ist geöffnet

#### Scenario: Popover am rechten Rand
- **WHEN** der Nutzer in einem 390 px breiten Fenster den letzten Takt einer 16-Beat-Zeile auswählt
- **THEN** liegt das Takt-Popover vollständig innerhalb der Breite der linken Seite

### Requirement: Zweispaltige Patternseite
Die Pattern-Karten der rechten Seite MUST in zwei Spalten stehen, wenn zwei Karten mit je einem System von 4 Beats in Kartengröße ungeschrumpft nebeneinander passen, sonst in einer Spalte. Die Reihenfolge MUST der Anforderung „Patternseite“ folgen, bei zwei Spalten zeilenweise von links nach rechts. Zwischen den Kartenzeilen MUST derselbe Abstand stehen wie zwischen den Segmenten der Struktur. Bei zwei Spalten MUST ein Pattern, dessen Noten ungeschrumpft in einer Zeile nicht in eine Spalte passen, beide Spalten belegen, sonst eine Spalte.

#### Scenario: Kurze Patterns nebeneinander
- **WHEN** der Song die Grooves A und B mit je 4 Beats hat und die Patternseite breit genug für zwei Spalten ist
- **THEN** stehen die Karten von A und B nebeneinander, jede eine Spalte breit

#### Scenario: Langes Pattern über beide Spalten
- **WHEN** der Song den Groove A mit 8 Beats und den Fill f1 mit 2 Beats hat und die Patternseite breit genug für zwei Spalten ist
- **THEN** belegt die Karte von A beide Spalten und die Karte von f1 eine Spalte

#### Scenario: Dichtes kurzes Pattern über beide Spalten
- **WHEN** der Song den Groove D mit 4 Beats und durchgehender Hi-Hat in 32teln und den Groove A mit 4 Beats in Achteln hat und die Patternseite breit genug für zwei Spalten ist
- **THEN** belegt die Karte von D beide Spalten und die Karte von A eine Spalte

#### Scenario: Schmale Patternseite
- **WHEN** der Nutzer einen Song mit den Grooves A und B mit je 4 Beats in einem 1024 px breiten Fenster öffnet
- **THEN** steht die Karte von B unter der Karte von A und die Noten beider Karten sind nicht verkleinert

### Requirement: Kompakte Pattern-Karten
Die Noten auf der Patternseite MUST verkleinert und in allen Karten im gleichen Maßstab erscheinen, ohne Rahmen. Reicht die Breite einer Karte nicht, MUST die Notation in der Karte umbrechen. Die Kopfzeile MUST einzeilig sein und nur den Namen in der Farbe des Patterns und die Länge zeigen. Passt der Name nicht neben die Länge, MUST er mit „…“ gekürzt erscheinen und vollständig als Tooltip verfügbar sein. Ein Klick auf den Namen MUST den Pattern-Editor öffnen. Die Knöpfe zum Anlegen MUST als „+ Groove“ und „+ Fill“ erscheinen.

#### Scenario: Gleicher Maßstab
- **WHEN** der Song einen Groove mit 4 Beats und einen Groove mit 8 Beats hat, beide mit Vierteln auf der Snare
- **THEN** ist ein Beat in beiden Karten gleich breit

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
