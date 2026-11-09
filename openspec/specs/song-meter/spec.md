# song-meter Specification

## Purpose

Legt fest, in welcher Taktart ein Song und seine Patterns notiert werden: Der Song gibt einen Standard-Takt vor, dem Patterns folgen, solange sie keine eigene Taktart haben.

## Requirements

### Requirement: Standard-Takt des Songs
Jeder Song MUST einen Standard-Takt haben: 3/4, 4/4, 5/4, 6/4 oder 7/4. Ein neuer Song und ein Song ohne gespeicherten Standard-Takt MUST 4/4 haben. Eine Änderung MUST die Revision des Songs um 1 erhöhen; die Wahl desselben Werts MUST nichts ändern. Ein Beat MUST dabei eine Viertelnote bleiben.

#### Scenario: Neuer Song
- **WHEN** der Nutzer einen neuen Song anlegt
- **THEN** hat der Song den Standard-Takt 4/4

#### Scenario: Standard-Takt ändern
- **WHEN** der Nutzer den Standard-Takt eines Songs mit Revision 4 von 4/4 auf 3/4 ändert
- **THEN** hat der Song den Standard-Takt 3/4 und Revision 5

#### Scenario: Gleicher Wert
- **WHEN** der Nutzer den Standard-Takt auf den Wert setzt, den der Song bereits hat
- **THEN** bleibt die Revision des Songs unverändert

### Requirement: Standard-Takt auf der Doppelseite
Die Doppelseite MUST im Kopf neben dem Song-Tempo das Taktart-Symbol und dahinter den Standard-Takt als „<Beats>/4“ zeigen. Das Symbol MUST gedämpft sein wie der Text. Entsperrt MUST dieselbe Angabe eine Auswahl der erlaubten Werte öffnen und ohne Rahmen und Pfeil wie die Tempoangabe erscheinen.

#### Scenario: Angabe im Kopf
- **WHEN** der Nutzer die Doppelseite eines Songs mit Standard-Takt 3/4 öffnet
- **THEN** steht neben dem Song-Tempo das Taktart-Symbol und dahinter „3/4“

#### Scenario: Auswahl
- **WHEN** der Nutzer im entsperrten Song die Angabe des Standard-Takts öffnet
- **THEN** stehen dort 3/4, 4/4, 5/4, 6/4 und 7/4 in dieser Reihenfolge

### Requirement: Wirksame Taktart eines Patterns
Ein Pattern ohne eigene Taktart MUST dem Standard-Takt seines Songs folgen. Ein Pattern mit eigener Taktart MUST diese behalten, auch wenn sich der Standard-Takt ändert oder denselben Wert annimmt. Grooves und Fills MUST gleich behandelt werden.

#### Scenario: Pattern folgt dem Song
- **WHEN** Groove A keine eigene Taktart hat und der Nutzer den Standard-Takt von 4/4 auf 3/4 ändert
- **THEN** gilt für Groove A die Taktart 3/4

#### Scenario: Eigene Taktart bleibt
- **WHEN** die Bridge die eigene Taktart 7/4 hat und der Nutzer den Standard-Takt von 4/4 auf 3/4 ändert
- **THEN** gilt für die Bridge weiter 7/4

### Requirement: Eigene Taktart im Pattern-Editor
Der Pattern-Editor MUST neben der Länge das Taktart-Symbol und dahinter die wirksame Taktart in der Breite ihres Texts zeigen. Entsperrt MUST das Symbol der Umschalter „Eigene Taktart“ sein. Ohne eigene Taktart MUST die Angabe gedämpfter Text sein, mit eigener Taktart entsperrt eine Auswahl der Werte des Standard-Takts ohne Rahmen und Pfeil wie die Tempoangabe, mit der Auswahlliste des Geräts. Sie MUST keinen Eintrag „Wie Song“ enthalten; das Folgen ist allein der Zustand des Umschalters.

#### Scenario: Pattern folgt dem Song
- **WHEN** der Nutzer in einem Song in 4/4 einen Groove ohne eigene Taktart öffnet
- **THEN** ist der Umschalter „Eigene Taktart“ nicht gewählt und daneben steht „4/4“ als Text

#### Scenario: Eigene Taktart einschalten
- **WHEN** der Nutzer in einem Song in 4/4 den Umschalter einschaltet
- **THEN** hat das Pattern die eigene Taktart 4/4 und daneben steht eine Auswahl mit dem Wert „4/4“

#### Scenario: Eigenen Wert wählen
- **WHEN** der Umschalter gewählt ist und der Nutzer in der Auswahl „7/4“ wählt
- **THEN** hat das Pattern die eigene Taktart 7/4

#### Scenario: Eigene Taktart ausschalten
- **WHEN** ein Pattern die eigene Taktart 7/4 hat, der Song in 4/4 steht und der Nutzer den Umschalter ausschaltet
- **THEN** hat das Pattern keine eigene Taktart mehr und daneben steht „4/4“ als Text

#### Scenario: Rückgängig
- **WHEN** der Nutzer dem Pattern die eigene Taktart 7/4 gibt und danach „Rückgängig“ wählt
- **THEN** hat das Pattern wieder den Wert davor

#### Scenario: Ohne Lücke
- **WHEN** der Nutzer einen gesperrten Groove in 6/4 ansieht
- **THEN** folgt auf „6/4“ die Kennzeichnung „Groove“ im üblichen Abstand der Kopfzeile, ohne zusätzlichen Leerraum

### Requirement: Taktart ändert nur die Darstellung
Eine Änderung des Standard-Takts oder einer eigenen Taktart MUST Länge, Schläge und Wiedergabe der Patterns und die Länge vorhandener Takte unverändert lassen. Es MUST dabei keine Nachfrage erscheinen.

#### Scenario: Vorhandene Takte und Patterns
- **WHEN** der Song einen Groove mit 4 Beats und Takte mit 4 Beats hat und der Nutzer den Standard-Takt auf 3/4 ändert
- **THEN** hat der Groove weiter 4 Beats mit denselben Schlägen und die Takte haben weiter 4 Beats

### Requirement: Taktart in Kopien und Dateien
Das Duplizieren eines Patterns MUST seine eigene Taktart übernehmen. Export und Import MUST Standard-Takt und eigene Taktarten erhalten, ohne neue Schemaversion. Eine Importdatei ohne diese Angaben MUST gültig sein. Ein Standard-Takt oder eine eigene Taktart außerhalb der erlaubten Werte MUST die Importdatei ungültig machen. Das Laden älterer Songs MUST ihre Revision nicht erhöhen.

#### Scenario: Export und Import
- **WHEN** ein Song mit Standard-Takt 3/4 und einem Groove mit eigener Taktart 7/4 exportiert und wieder importiert wird
- **THEN** hat der importierte Song den Standard-Takt 3/4 und der Groove die eigene Taktart 7/4

#### Scenario: Datei ohne Angaben
- **WHEN** der Nutzer eine Datei ohne Standard-Takt und ohne eigene Taktarten importiert
- **THEN** hat der Song den Standard-Takt 4/4 und seine Patterns folgen ihm

#### Scenario: Ungültiger Wert
- **WHEN** die Importdatei einen Song mit Standard-Takt 8 oder ein Pattern mit eigener Taktart 2 enthält
- **THEN** wird die Datei als ungültig abgelehnt

#### Scenario: Pattern duplizieren
- **WHEN** der Nutzer einen Groove mit eigener Taktart 7/4 dupliziert
- **THEN** hat die Kopie die eigene Taktart 7/4

#### Scenario: Älterer Song
- **WHEN** die App einen gespeicherten Song ohne Standard-Takt mit Revision 6 lädt
- **THEN** hat der Song den Standard-Takt 4/4 und Revision 6
