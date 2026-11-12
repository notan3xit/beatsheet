# practice-click Specification

## Purpose
Unterstützt das Üben zum Song mit einem Metronom, das jeden Beat hörbar macht, und mit einem Takt zum Einzählen vor dem Start der Wiedergabe.

## Requirements

### Requirement: Knöpfe Metronom und Einzählen
Die Übetempo-Steuerung (`practice-tempo`) MUST nach dem Übetempo je einen Knopf „Metronom“ und „Einzählen“ zeigen, nur mit Symbol, und ihre Namen als zugänglichen Namen und Tooltip tragen. Jeder Knopf MUST zeigen, ob er an ist. Doppelseite und Pattern-Editor desselben Songs MUST denselben Zustand zeigen. Auf schmalen Bildschirmen MUST beide sichtbar bleiben.

#### Scenario: Doppelseite
- **WHEN** der Nutzer die Doppelseite eines Songs zum ersten Mal ansieht
- **THEN** folgen nach dem Übetempo die Knöpfe „Metronom“ und „Einzählen“, beide aus und ohne sichtbaren Text

#### Scenario: Gleicher Stand im Pattern-Editor
- **WHEN** der Nutzer auf der Doppelseite „Metronom“ einschaltet und den Groove „Verse“ öffnet
- **THEN** ist „Metronom“ im Pattern-Editor an und „Einzählen“ aus

#### Scenario: Smartphone
- **WHEN** der Nutzer die Doppelseite auf einem Smartphone ansieht
- **THEN** zeigt die Steuerung „Metronom“ und „Einzählen“

### Requirement: Unabhängige Schalter
„Metronom“, „Einzählen“ und „Tempo“ MUST unabhängig voneinander schalten; jeder Knopf MUST nur seine eigene Funktion an- oder ausschalten.

#### Scenario: Metronom ohne Tempo
- **GIVEN** „Tempo“ ist aus
- **WHEN** der Nutzer „Metronom“ einschaltet
- **THEN** ist „Metronom“ an, „Tempo“ und „Einzählen“ bleiben aus

#### Scenario: Tempo ausschalten
- **GIVEN** „Tempo“, „Metronom“ und „Einzählen“ sind an
- **WHEN** der Nutzer „Tempo“ ausschaltet
- **THEN** bleiben „Metronom“ und „Einzählen“ an

### Requirement: Schalter gelten bis zum Neuladen
„Metronom“ und „Einzählen“ MUST pro Song gelten, bis die App neu geladen wird. Ein Song MUST nach dem Laden der App mit beiden ausgeschaltet beginnen. Die Schalter MUST NOT Teil des Songs sein: Sie MUST NOT den Song ändern oder im Verlauf erscheinen.

#### Scenario: Anderer Song
- **WHEN** der Nutzer bei „Hysteria“ „Metronom“ einschaltet und einen anderen Song öffnet
- **THEN** ist dort „Metronom“ aus

#### Scenario: Zurück zum Song
- **WHEN** der Nutzer bei „Hysteria“ „Einzählen“ einschaltet, zur Song-Liste wechselt und „Hysteria“ wieder öffnet
- **THEN** ist „Einzählen“ an

#### Scenario: Neu laden
- **WHEN** der Nutzer „Metronom“ und „Einzählen“ einschaltet und die App neu lädt
- **THEN** sind beide aus

#### Scenario: Kein Teil des Songs
- **WHEN** der Nutzer „Metronom“ einschaltet
- **THEN** bleibt der Song unverändert und sein Verlauf erhält keinen Eintrag

### Requirement: Metronom und Einzählen im gesperrten Song
„Metronom“ und „Einzählen“ MUST auch in einem gesperrten Song bedienbar sein.

#### Scenario: Gesperrter Song
- **WHEN** der Song gesperrt ist und der Nutzer „Metronom“ und „Einzählen“ einschaltet
- **THEN** sind beide an

### Requirement: Klick auf jedem Beat
Ist „Metronom“ an, MUST während jeder Wiedergabe des Songs und seiner Patterns auf jedem Beat ein Klick erklingen, zusätzlich zu den Schlägen. Der Klick auf dem ersten Beat eines Takts MUST betont sein. Im Song MUST das der erste Beat jedes Takts der Struktur sein; im Pattern-Editor jeder Beat, dessen Abstand zum Anfang des Patterns ein Vielfaches seiner wirksamen Taktart ist.

#### Scenario: Takt in 4/4
- **GIVEN** „Metronom“ ist an
- **WHEN** ein Takt mit 4 Beats abgespielt wird
- **THEN** erklingen 4 Klicks, auf jedem Beat einer, und nur der erste ist betont

#### Scenario: Wechselnde Taktlängen
- **GIVEN** „Metronom“ ist an und auf einen Takt mit 4 Beats folgt einer mit 3 Beats
- **WHEN** beide Takte abgespielt werden
- **THEN** sind der 1. und der 5. Klick betont

#### Scenario: Pattern länger als ein Takt
- **GIVEN** „Metronom“ ist an und ein Pattern mit 6 Beats hat die wirksame Taktart 4/4
- **WHEN** das Pattern in Schleife abgespielt wird
- **THEN** sind in jedem Durchlauf die Klicks auf Beat 1 und Beat 5 betont

#### Scenario: Metronom aus
- **WHEN** „Metronom“ aus ist und der Song abgespielt wird
- **THEN** erklingt kein Klick

### Requirement: Metronom während der Wiedergabe schalten
Schaltet der Nutzer „Metronom“ während der Wiedergabe ein, MUST die Wiedergabe ohne Neustart weiterlaufen und der erste Klick am nächsten Taktanfang erklingen, betont. Schaltet er es aus, MUST ab dem nächsten Beat kein Klick mehr erklingen.

#### Scenario: Einschalten während der Wiedergabe
- **WHEN** der Song ohne Metronom auf Beat 2 eines Takts steht und der Nutzer „Metronom“ einschaltet
- **THEN** läuft die Wiedergabe ohne Unterbrechung weiter und der erste Klick erklingt betont auf Beat 1 des nächsten Takts

#### Scenario: Einschalten in der Schleife
- **WHEN** ein Pattern mit 4 Beats ohne Metronom in Schleife auf Beat 2 steht und der Nutzer „Metronom“ einschaltet
- **THEN** erklingt der erste Klick betont zu Beginn des nächsten Durchlaufs

#### Scenario: Ausschalten während der Wiedergabe
- **WHEN** der Song mit Metronom läuft und der Nutzer „Metronom“ ausschaltet
- **THEN** läuft die Wiedergabe ohne Unterbrechung weiter und ab dem nächsten Beat erklingt kein Klick

### Requirement: Einzählen vor dem Start
Ist „Einzählen“ an, MUST jede Wiedergabe des Songs und seiner Patterns mit einem Takt beginnen, in dem nur Klicks des Metronoms erklingen, der erste betont, unabhängig davon, wie sie gestartet wurde. Danach MUST ohne Pause der Bereich der Wiedergabe beginnen. Der Takt MUST im Song so viele Beats haben wie der erste Takt des Bereichs, im Pattern-Editor so viele wie die wirksame Taktart des Patterns.

#### Scenario: Song in 4/4
- **GIVEN** „Einzählen“ ist an und der Song läuft mit 60 BPM
- **WHEN** der Nutzer „Song abspielen“ wählt
- **THEN** erklingen 4 Klicks im Abstand von einer Sekunde, der erste betont, und der erste Schlag des Songs eine Sekunde nach dem vierten Klick

#### Scenario: Ab einem Takt in 3/4
- **GIVEN** „Einzählen“ ist an
- **WHEN** der Nutzer einen Takt mit 3 Beats auswählt und „Ab hier abspielen“ wählt
- **THEN** erklingen vor diesem Takt 3 Klicks

#### Scenario: Kurzer Fill
- **GIVEN** „Einzählen“ ist an und ein Fill mit 2 Beats hat die wirksame Taktart 4/4
- **WHEN** der Nutzer im Pattern-Editor „Einmal abspielen“ wählt
- **THEN** erklingen vor dem Fill 4 Klicks

#### Scenario: Einzählen ohne Metronom
- **GIVEN** „Einzählen“ ist an und „Metronom“ aus
- **WHEN** der Nutzer den Song abspielt
- **THEN** erklingen nur im ersten Takt Klicks und danach keine mehr

### Requirement: Einzählen nur beim Start
Das Einzählen MUST NOT sich wiederholen: weder vor einem weiteren Durchlauf einer Schleife noch beim Wechsel zwischen einmal und Schleife. Schaltet der Nutzer „Einzählen“ während der Wiedergabe ein oder aus, MUST das erst für den nächsten Start gelten.

#### Scenario: Schleife
- **GIVEN** „Einzählen“ ist an
- **WHEN** ein Pattern mit 4 Beats in Schleife abgespielt wird
- **THEN** folgt auf den letzten Beat ohne Pause wieder der erste, ohne erneutes Einzählen

#### Scenario: Einschalten während der Wiedergabe
- **WHEN** der Song läuft und der Nutzer „Einzählen“ einschaltet
- **THEN** läuft die Wiedergabe ohne Unterbrechung weiter, und erst der nächste Start beginnt mit dem Einzählen

### Requirement: Anzeige während des Einzählens
Während des Einzählens MUST die Wiedergabe als laufend gelten: Der Knopf des laufenden Modus MUST „Stopp“ heißen und das Einzählen samt Wiedergabe beenden. Kein Takt und keine Position MUST hervorgehoben sein, bis der Bereich beginnt.

#### Scenario: Während des Einzählens
- **GIVEN** „Einzählen“ ist an
- **WHEN** der Nutzer „Song abspielen“ wählt und der zweite Klick erklingt
- **THEN** heißt der Knopf im Kopf „Stopp“ und kein Takt ist als laufend hervorgehoben

#### Scenario: Stopp beim Einzählen
- **GIVEN** „Einzählen“ ist an
- **WHEN** der Nutzer während des Einzählens „Stopp“ wählt
- **THEN** endet die Wiedergabe und kein Schlag des Songs erklingt

### Requirement: Tempo von Metronom und Einzählen
Klicks von Metronom und Einzählen MUST im Tempo der Wiedergabe erklingen: im Übetempo, wenn „Tempo“ an ist, sonst im Song-Tempo. Ändert sich das Tempo während der Wiedergabe oder des Einzählens, MUST der nächste Klick im neuen Tempo folgen.

#### Scenario: Im Übetempo
- **GIVEN** „Tempo“ und „Metronom“ sind an, das Übetempo ist 60, das Song-Tempo 120
- **WHEN** der Song abgespielt wird
- **THEN** folgen die Klicks im Abstand von einer Sekunde

#### Scenario: Im Song-Tempo
- **GIVEN** „Tempo“ ist aus, „Metronom“ an, das Song-Tempo ist 120
- **WHEN** der Song abgespielt wird
- **THEN** folgen die Klicks im Abstand einer halben Sekunde

### Requirement: Klang des Metronoms
Der Klick MUST ein eigener Klang sein, der sich von jedem der zehn Instrumente unterscheiden lässt, und ein betonter Klick MUST sich hörbar vom unbetonten unterscheiden. Er MUST neben den Schlägen deutlich hörbar sein, auch der unbetonte. Der Klick MUST bei den Klängen „DRSKit“ und „Synth“ gleich klingen.

#### Scenario: Neben den Schlägen
- **GIVEN** „Metronom“ ist an
- **WHEN** ein Groove mit Hi-Hat-Achteln und Snare auf 2 und 4 mit „DRSKit“ abgespielt wird
- **THEN** ist jeder Klick deutlich zu hören

#### Scenario: Klangwahl
- **GIVEN** „Metronom“ ist an
- **WHEN** der Nutzer den Song einmal mit „DRSKit“ und einmal mit „Synth“ abspielt
- **THEN** klingt der Klick beide Male gleich
