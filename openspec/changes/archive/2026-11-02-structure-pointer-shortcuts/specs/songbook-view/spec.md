# Spec Delta

## MODIFIED Requirements

### Requirement: Leseansicht ohne Bedienelemente
Solange nichts ausgewählt ist und sich der Mauszeiger nicht über der Struktur befindet, MUST die linke Seite außer der Struktur selbst keine Eingabefelder, Auswahllisten oder Aktionsknöpfe zeigen. Takte und Segmentnamen MUST auswählbar sein. Ein Song ohne Segmente MUST stattdessen genau eine Aktion „Erstes Segment anlegen“ anbieten.

#### Scenario: Song mit Struktur ohne Auswahl
- **WHEN** der Nutzer einen Song mit den Segmenten Intro und Verse öffnet und nichts auswählt
- **THEN** zeigt die linke Seite keine Eingabefelder, Auswahllisten oder Aktionsknöpfe, nur die auswählbaren Segmentnamen und Takte

#### Scenario: Leerer Song
- **WHEN** der Nutzer einen Song ohne Segmente öffnet
- **THEN** bietet die linke Seite nur die Aktion „Erstes Segment anlegen“ an

#### Scenario: Maus verlässt die Struktur
- **WHEN** der Nutzer mit der Maus über eine Zeile fährt und die Struktur wieder verlässt
- **THEN** zeigt die linke Seite keine Einfüge-Knöpfe mehr

## ADDED Requirements

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
