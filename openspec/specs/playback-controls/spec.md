# playback-controls Specification

## Purpose

Macht das Abspielen in der ganzen Anwendung wiedererkennbar: Jeder Abspiel-Knopf zeigt ein festes Symbol für seine Art der Wiedergabe statt einer Beschriftung.

## Requirements

### Requirement: Abspiel-Symbole
Jeder Abspiel-Knopf MUST genau eines von drei Symbolen zeigen, ohne sichtbaren Text: Abspielen für einen einmaligen Durchlauf, Wiederholen für die Schleife, Stoppen zum Beenden. Ein Symbol MUST in allen Ansichten gleich aussehen.

#### Scenario: Kopf der Doppelseite
- **WHEN** der Nutzer die Doppelseite eines Songs ansieht
- **THEN** zeigt der Kopf je einen Knopf mit dem Symbol Abspielen und Wiederholen und ohne Text

#### Scenario: Sequencer
- **WHEN** der Nutzer den Pattern-Editor ansieht
- **THEN** zeigt der Kopf des Editors je einen Knopf mit dem Symbol Abspielen und Wiederholen und ohne Text

#### Scenario: Takt-Overlay
- **WHEN** der Nutzer einen Takt auswählt
- **THEN** zeigt das Overlay je einen Knopf mit dem Symbol Abspielen und Wiederholen und ohne Text

#### Scenario: Segment-Overlay
- **WHEN** der Nutzer ein Segment auswählt
- **THEN** zeigt das Overlay je einen Knopf mit dem Symbol Abspielen und Wiederholen und ohne Text

#### Scenario: Während der Wiedergabe
- **WHEN** der Song oder ein Pattern in Schleife abgespielt wird
- **THEN** zeigt im Kopf von Doppelseite bzw. Pattern-Editor der Knopf der Schleife das Symbol Stoppen und der andere weiter das Symbol Abspielen

#### Scenario: Overlay während der Wiedergabe
- **WHEN** der Song abgespielt wird und der Nutzer einen Takt auswählt
- **THEN** zeigt das Overlay Abspielen und Wiederholen, und die Wahl von Wiederholen startet die Schleife dieses Takts

### Requirement: Overlay schließt beim Abspielen
Das Starten der Wiedergabe aus dem Takt- oder Segment-Popover MUST das Popover schließen und die Auswahl bestehen lassen. Ein Klick auf die bestehende Auswahl MUST das Popover wieder öffnen. Die Wiedergabe MUST den beim Start festgelegten Bereich behalten, auch wenn sich die Auswahl danach ändert.

#### Scenario: Aus dem Takt-Overlay
- **WHEN** der Nutzer die Takte 2 bis 3 auswählt und „In Schleife abspielen“ wählt
- **THEN** laufen die Takte 2 bis 3 in Schleife, kein Popover ist geöffnet und die Takte 2 bis 3 sind ausgewählt

#### Scenario: Aus dem Segment-Overlay
- **WHEN** der Nutzer das Segment „Chorus“ auswählt und „Ab hier abspielen“ wählt
- **THEN** beginnt die Wiedergabe am Anfang von „Chorus“, kein Popover ist geöffnet und „Chorus“ ist ausgewählt

#### Scenario: Popover wieder öffnen
- **WHEN** die Takte 2 bis 3 nach dem Start aus dem Overlay ausgewählt sind und der Nutzer Takt 3 anklickt
- **THEN** ist das Popover der Takte 2 bis 3 geöffnet und die Wiedergabe läuft unverändert weiter

#### Scenario: Im gesperrten Song
- **WHEN** der Song gesperrt ist und der Nutzer einen Takt auswählt und „Ab hier abspielen“ wählt
- **THEN** beginnt die Wiedergabe, kein Popover ist geöffnet und der Takt ist ausgewählt

### Requirement: Farbe der Wiedergabe
Abspiel-Knöpfe MUST dieselbe Farbe tragen wie die Anzeige der Wiedergabeposition in Struktur und Sequencer, in einer gedämpften Fläche in Hell- und Dunkelmodus. Die Farbe MUST sich von Akzentfarbe und Warnfarbe unterscheiden. Während der Wiedergabe MUST im Kopf von Doppelseite bzw. Pattern-Editor der Knopf des nicht laufenden Modus grau erscheinen.

#### Scenario: Knopf und Laufposition
- **WHEN** der Song abgespielt wird
- **THEN** haben der Stopp-Knopf im Kopf der Doppelseite und die Linie im laufenden Takt dieselbe Farbe

#### Scenario: Nicht laufender Modus
- **WHEN** ein Pattern in Schleife abgespielt wird
- **THEN** ist im Kopf des Pattern-Editors „Einmal abspielen“ grau und der Stopp-Knopf in der Farbe der Wiedergabe

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

### Requirement: Moduswechsel während der Wiedergabe
Während der Wiedergabe MUST der graue Knopf im Kopf von Doppelseite bzw. Pattern-Editor bedienbar bleiben und den Modus wechseln, ohne die Wiedergabe neu zu starten. Der Bereich der Wiedergabe MUST dabei erhalten bleiben: Aus der Schleife wird ein Durchlauf bis zum Ende des Bereichs, aus dem einmaligen Durchlauf eine Schleife über den Bereich.

#### Scenario: Von Schleife zu einmal
- **WHEN** ein Pattern mit 4 Beats in Schleife auf Beat 2 steht und der Nutzer „Einmal abspielen“ wählt
- **THEN** läuft die Wiedergabe ohne Unterbrechung bis zum Ende von Beat 4 und endet dann
- **AND** der Knopf „Einmal abspielen“ heißt bis dahin „Stopp“

#### Scenario: Von einmal zu Schleife
- **WHEN** der Song einmal läuft und der Nutzer „Song in Schleife abspielen“ wählt
- **THEN** folgt auf den letzten Takt wieder der erste

#### Scenario: Bereich aus dem Overlay
- **WHEN** die Takte 2 bis 3 aus dem Takt-Overlay in Schleife laufen und der Nutzer im Kopf „Song abspielen“ wählt
- **THEN** endet die Wiedergabe nach Takt 3

### Requirement: Anordnung im Kopf
Die Köpfe von Doppelseite und Pattern-Editor MUST Song-Tempo, Abspiel-Knöpfe und Übetempo (`practice-tempo`) in dieser Reihenfolge zeigen, den Knopf für einen Durchlauf vor dem für die Schleife.

#### Scenario: Pattern-Editor
- **WHEN** der Nutzer den Pattern-Editor ansieht
- **THEN** folgen im Kopf „♩ = 120 (Song-Tempo)“, „Einmal abspielen“, „In Schleife abspielen“ und „Tempo“ in dieser Reihenfolge

#### Scenario: Doppelseite
- **WHEN** der Nutzer die Doppelseite ansieht
- **THEN** folgen im Kopf „♩ = 120“, „Song abspielen“, „Song in Schleife abspielen“ und „Tempo“ in dieser Reihenfolge
