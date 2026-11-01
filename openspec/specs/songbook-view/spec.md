# songbook-view Specification

## Purpose

Stellt einen Song als Doppelseite dar: links die Struktur maßstabsgetreu als Fahrplan mit Fills und Akzenten als Erinnerung, rechts jedes Pattern des Songs genau einmal in Noten.

## Requirements

### Requirement: Doppelseite
Die Ansicht eines Songs MUST links die Struktur und rechts die Patterns des Songs nebeneinander zeigen. Die Auswahl eines Patterns auf der rechten Seite MUST den Pattern-Editor für dieses Pattern öffnen, von dem aus man zur Doppelseite zurückkehrt.

#### Scenario: Song öffnen
- **WHEN** der Nutzer einen Song mit Struktur und Patterns öffnet
- **THEN** zeigt die linke Seite die Segmente und die rechte Seite die Patterns

#### Scenario: Pattern bearbeiten
- **WHEN** der Nutzer rechts den Groove „Verse-Beat“ auswählt, einen Schlag setzt und zurückkehrt
- **THEN** zeigt die Doppelseite den geänderten Groove

### Requirement: Maßstabsgetreue Struktur
Jedes Segment MUST mit seinem Namen als Überschrift erscheinen, gefolgt von seinen Takten in Zeilen zu höchstens 4 Takten. Die Breite eines Takts MUST proportional zu seiner Länge in Beats sein, bei gleicher Breite pro Beat im ganzen Song. Jedes Segment MUST in einer neuen Zeile beginnen.

#### Scenario: Unterschiedliche Taktlängen
- **WHEN** ein Segment die Takte 4/4, 2/4, 4/4 enthält
- **THEN** ist der 2/4-Takt halb so breit wie die 4/4-Takte

#### Scenario: Zeilenumbruch
- **WHEN** ein Segment 6 Takte hat
- **THEN** stehen 4 Takte in der ersten und 2 Takte in der zweiten Zeile

### Requirement: Groove-Kennzeichnung im Takt
Ein Takt mit Groove MUST den Groove-Namen in der Farbe des Grooves zeigen. Ist der Groove länger als der Takt, MUST zusätzlich angezeigt werden, mit welchem Beat des Grooves der Takt beginnt. Ein Takt ohne Groove MUST neutral und ohne Namen erscheinen.

#### Scenario: Zweitaktiger Groove
- **WHEN** vier 4/4-Takte im selben Block Groove A mit 8 Beats haben
- **THEN** zeigen die Takte „A“ in der Farbe von A mit den Startbeats 1, 5, 1, 5

#### Scenario: Eintaktiger Groove
- **WHEN** ein 4/4-Takt einen Groove mit 4 Beats hat
- **THEN** zeigt er nur den Groove-Namen ohne Startbeat

### Requirement: Fill-Blöcke
Ein Fill MUST als durchgehender Block in seiner Farbe über genau den Beats erscheinen, die er überdeckt. Der überdeckte Teil eines Grooves entfällt. Überdeckt ein Fill weniger als einen Takt, MUST der Block die Noten des Fills verkleinert zeigen. Taktstriche innerhalb eines Fill-Blocks MUST dezent sichtbar bleiben. Fällt ein Fill über einen Zeilenumbruch, MUST er an der Zeilengrenze geteilt und als fortgesetzt gekennzeichnet werden.

#### Scenario: Kurzer Fill
- **WHEN** Takt 4 (4/4) einen Fill mit 1 Beat hat
- **THEN** zeigt Takt 4 den Groove über 3 Beats und rechts einen Fill-Block über 1 Beat mit verkleinerten Noten

#### Scenario: Fill über Taktgrenze
- **WHEN** ein Fill mit 6 Beats am Ende von Takt 4 endet
- **THEN** reicht ein Fill-Block von Beat 3 in Takt 3 bis zum Ende von Takt 4, mit dezentem Taktstrich dazwischen

#### Scenario: Fill über Zeilenumbruch
- **WHEN** ein Fill mit 8 Beats am Ende von Takt 5 endet und Takt 4 am Zeilenende steht
- **THEN** erscheint der Fill am Ende der ersten Zeile und am Anfang der zweiten Zeile, jeweils als Fortsetzung gekennzeichnet

### Requirement: Akzent-Markierungen
Jeder Akzent MUST als Markierung mit dem Kürzel des Instruments an seiner Position über dem Takt erscheinen, ohne Groove- oder Fill-Darstellung zu verdecken.

#### Scenario: Crash auf der Eins
- **WHEN** Takt 1 einen Crash-Akzent auf Beat 1, Position 1 hat
- **THEN** zeigt Takt 1 am linken Rand oben die Markierung „Cr“

### Requirement: Patternseite
Die rechte Seite MUST jedes Pattern des Songs genau einmal mit Name, Farbe, Länge und Noten zeigen, Grooves vor Fills, jeweils in der Reihenfolge des ersten Auftretens in der Struktur, nicht verwendete Patterns danach alphabetisch. Ein leeres Pattern MUST statt der Noten den Hinweis „noch leer“ zeigen.

#### Scenario: Reihenfolge
- **WHEN** die Struktur zuerst Groove B, dann Groove A verwendet und Groove C nicht verwendet wird
- **THEN** zeigt die rechte Seite B, A, C und danach die Fills

#### Scenario: Leerer Platzhalter
- **WHEN** der Groove „Verse-Beat“ noch keine Schläge hat
- **THEN** zeigt die rechte Seite „Verse-Beat“ mit dem Hinweis „noch leer“
