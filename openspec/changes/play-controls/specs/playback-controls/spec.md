# Spec Delta

## Purpose

Macht das Abspielen in der ganzen Anwendung wiedererkennbar: Jeder Abspiel-Knopf zeigt ein festes Symbol für seine Art der Wiedergabe statt einer Beschriftung.

## ADDED Requirements

### Requirement: Abspiel-Symbole
Jeder Abspiel-Knopf MUST genau eines von drei Symbolen zeigen, ohne sichtbaren Text: Abspielen für einen einmaligen Durchlauf, Wiederholen für die Schleife, Stoppen zum Beenden. Ein Symbol MUST in allen Ansichten gleich aussehen.

#### Scenario: Kopf der Doppelseite
- **WHEN** der Nutzer die Doppelseite eines Songs ansieht
- **THEN** zeigt der Kopf einen Knopf mit dem Symbol Abspielen und ohne Text

#### Scenario: Sequencer
- **WHEN** der Nutzer den Pattern-Editor ansieht
- **THEN** zeigt der Kopf des Editors einen Knopf mit dem Symbol Wiederholen und ohne Text

#### Scenario: Takt-Overlay
- **WHEN** der Nutzer einen Takt auswählt
- **THEN** zeigt das Overlay je einen Knopf mit dem Symbol Abspielen und Wiederholen und ohne Text

#### Scenario: Segment-Overlay
- **WHEN** der Nutzer ein Segment auswählt
- **THEN** zeigt das Overlay je einen Knopf mit dem Symbol Abspielen und Wiederholen und ohne Text

#### Scenario: Während der Wiedergabe
- **WHEN** der Song oder ein Pattern abgespielt wird
- **THEN** zeigt der Knopf im Kopf von Doppelseite bzw. Pattern-Editor das Symbol Stoppen

#### Scenario: Overlay während der Wiedergabe
- **WHEN** der Song abgespielt wird und der Nutzer einen Takt auswählt
- **THEN** zeigt das Overlay Abspielen und Wiederholen, und die Wahl von Wiederholen startet die Schleife dieses Takts

### Requirement: Overlay schließt beim Abspielen
Das Starten der Wiedergabe aus dem Takt- oder Segment-Popover MUST die Auswahl aufheben und das Popover schließen. Die Wiedergabe MUST dabei den beim Start festgelegten Bereich behalten.

#### Scenario: Aus dem Takt-Overlay
- **WHEN** der Nutzer die Takte 2 bis 3 auswählt und „In Schleife abspielen“ wählt
- **THEN** laufen die Takte 2 bis 3 in Schleife, kein Popover ist geöffnet und nichts ist ausgewählt

#### Scenario: Aus dem Segment-Overlay
- **WHEN** der Nutzer das Segment „Chorus“ auswählt und „Ab hier abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang von „Chorus“, kein Popover ist geöffnet und nichts ist ausgewählt

#### Scenario: Im gesperrten Song
- **WHEN** der Song gesperrt ist und der Nutzer einen Takt auswählt und „Ab hier abspielen“ wählt
- **THEN** beginnt die Wiedergabe und kein Popover ist geöffnet

### Requirement: Farbe der Wiedergabe
Abspiel-Knöpfe MUST dieselbe Farbe tragen wie die Anzeige der Wiedergabeposition in Struktur und Sequencer, in einer gedämpften Fläche in Hell- und Dunkelmodus. Die Farbe MUST sich von Akzentfarbe und Warnfarbe unterscheiden.

#### Scenario: Knopf und Laufposition
- **WHEN** der Song abgespielt wird
- **THEN** haben der Knopf im Kopf der Doppelseite und die Linie im laufenden Takt dieselbe Farbe

### Requirement: Name und Tooltip der Abspiel-Knöpfe
Jeder Abspiel-Knopf MUST seine Aktion als zugänglichen Namen und als Tooltip nennen.

#### Scenario: Knopf im Kopf der Doppelseite
- **WHEN** der Nutzer den Mauszeiger auf den Knopf im Kopf der Doppelseite bewegt
- **THEN** zeigt der Tooltip „Song abspielen“ und der Knopf heißt „Song abspielen“

#### Scenario: Knöpfe im Overlay
- **WHEN** der Nutzer einen Takt auswählt
- **THEN** heißen die Knöpfe „Ab hier abspielen“ und „In Schleife abspielen“ und zeigen dies als Tooltip

#### Scenario: Knopf während der Wiedergabe
- **WHEN** der Song abgespielt wird
- **THEN** heißt der Knopf im Kopf der Doppelseite „Stopp“ und zeigt dies als Tooltip

### Requirement: Gleicher Platz der Abspiel-Knöpfe
Der Wechsel zwischen den Symbolen eines Knopfs MUST dessen Größe unverändert lassen, sodass sich daneben nichts verschiebt.

#### Scenario: Wiedergabe starten
- **WHEN** der Nutzer im Pattern-Editor die Wiedergabe startet
- **THEN** bleiben der Knopf und alles daneben an ihrer Stelle
