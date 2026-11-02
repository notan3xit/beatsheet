# Spec Delta

## MODIFIED Requirements

### Requirement: Maßstabsgetreue Struktur
Jedes Segment MUST mit seinem Namen als Überschrift erscheinen, gefolgt von seinen Takten in Zeilen zu höchstens 4 Takten. Die Breite eines Takts MUST proportional zu seiner Länge in Beats sein, bei gleicher Breite pro Beat im ganzen Song. Jeder Block MUST in einer neuen Zeile beginnen; damit beginnt auch jedes Segment in einer neuen Zeile.

#### Scenario: Unterschiedliche Taktlängen
- **WHEN** ein Segment die Takte 4/4, 2/4, 4/4 enthält
- **THEN** ist der 2/4-Takt halb so breit wie die 4/4-Takte

#### Scenario: Zeilenumbruch
- **WHEN** ein Segment 6 Takte hat
- **THEN** stehen 4 Takte in der ersten und 2 Takte in der zweiten Zeile

#### Scenario: Neuer Block in neuer Zeile
- **WHEN** ein Segment aus einem Block mit 2 Takten und einem Block mit 4 Takten besteht
- **THEN** stehen die 2 Takte des ersten Blocks allein in der ersten Zeile und die 4 Takte des zweiten Blocks in der zweiten Zeile

### Requirement: Fill-Blöcke
Ein Fill MUST als durchgehender Block in seiner Farbe und mit seinem Namen über genau den Beats erscheinen, die er überdeckt. Der überdeckte Teil eines Grooves entfällt. Der Fill-Block MUST keine Noten zeigen, auch wenn er weniger als einen Takt überdeckt. Taktstriche innerhalb eines Fill-Blocks MUST dezent sichtbar bleiben. Fällt ein Fill über einen Zeilenumbruch, MUST er an der Zeilengrenze geteilt und als fortgesetzt gekennzeichnet werden.

#### Scenario: Kurzer Fill
- **WHEN** Takt 4 (4/4) einen Fill mit 1 Beat hat
- **THEN** zeigt Takt 4 den Groove über 3 Beats und rechts einen Fill-Block über 1 Beat mit dem Namen des Fills und ohne Noten

#### Scenario: Fill über Taktgrenze
- **WHEN** ein Fill mit 6 Beats am Ende von Takt 4 endet
- **THEN** reicht ein Fill-Block von Beat 3 in Takt 3 bis zum Ende von Takt 4, mit dezentem Taktstrich dazwischen

#### Scenario: Fill über Zeilenumbruch
- **WHEN** ein Fill mit 8 Beats am Ende von Takt 5 endet und Takt 4 am Zeilenende steht
- **THEN** erscheint der Fill am Ende der ersten Zeile und am Anfang der zweiten Zeile, jeweils als Fortsetzung gekennzeichnet

## ADDED Requirements

### Requirement: Kompakte Zeilen
Eine Zeile der Struktur MUST als flacher Balken erscheinen, höchstens 1,5rem hoch, mit höchstens 0,5rem Abstand zur nächsten Zeile desselben Segments. Groove- und Fill-Namen MUST in den Balken passen oder gekürzt werden. Der vollständige Name MUST dann als Tooltip verfügbar sein.

#### Scenario: Zeilenmaße
- **WHEN** die Struktur eines Songs dargestellt wird
- **THEN** ist jede Zeile höchstens 1,5rem hoch und der Zeilenabstand innerhalb eines Segments beträgt höchstens 0,5rem

#### Scenario: Langer Groove-Name
- **WHEN** ein 2/4-Takt den Groove „Verse-Beat mit Ghost Notes“ hat
- **THEN** zeigt der Takt den Namen gekürzt und der vollständige Name ist als Tooltip verfügbar

### Requirement: Leseansicht ohne Bedienelemente
Solange nichts ausgewählt ist, MUST die linke Seite außer der Struktur selbst keine Eingabefelder, Auswahllisten oder Aktionsknöpfe zeigen. Takte und Segmentnamen MUST auswählbar sein. Ein Song ohne Segmente MUST stattdessen genau eine Aktion „Erstes Segment anlegen“ anbieten.

#### Scenario: Song mit Struktur ohne Auswahl
- **WHEN** der Nutzer einen Song mit den Segmenten Intro und Verse öffnet und nichts auswählt
- **THEN** zeigt die linke Seite keine Eingabefelder, Auswahllisten oder Aktionsknöpfe, nur die auswählbaren Segmentnamen und Takte

#### Scenario: Leerer Song
- **WHEN** der Nutzer einen Song ohne Segmente öffnet
- **THEN** bietet die linke Seite nur die Aktion „Erstes Segment anlegen“ an

### Requirement: Bearbeiten über die Auswahl
Ein Klick auf einen Segmentnamen MUST das Segment auswählen. Ein Klick auf einen Takt MUST diesen Takt auswählen, Shift+Klick einen Bereich in Songreihenfolge. Es MUST immer nur entweder ein Segment oder Takte ausgewählt sein. Zur Auswahl MUST ein Popover an der Auswahl erscheinen, das alle Aktionen für diese Auswahl enthält. Escape oder ein Klick außerhalb von Struktur und Popover MUST die Auswahl aufheben und das Popover schließen.

#### Scenario: Takte auswählen
- **WHEN** der Nutzer Takt 5 anklickt und mit Shift Takt 8 anklickt
- **THEN** sind die Takte 5 bis 8 ausgewählt und ein Popover für diese Takte ist geöffnet

#### Scenario: Segment auswählen
- **WHEN** Takt 2 ausgewählt ist und der Nutzer auf den Segmentnamen „Verse“ klickt
- **THEN** ist nur das Segment „Verse“ ausgewählt und das Popover zeigt die Aktionen für das Segment

#### Scenario: Auswahl aufheben
- **WHEN** Takte ausgewählt sind und der Nutzer Escape drückt
- **THEN** ist nichts mehr ausgewählt und kein Popover ist geöffnet

### Requirement: Segment-Popover
Das Popover eines ausgewählten Segments MUST anbieten: den Namen ändern, das Segment nach oben oder unten verschieben, duplizieren, ein Segment danach einfügen, einen Block unten anfügen und das Segment nach Bestätigung löschen. Nicht mögliche Verschiebungen MUST deaktiviert sein.

#### Scenario: Segment umbenennen
- **WHEN** der Nutzer das Segment „Verse“ auswählt, im Popover den Namen in „Strophe“ ändert und Enter drückt
- **THEN** heißt das Segment „Strophe“

#### Scenario: Erstes Segment nicht nach oben
- **WHEN** der Nutzer das erste Segment auswählt
- **THEN** ist im Popover „nach oben“ deaktiviert

### Requirement: Takt-Popover
Das Popover ausgewählter Takte MUST anbieten: den Groove und den Fill setzen, die Taktlänge um einen Beat verringern oder erhöhen, einen Takt davor oder danach einfügen und die Takte löschen. Bei genau einem ausgewählten Takt MUST es zusätzlich die Akzente des Takts bearbeiten lassen. Nicht mögliche Längenänderungen MUST deaktiviert sein.

#### Scenario: Akzente nur bei einem Takt
- **WHEN** der Nutzer die Takte 1 bis 2 auswählt
- **THEN** bietet das Popover Groove, Fill, Länge, Einfügen und Löschen an, aber keine Akzente

#### Scenario: Taktlänge an den Grenzen
- **WHEN** der Nutzer einen Takt mit 1 Beat auswählt
- **THEN** ist „Taktlänge verringern“ deaktiviert

### Requirement: Pattern-Chips
Groove und Fill MUST im Takt-Popover als Chips in der Farbe des jeweiligen Patterns wählbar sein, ergänzt um „neu“ und „kein“. Der Chip „neu“ MUST die Farbe zeigen, die ein neues Pattern erhalten würde. Ein Chip MUST als gewählt erscheinen, wenn alle ausgewählten Takte dieses Pattern haben.

#### Scenario: Groove-Chips
- **WHEN** der Song die Grooves A (blau) und B (grün) hat und der Nutzer Takte mit Groove A auswählt
- **THEN** zeigt das Popover die Chips A, B, „neu“ in der nächsten freien Farbe und „kein“, und A erscheint als gewählt

#### Scenario: Gemischte Auswahl
- **WHEN** der Nutzer einen Takt mit Groove A und einen Takt mit Groove B auswählt
- **THEN** erscheint keiner der Groove-Chips als gewählt
