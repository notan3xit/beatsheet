# songbook-view Specification

## Purpose

Stellt einen Song als Doppelseite dar: links die Struktur maßstabsgetreu als Fahrplan mit Fills und Akzenten als Erinnerung, rechts jedes Pattern des Songs genau einmal in Noten.

## Requirements

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

### Requirement: Groove-Kennzeichnung im Takt
Ein Takt mit Groove MUST in der Farbe des Grooves erscheinen. Den Groove-Namen MUST er nur zeigen, wenn er der erste Takt seines Segments ist oder sein Groove sich gegenüber dem vorigen Takt des Segments ändert; sonst MUST der Name nur als Tooltip verfügbar sein. Ist der Groove länger als der Takt, MUST zusätzlich angezeigt werden, mit welchem Beat des Grooves der Takt beginnt. Ein Takt ohne Groove MUST neutral und ohne Namen erscheinen.

#### Scenario: Zweitaktiger Groove
- **WHEN** vier 4/4-Takte im selben Block Groove A mit 8 Beats haben
- **THEN** erscheinen alle vier Takte in der Farbe von A mit den Startbeats 1, 5, 1, 5
- **AND** nur der erste Takt zeigt den Namen „A“

#### Scenario: Eintaktiger Groove
- **WHEN** ein 4/4-Takt einen Groove mit 4 Beats hat
- **THEN** zeigt er nur den Groove-Namen ohne Startbeat

#### Scenario: Groove-Wechsel
- **WHEN** ein Segment die Takte A, A, B, B, A hat
- **THEN** zeigen nur der erste, dritte und fünfte Takt einen Namen: „A“, „B“, „A“

#### Scenario: Neues Segment
- **WHEN** das Segment „Verse“ mit Groove A endet und das Segment „Chorus“ mit Groove A beginnt
- **THEN** zeigt der erste Takt von „Chorus“ den Namen „A“

#### Scenario: Takt ohne Groove dazwischen
- **WHEN** ein Segment die Takte A, ohne Groove, A hat
- **THEN** zeigen der erste und der dritte Takt den Namen „A“

#### Scenario: Folgetakt mit Tooltip
- **WHEN** der zweite von zwei Takten mit Groove A keinen Namen zeigt
- **THEN** ist „A“ dort als Tooltip verfügbar

### Requirement: Fill-Blöcke
Ein Fill MUST als durchgehender Block in seiner Farbe über genau den Beats erscheinen, die er überdeckt, mit seiner Kurzschrift und seinem Namen als Tooltip. Der überdeckte Teil eines Grooves entfällt. Der Fill-Block MUST keine Noten zeigen. Taktstriche innerhalb eines Fill-Blocks MUST dezent sichtbar bleiben. Fällt ein Fill über einen Zeilenumbruch, MUST er an der Zeilengrenze geteilt und als fortgesetzt gekennzeichnet werden.

#### Scenario: Kurzer Fill
- **WHEN** Takt 4 (4/4) einen Fill mit 1 Beat hat
- **THEN** zeigt Takt 4 den Groove über 3 Beats und rechts einen Fill-Block über 1 Beat mit seiner Kurzschrift, ohne Noten
- **AND** der Name des Fills ist als Tooltip verfügbar, aber nicht als Text sichtbar

#### Scenario: Fill über Taktgrenze
- **WHEN** ein Fill mit 6 Beats am Ende von Takt 4 endet
- **THEN** reicht ein Fill-Block von Beat 3 in Takt 3 bis zum Ende von Takt 4, mit dezentem Taktstrich dazwischen

#### Scenario: Fill über Zeilenumbruch
- **WHEN** ein Fill mit 8 Beats am Ende von Takt 5 endet und Takt 4 am Zeilenende steht
- **THEN** erscheint der Fill am Ende der ersten Zeile und am Anfang der zweiten Zeile, jeweils als Fortsetzung gekennzeichnet
- **AND** jeder Teil zeigt die Kurzschrift seines Zeitraums

### Requirement: Akzent-Markierungen
Jeder Akzent MUST als Markierung mit dem Kürzel des Instruments an seiner Position über dem Takt erscheinen, ohne Groove- oder Fill-Darstellung zu verdecken.

#### Scenario: Crash auf der Eins
- **WHEN** Takt 1 einen Crash-Akzent auf Beat 1, Position 1 hat
- **THEN** zeigt Takt 1 am linken Rand oben die Markierung „Cr“

### Requirement: Patternseite
Die rechte Seite MUST jedes Pattern des Songs genau einmal mit Name, Farbe, Länge und Noten zeigen, Grooves vor Fills, jeweils in der Reihenfolge des ersten Auftretens in der Struktur, nicht verwendete Patterns danach alphabetisch. Ein leeres Pattern MUST als leeres System seiner Länge erscheinen, mit Pausen nach der Anforderung „Leeres Pattern“ der Notation.

#### Scenario: Reihenfolge
- **WHEN** die Struktur zuerst Groove B, dann Groove A verwendet und Groove C nicht verwendet wird
- **THEN** zeigt die rechte Seite B, A, C und danach die Fills

#### Scenario: Leerer Platzhalter
- **WHEN** der Groove „Verse-Beat“ mit 4 Beats noch keine Schläge hat
- **THEN** zeigt die rechte Seite „Verse-Beat“ mit einem leeren System und einer Ganzen Pause

### Requirement: Kompakte Zeilen
Eine Zeile der Struktur MUST als flacher Balken erscheinen, höchstens 1,5rem hoch, mit höchstens 0,5rem Abstand zur nächsten Zeile desselben Segments. Groove- und Fill-Namen MUST in den Balken passen oder gekürzt werden. Der vollständige Name MUST dann als Tooltip verfügbar sein.

#### Scenario: Zeilenmaße
- **WHEN** die Struktur eines Songs dargestellt wird
- **THEN** ist jede Zeile höchstens 1,5rem hoch und der Zeilenabstand innerhalb eines Segments beträgt höchstens 0,5rem

#### Scenario: Langer Groove-Name
- **WHEN** ein 2/4-Takt den Groove „Verse-Beat mit Ghost Notes“ hat
- **THEN** zeigt der Takt den Namen gekürzt und der vollständige Name ist als Tooltip verfügbar

### Requirement: Leseansicht ohne Bedienelemente
Solange nichts ausgewählt ist und sich der Mauszeiger nicht über der Struktur befindet, MUST die linke Seite außer der Struktur selbst keine Eingabefelder, Auswahllisten oder Aktionsknöpfe zeigen. Takte und Segmentnamen MUST auswählbar sein. Ein entsperrter Song ohne Segmente MUST stattdessen genau eine Aktion „Erstes Segment anlegen“ anbieten.

#### Scenario: Song mit Struktur ohne Auswahl
- **WHEN** der Nutzer einen Song mit den Segmenten Intro und Verse öffnet und nichts auswählt
- **THEN** zeigt die linke Seite keine Eingabefelder, Auswahllisten oder Aktionsknöpfe, nur die auswählbaren Segmentnamen und Takte

#### Scenario: Leerer Song
- **WHEN** der Nutzer einen Song ohne Segmente und ohne Patterns öffnet
- **THEN** bietet die linke Seite nur die Aktion „Erstes Segment anlegen“ an

#### Scenario: Gesperrter Song ohne Segmente
- **WHEN** der Nutzer einen Song öffnet, der Patterns, aber keine Segmente hat
- **THEN** bietet die linke Seite keine Aktion an

#### Scenario: Maus verlässt die Struktur
- **WHEN** der Nutzer mit der Maus über eine Zeile fährt und die Struktur wieder verlässt
- **THEN** zeigt die linke Seite keine Einfüge-Knöpfe mehr

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

### Requirement: Segment-Popover
Das Popover eines ausgewählten Segments MUST anbieten: den Namen ändern, das Segment nach oben oder unten verschieben, duplizieren, ein Segment danach einfügen, einen Block unten anfügen, das Segment nach Bestätigung löschen, ab dem Segment abspielen („Ab hier abspielen“) und das Segment in Schleife abspielen („In Schleife abspielen“). Nicht mögliche Verschiebungen MUST deaktiviert sein.

#### Scenario: Segment umbenennen
- **WHEN** der Nutzer das Segment „Verse“ auswählt, im Popover den Namen in „Strophe“ ändert und Enter drückt
- **THEN** heißt das Segment „Strophe“

#### Scenario: Erstes Segment nicht nach oben
- **WHEN** der Nutzer das erste Segment auswählt
- **THEN** ist im Popover „nach oben“ deaktiviert

#### Scenario: Abspielen im Segment-Popover
- **WHEN** der Nutzer das Segment „Chorus“ auswählt
- **THEN** bietet das Popover „Ab hier abspielen“ und „In Schleife abspielen“ an

### Requirement: Takt-Popover
Das Popover ausgewählter Takte MUST anbieten: den Groove und den Fill setzen, die Taktlänge um einen Beat verringern oder erhöhen, einen Takt davor oder danach einfügen, die Takte löschen, ab dem ersten ausgewählten Takt abspielen („Ab hier abspielen“) und die ausgewählten Takte in Schleife abspielen („In Schleife abspielen“). Bei genau einem ausgewählten Takt MUST es zusätzlich die Akzente des Takts bearbeiten lassen. Nicht mögliche Längenänderungen MUST deaktiviert sein.

#### Scenario: Akzente nur bei einem Takt
- **WHEN** der Nutzer die Takte 1 bis 2 auswählt
- **THEN** bietet das Popover Groove, Fill, Länge, Einfügen, Löschen und die beiden Abspiel-Aktionen an, aber keine Akzente

#### Scenario: Taktlänge an den Grenzen
- **WHEN** der Nutzer einen Takt mit 1 Beat auswählt
- **THEN** ist „Taktlänge verringern“ deaktiviert

### Requirement: Pattern-Chips
Groove und Fill MUST im Takt-Popover als Chips in der Farbe des jeweiligen Patterns wählbar sein, ergänzt um „neu“ und „kein“. Der Chip „neu“ MUST die Farbe zeigen, die ein neues Pattern erhalten würde. Ein Chip MUST als gewählt erscheinen, wenn alle ausgewählten Takte dieses Pattern haben. Ein gewählter Chip MUST in seiner Patternfarbe gefüllt sein und einen Haken zeigen, ohne zusätzlichen Rahmen in einer anderen Farbe.

#### Scenario: Groove-Chips
- **WHEN** der Song die Grooves A (blau) und B (grün) hat und der Nutzer Takte mit Groove A auswählt
- **THEN** zeigt das Popover die Chips „kein“, „neu“ in der nächsten freien Farbe, A und B, und A erscheint als gewählt

#### Scenario: Gemischte Auswahl
- **WHEN** der Nutzer einen Takt mit Groove A und einen Takt mit Groove B auswählt
- **THEN** erscheint keiner der Groove-Chips als gewählt

#### Scenario: Gewählter Chip mit Haken
- **WHEN** der Nutzer Takte mit Groove A auswählt
- **THEN** zeigt der Chip A einen Haken und die anderen Groove-Chips nicht

### Requirement: Takt einfügen beim Überfahren
Befindet sich der Mauszeiger über einer Zeile, MUST an jeder Taktgrenze dieser Zeile ein Einfüge-Knopf erscheinen, der dort einen Takt mit Länge und Groove des linken Nachbarn einfügt. Am Anfang der ersten Zeile eines Blocks MUST der Knopf einen Takt vor dem ersten Takt einfügen, mit dessen Länge und Groove. Bei Touch-Bedienung MUST kein Einfüge-Knopf erscheinen.

#### Scenario: Takt zwischen zwei Takten
- **WHEN** der Nutzer mit der Maus über die Zeile mit den Takten 1 bis 4 fährt und den Knopf zwischen Takt 2 und Takt 3 anklickt
- **THEN** steht an Position 3 ein neuer Takt mit Länge und Groove von Takt 2

#### Scenario: Takt am Blockanfang
- **WHEN** der Nutzer mit der Maus über die erste Zeile eines Blocks aus 3/4-Takten fährt und den Knopf am Zeilenanfang anklickt
- **THEN** beginnt der Block mit einem neuen 3/4-Takt

#### Scenario: Touch
- **WHEN** der Nutzer eine Zeile mit dem Finger berührt
- **THEN** erscheint kein Einfüge-Knopf

### Requirement: Block und Segment einfügen beim Überfahren
Befindet sich der Mauszeiger über einem Segment, MUST unter dessen letzter Zeile ein Knopf „Block anfügen“ erscheinen und hinter dem Segment ein Knopf „Segment einfügen“. Sie MUST dieselben Vorgaben verwenden wie die entsprechenden Aktionen im Segment-Popover. Ein so eingefügtes Segment MUST danach ausgewählt sein.

#### Scenario: Block anfügen
- **WHEN** der Nutzer mit der Maus über das Segment „Verse“ fährt und „Block anfügen“ anklickt
- **THEN** hat „Verse“ unten einen weiteren Block wie beim Anfügen über das Segment-Popover

#### Scenario: Segment einfügen
- **WHEN** der Nutzer bei der Reihenfolge Intro, Chorus mit der Maus über „Intro“ fährt und „Segment einfügen“ anklickt
- **THEN** ist die Reihenfolge Intro, „Segment 3“, Chorus und „Segment 3“ ist ausgewählt

### Requirement: Patterns auf Takte ziehen
Die Pattern-Karten der rechten Seite MUST sich auf einen Takt der linken Seite ziehen lassen. Ein Groove MUST dann der Groove, ein Fill der Fill am Ende der Zieltakte werden. Zieltakte sind alle ausgewählten Takte, wenn der Takt unter dem Zeiger ausgewählt ist, sonst nur dieser Takt. Während des Ziehens MUST die Zieltakte hervorgehoben sein.

#### Scenario: Groove auf einen Takt
- **WHEN** der Nutzer die Karte von Groove A auf Takt 3 zieht und loslässt
- **THEN** hat Takt 3 Groove A und alle anderen Takte bleiben unverändert

#### Scenario: Groove auf die Auswahl
- **WHEN** die Takte 5 bis 8 ausgewählt sind und der Nutzer Groove B auf Takt 6 zieht
- **THEN** haben die Takte 5 bis 8 Groove B

#### Scenario: Fill auf einen Takt
- **WHEN** der Nutzer die Karte von Fill f1 auf Takt 4 zieht
- **THEN** hat Takt 4 den Fill f1 und sein Groove bleibt unverändert

#### Scenario: Hervorhebung beim Ziehen
- **WHEN** die Takte 5 bis 8 ausgewählt sind und der Nutzer Groove B über Takt 6 hält
- **THEN** sind die Takte 5 bis 8 als Ziel hervorgehoben

### Requirement: Neues Pattern ziehen
Die Knöpfe „Neuer Groove“ und „Neuer Fill“ der rechten Seite MUST sich wie Pattern-Karten auf Takte ziehen lassen. Beim Loslassen auf einem Takt MUST ein leeres Pattern mit automatischem Namen und der nächsten freien Farbe entstehen (Groove 4 Beats, Fill 1 Beat) und den Zieltakten zugewiesen werden. Ein Klick ohne Ziehen MUST wie bisher ein neues Pattern anlegen und im Pattern-Editor öffnen.

#### Scenario: Neuen Groove ziehen
- **WHEN** der Song Groove 1 hat und der Nutzer „Neuer Groove“ auf Takt 1 zieht
- **THEN** gibt es einen leeren „Groove 2“ in der nächsten freien Farbe und Takt 1 hat diesen Groove
- **AND** die Doppelseite bleibt geöffnet

#### Scenario: Klick auf „Neuer Groove“
- **WHEN** der Nutzer „Neuer Groove“ anklickt, ohne zu ziehen
- **THEN** öffnet sich der Pattern-Editor mit einem neuen Groove

### Requirement: Ziehen abbrechen
Lässt der Nutzer ein gezogenes Pattern außerhalb eines Takts los oder drückt er während des Ziehens Escape, MUST sich nichts ändern; insbesondere MUST kein neues Pattern entstehen.

#### Scenario: Loslassen neben der Struktur
- **WHEN** der Nutzer Groove A auf die rechte Seite zurückzieht und loslässt
- **THEN** sind alle Takte unverändert

#### Scenario: Escape beim Ziehen eines neuen Fills
- **WHEN** der Nutzer „Neuer Fill“ über Takt 2 zieht und Escape drückt
- **THEN** hat der Song keinen neuen Fill und Takt 2 ist unverändert

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

### Requirement: Hervorhebung von Auswahl und Ablegeziel
Ausgewählte Takte und Ablegeziele beim Ziehen MUST über ihre Balken hervorgehoben werden: Groove- und Fill-Balken mit vollem Rahmen in der Patternfarbe und kräftigerer Füllung. Ein Fill MUST hervorgehoben sein, wenn sein Takt oder ein von ihm ganz überdeckter Takt hervorgehoben ist. Ein Takt ohne Groove MUST einen grauen Schatten-Groove zeigen. Der Takt selbst MUST NOT umrahmt werden; gestrichelte Linien MUST NOT vorkommen.

#### Scenario: Ausgewählte Takte
- **WHEN** der Nutzer die Takte 2 bis 3 eines Blocks mit Groove A auswählt
- **THEN** sind genau die Groove-Balken von Takt 2 und 3 hervorgehoben

#### Scenario: Fill im ausgewählten Takt
- **WHEN** Takt 4 Groove A und den Fill f1 hat und der Nutzer Takt 4 auswählt
- **THEN** sind der Groove-Balken von Takt 4 und der Fill f1 hervorgehoben

#### Scenario: Leerer Takt
- **WHEN** der Nutzer einen Takt ohne Groove auswählt
- **THEN** zeigt dieser Takt einen grauen Schatten-Groove
- **AND** nicht ausgewählte Takte ohne Groove zeigen keinen

#### Scenario: Ablegeziel beim Ziehen
- **WHEN** der Nutzer Groove B über Takt 6 hält, der nicht ausgewählt ist
- **THEN** ist der Groove-Balken von Takt 6 hervorgehoben wie bei einer Auswahl

### Requirement: Fill-Kurzschrift
Die Kurzschrift MUST jeden Schlag an seinem Zeitpunkt als Buchstabe in einer von drei Höhenstufen zeigen: oben `'` Crash und `t` Tom 1/2, Mitte `v` Snare mit Flam und `s` Snare, unten `f` Floor Tom und `k` Kick. Hi-Hat, Ride, Hi-Hat-Pedal und Ghost Notes MUST entfallen. Pro Zeitpunkt und Stufe MUST höchstens ein Buchstabe stehen, mit Vorrang `'` vor `t`, `v` vor `s`, `f` vor `k`.

#### Scenario: Tom-Run
- **WHEN** ein Fill in Sechzehnteln Snare auf 1 und 2, Tom 1 auf 3 und 4 und im zweiten Beat Floor Tom auf allen vier Positionen hat
- **THEN** zeigt die Kurzschrift `s s` in der Mitte, `t t` oben und `f f f f` unten, jeweils an ihren Zeitpunkten

#### Scenario: Gleichzeitige Schläge
- **WHEN** auf derselben Position Kick und Crash liegen
- **THEN** stehen dort `'` oben und `k` unten

#### Scenario: Flam und Ghost Note
- **WHEN** ein Fill einen Snare-Flam auf Position 1 und eine Snare-Ghost-Note auf Position 2 hat
- **THEN** zeigt die Kurzschrift `v` auf Position 1 und auf Position 2 nichts

#### Scenario: Hi-Hat entfällt
- **WHEN** ein Fill nur Hi-Hat-Schläge hat
- **THEN** zeigt die Kurzschrift keinen Buchstaben

### Requirement: Aufbau des Takt-Popovers
Das Takt-Popover MUST in sichtbar getrennte Abschnitte gegliedert sein, von oben nach unten: Titel und Abspiel-Knöpfe; Groove, Fill und Länge; Akzente, sofern genau ein Takt ausgewählt ist; „Takt davor“, „Takt danach“ und „Löschen“. „Löschen“ MUST rechts abgesetzt stehen.

#### Scenario: Einzelner Takt
- **WHEN** der Nutzer einen Takt auswählt
- **THEN** zeigt das Popover von oben nach unten Abspiel-Knöpfe, Groove, Fill, Länge, Akzente und die Aktionen zum Einfügen und Löschen, wobei eine Trennlinie zwischen Akzenten und Aktionen steht

#### Scenario: Mehrere Takte
- **WHEN** der Nutzer die Takte 1 bis 2 auswählt
- **THEN** folgen auf Groove, Fill und Länge direkt die Aktionen zum Einfügen und Löschen, ohne Abschnitt für Akzente

### Requirement: Abspiel-Knöpfe zuoberst
Im Segment-Popover MUST die Abspiel-Knöpfe über allen anderen Elementen stehen.

#### Scenario: Segment auswählen
- **WHEN** der Nutzer ein Segment auswählt
- **THEN** stehen die Abspiel-Knöpfe über dem Feld für den Segmentnamen

### Requirement: Einheitliche Zeilen für Groove, Fill und Länge
Die Zeilen Groove, Fill und Länge MUST mit ihrer Beschriftung beginnen, gefolgt von zwei gleich breiten Knöpfen `-` und `+` in derselben Spalte aller Zeilen. Dahinter MUST bei Groove und Fill die Chips der Patterns stehen, bei der Länge der aktuelle Wert. `-` MUST bei Groove und Fill „kein“ bedeuten und `+` „neu“, bei der Länge „verringern“ und „erhöhen“.

#### Scenario: Reihenfolge bei den Grooves
- **WHEN** der Song die Grooves A und B hat und der Nutzer einen Takt auswählt
- **THEN** zeigt die Zeile Groove in dieser Reihenfolge `-`, `+`, A und B

#### Scenario: Reihenfolge bei der Länge
- **WHEN** der Nutzer einen Takt mit 4 Beats auswählt
- **THEN** zeigt die Zeile Länge in dieser Reihenfolge `-`, `+` und „4/4“

### Requirement: Kompakte Akzente im Takt-Popover
Eingabe und Knopf für einen neuen Akzent MUST in einer Reihe stehen, in den Maßen der Chips. Der Knopf MUST `+` zeigen und „Akzent hinzufügen“ heißen. Die Auswahl von Beat und Position MUST dies als Tooltip nennen. Vorhandene Akzente MUST als Chips darunter stehen, mit Beat und Position, dann dem Kürzel des Instruments, etwa „1.1 Cr“. Ohne Akzente MUST diese Zeile entfallen.

#### Scenario: Reihe für einen neuen Akzent
- **WHEN** der Nutzer einen Takt auswählt
- **THEN** stehen Instrument, Beat, Position und der Knopf `+` in einer Reihe hinter der Beschriftung „Akzente“

#### Scenario: Chip eines Akzents
- **WHEN** Takt 1 einen Crash-Akzent auf Beat 1, Position 1 hat und der Nutzer Takt 1 auswählt
- **THEN** zeigt das Popover den Chip „1.1 Cr“, dessen Knopf „Crash auf 1.1 entfernen“ heißt

#### Scenario: Ohne Akzente
- **WHEN** der Nutzer einen Takt ohne Akzente auswählt
- **THEN** zeigt das Popover keine Akzent-Chips
