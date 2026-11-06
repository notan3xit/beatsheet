# Spec Delta

## MODIFIED Requirements

### Requirement: Gesperrte Doppelseite
Auf der Doppelseite eines gesperrten Songs MUST Songtitel, Tempo und Standard-Takt als Text erscheinen. „Song löschen“, die Einfüge-Knöpfe beim Überfahren, „+ Groove“, „+ Fill“ und das Ziehen von Patterns MUST entfallen. „Song abspielen“ und das Öffnen eines Patterns aus der rechten Seite MUST verfügbar bleiben.

#### Scenario: Kopf der Doppelseite
- **WHEN** der Nutzer einen gesperrten Song auf der Doppelseite ansieht
- **THEN** zeigt der Kopf Titel, Tempo und Standard-Takt als Text sowie „Song abspielen“
- **AND** gibt es keinen Knopf „Song löschen“

#### Scenario: Klick auf den Titel
- **WHEN** der Nutzer bei gesperrtem Song auf die Überschrift klickt
- **THEN** erscheint kein Eingabefeld

#### Scenario: Überfahren der Struktur
- **WHEN** der Nutzer bei gesperrtem Song mit der Maus über Zeilen und Segmente fährt
- **THEN** erscheinen keine Einfüge-Knöpfe

#### Scenario: Pattern ziehen
- **WHEN** der Nutzer bei gesperrtem Song eine Pattern-Karte auf einen Takt zieht
- **THEN** ändert sich der Takt nicht

#### Scenario: Patterns anlegen
- **WHEN** der Nutzer einen gesperrten Song auf der Doppelseite ansieht
- **THEN** gibt es keine Knöpfe „Neuer Groove“ und „Neuer Fill“

#### Scenario: Pattern öffnen
- **WHEN** der Nutzer bei gesperrtem Song rechts den Groove „Verse“ auswählt
- **THEN** zeigt die App den Pattern-Editor von „Verse“

### Requirement: Gesperrter Pattern-Editor
Der Pattern-Editor eines gesperrten Songs MUST Name, Typ, Länge, Taktart, Tempo, Sequencer, Noten und die Abspiel-Taste zeigen. Name, Länge, Taktart, Tempo und die Unterteilung der Beats MUST als Text erscheinen. Das Taktart-Symbol MUST immer vor der Taktart stehen, gedämpft und ohne Bedienung. Eine eigene Taktart MUST sich durch ungedämpften Text von einer Taktart unterscheiden, die dem Song folgt. Die Zellen des Sequencers MUST gesetzte Schläge und ihre Spielweise gut lesbar zeigen, aber auf keine Bedienung reagieren. Rückgängig, Wiederherstellen, Duplizieren und Löschen MUST entfallen.

#### Scenario: Klick im Sequencer
- **WHEN** der Nutzer bei gesperrtem Song auf eine Zelle des Sequencers klickt
- **THEN** ändert sich das Pattern nicht

#### Scenario: Shift-Klick im Sequencer
- **WHEN** der Nutzer bei gesperrtem Song mit Shift auf einen gesetzten Snare-Schlag klickt
- **THEN** ändert sich dessen Spielweise nicht

#### Scenario: Schläge lesbar
- **WHEN** der Nutzer bei gesperrtem Song ein Pattern mit einem Flam auf der Snare öffnet
- **THEN** zeigt der Sequencer den Schlag als gesetzt und mit seiner Spielweise, in denselben Farben wie im entsperrten Song

#### Scenario: Werte als Text
- **WHEN** der Nutzer bei gesperrtem Song einen Groove mit 4 Beats in Sechzehnteln und dem Song-Tempo 120 in einem Song in 4/4 öffnet
- **THEN** zeigt der Pattern-Editor Name, „4 Beats“, „4/4“, je Beat „16tel“ und „♩ = 120 (Song-Tempo)“ als Text

#### Scenario: Eigene Taktart gekennzeichnet
- **WHEN** der Nutzer bei gesperrtem Song ein Pattern mit der eigenen Taktart 7/4 öffnet
- **THEN** steht dort das gedämpfte Taktart-Symbol, das „Eigene Taktart“ heißt und auf keine Bedienung reagiert, und dahinter „7/4“ als ungedämpfter Text

#### Scenario: Taktart, die dem Song folgt
- **WHEN** der Nutzer bei gesperrtem Song ein Pattern ohne eigene Taktart öffnet
- **THEN** steht dort das gedämpfte Taktart-Symbol und dahinter die Taktart des Songs als gedämpfter Text

#### Scenario: Aktionen entfallen
- **WHEN** der Nutzer bei gesperrtem Song den Pattern-Editor ansieht
- **THEN** gibt es keine Knöpfe „Rückgängig“, „Wiederherstellen“, „Duplizieren“ und „Löschen“

#### Scenario: Laufposition beim Abspielen
- **WHEN** der Nutzer bei gesperrtem Song das Pattern abspielt
- **THEN** hebt der Sequencer die gerade erklingende Position hervor

### Requirement: Gleiche Anordnung beim Entsperren
Ein Wert MUST gesperrt und entsperrt denselben Text und denselben Platz haben, entsperrt nur als Bedienelement. Das MUST für Songtitel, Song-Tempo, Standard-Takt, Patternname, Länge, Taktart des Patterns und die Unterteilung der Beats gelten. Das Taktart-Symbol MUST seinen Platz in beiden Zuständen und mit und ohne eigene Taktart behalten; entsperrt ist es im Pattern-Editor der Umschalter „Eigene Taktart“. Das Schloss MUST beim Wechsel des Zustands an seiner Stelle bleiben, solange die Kopfzeile nicht umbricht. Die Kopfzeile MUST dabei gleich hoch bleiben.

#### Scenario: Länge
- **WHEN** der Nutzer einen Groove mit 4 Beats gesperrt ansieht und den Song entsperrt
- **THEN** zeigt der Pattern-Editor zuerst „4 Beats“ als Text und danach eine Auswahlliste mit dem Wert „4 Beats“

#### Scenario: Länge von einem Beat
- **WHEN** der Nutzer einen Groove mit 1 Beat gesperrt und entsperrt ansieht
- **THEN** zeigt der Pattern-Editor in beiden Zuständen „1 Beat“

#### Scenario: Tempo im Pattern-Editor
- **WHEN** das Song-Tempo 120 beträgt und der Nutzer den Pattern-Editor gesperrt ansieht und den Song entsperrt
- **THEN** steht zuerst „♩ = 120 (Song-Tempo)“ als Text und danach derselbe Text mit einer anklickbaren Tempoangabe

#### Scenario: Standard-Takt
- **WHEN** der Song in 3/4 steht und der Nutzer die Doppelseite gesperrt ansieht und den Song entsperrt
- **THEN** steht neben dem Song-Tempo zuerst „3/4“ als Text und danach eine Auswahl mit dem Wert „3/4“ am selben Platz

#### Scenario: Taktart eines Patterns, das dem Song folgt
- **WHEN** der Song in 4/4 steht und der Nutzer einen Groove ohne eigene Taktart gesperrt ansieht und den Song entsperrt
- **THEN** steht in beiden Zuständen „4/4“ als gedämpfter Text am selben Platz

#### Scenario: Eigene Taktart
- **WHEN** der Nutzer ein Pattern mit der eigenen Taktart 7/4 gesperrt ansieht und den Song entsperrt
- **THEN** steht zuerst „7/4“ als Text und danach eine Auswahl mit dem Wert „7/4“ am selben Platz

#### Scenario: Umschalten verschiebt nichts
- **WHEN** der Nutzer im entsperrten Song den Umschalter „Eigene Taktart“ ein- oder ausschaltet
- **THEN** bleiben alle Elemente der Kopfzeile an ihrem Platz

#### Scenario: Unterteilung
- **WHEN** Beat 1 in Sechzehnteln steht und der Nutzer den Pattern-Editor gesperrt ansieht und den Song entsperrt
- **THEN** zeigt Beat 1 zuerst „16tel“ als Text und danach eine Auswahlliste mit dem Wert „16tel“

#### Scenario: Höhe der Kopfzeile
- **WHEN** der Nutzer den Song auf der Doppelseite oder im Pattern-Editor entsperrt oder sperrt
- **THEN** bleibt die Kopfzeile gleich hoch, weil die dabei erscheinenden Knöpfe nicht höher sind als die Abspiel-Taste
