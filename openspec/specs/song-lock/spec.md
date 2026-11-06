# song-lock Specification

## Purpose

Schützt einen geöffneten Song vor versehentlichen Änderungen: Er lässt sich gesperrt ansehen und abspielen und erst nach dem Öffnen eines Schlosses bearbeiten.

## Requirements

### Requirement: Schloss
Doppelseite und Pattern-Editor MUST oben ein Schloss zeigen, das erkennbar macht, ob der Song gesperrt oder entsperrt ist. Ein Klick auf das Schloss MUST den Zustand wechseln. Der Zustand MUST für den ganzen Song gelten und beim Wechsel zwischen Doppelseite und Pattern-Editor erhalten bleiben.

#### Scenario: Entsperren
- **WHEN** der Song „Hysteria“ gesperrt ist und der Nutzer auf das Schloss klickt
- **THEN** ist der Song entsperrt und alle Bearbeitungsmöglichkeiten sind verfügbar

#### Scenario: Wieder sperren
- **WHEN** der Song entsperrt ist und der Nutzer auf das Schloss klickt
- **THEN** ist der Song gesperrt und die Bearbeitungsmöglichkeiten entfallen

#### Scenario: Wechsel in den Pattern-Editor
- **WHEN** der Nutzer den Song auf der Doppelseite entsperrt und den Groove „Verse“ öffnet
- **THEN** ist der Song im Pattern-Editor entsperrt
- **AND** ist er nach der Rückkehr zur Doppelseite weiterhin entsperrt

#### Scenario: Entsperren im Pattern-Editor
- **WHEN** der Nutzer den Song im Pattern-Editor entsperrt und zur Doppelseite zurückkehrt
- **THEN** ist der Song auf der Doppelseite entsperrt

#### Scenario: Offene Eingabe beim Sperren
- **WHEN** der Nutzer den Songtitel bearbeitet, „Uprising“ eingibt und auf das Schloss klickt
- **THEN** heißt der Song „Uprising“ und ist gesperrt

### Requirement: Gesperrt beim Öffnen
Ein Song MUST beim Öffnen gesperrt sein, auch wenn er zuvor entsperrt war. Das MUST ebenso gelten für das Neuladen der App und das Öffnen über eine Adresse, auch wenn sie ein Pattern nennt.

#### Scenario: Öffnen aus der Song-Liste
- **WHEN** der Nutzer in der Song-Liste den Song „Hysteria“ mit Struktur und Patterns öffnet
- **THEN** ist der Song gesperrt

#### Scenario: Erneutes Öffnen
- **WHEN** der Nutzer „Hysteria“ entsperrt, zur Song-Liste wechselt und „Hysteria“ wieder öffnet
- **THEN** ist der Song gesperrt

#### Scenario: Neuladen
- **WHEN** der Nutzer „Hysteria“ entsperrt und die Seite neu lädt
- **THEN** ist der Song gesperrt

#### Scenario: Adresse nennt ein Pattern
- **WHEN** die App mit einer Adresse gestartet wird, die den Groove „Verse“ im Song „Hysteria“ nennt
- **THEN** zeigt die App den Pattern-Editor von „Verse“ und der Song ist gesperrt

### Requirement: Leerer Song öffnet entsperrt
Ein Song ohne Segmente und ohne Patterns MUST beim Öffnen entsperrt sein.

#### Scenario: Neu angelegter Song
- **WHEN** der Nutzer einen Song anlegt und ihn öffnet
- **THEN** ist der Song entsperrt und die Aktion „Erstes Segment anlegen“ ist verfügbar

#### Scenario: Song mit Inhalt
- **WHEN** der Nutzer im neuen Song ein Segment anlegt, zur Song-Liste wechselt und den Song wieder öffnet
- **THEN** ist der Song gesperrt

#### Scenario: Song nur mit Patterns
- **WHEN** der Nutzer einen Song öffnet, der Patterns, aber keine Segmente hat
- **THEN** ist der Song gesperrt

### Requirement: Sperre nur lokal
Der Sperrzustand MUST nur für die Sitzung im jeweiligen Tab gelten. Er MUST NOT Teil des Songs, der Adresse, einer Exportdatei oder des Abgleichs mit dem Server sein.

#### Scenario: Song bleibt unverändert
- **WHEN** der Nutzer den Song entsperrt und wieder sperrt
- **THEN** haben sich Revision und Änderungszeit des Songs nicht geändert

#### Scenario: Adresse bleibt unverändert
- **WHEN** der Nutzer auf das Schloss klickt
- **THEN** nennt die Adresse dieselbe Ansicht wie zuvor und es entsteht kein Eintrag im Browser-Verlauf

### Requirement: Keine Änderung im gesperrten Zustand
Solange ein Song gesperrt ist, MUST der Nutzer ihn in der Oberfläche nicht ändern können, weder per Maus noch per Tastatur. Anforderungen anderer Capabilities an das Bearbeiten eines Songs MUST nur für den entsperrten Song gelten.

#### Scenario: Keine Eingabefelder
- **WHEN** der Nutzer einen gesperrten Song auf der Doppelseite oder im Pattern-Editor ansieht
- **THEN** gibt es dort keine Eingabefelder und keine Auswahllisten

#### Scenario: Tastenkürzel
- **WHEN** der Nutzer im entsperrten Pattern-Editor einen Schlag setzt, den Song sperrt und Strg+Z drückt
- **THEN** bleibt der Schlag gesetzt

### Requirement: Knöpfe nur mit Freigabe
Solange ein Song gesperrt ist, MUST jeder Knopf auf der Doppelseite und im Pattern-Editor wirkungslos sein, außer er ist als lesend freigegeben. Freigegeben MUST nur sein, was den Song nicht ändert: Schloss, Pfad, Abspiel-Tasten, Abspiel-Aktionen der Popover, Links zu Groove und Fill im Takt-Popover, Takte, Segmentnamen und die Namen der Pattern-Karten. Song-Liste, App-Kopfzeile und Bestätigungsdialoge MUST davon unberührt bleiben.

#### Scenario: Knopf ohne Freigabe per Maus
- **WHEN** der Song gesperrt ist und der Nutzer auf einen Knopf ohne Freigabe klickt
- **THEN** bewirkt der Klick nichts

#### Scenario: Knopf ohne Freigabe per Tastatur
- **WHEN** der Song gesperrt ist und der Nutzer einen Knopf ohne Freigabe fokussiert und Enter drückt
- **THEN** bewirkt die Taste nichts

#### Scenario: Knopf ohne Freigabe im entsperrten Song
- **WHEN** der Song entsperrt ist und der Nutzer auf einen Knopf ohne Freigabe klickt
- **THEN** führt der Knopf seine Aktion aus

#### Scenario: Alle aktiven Knöpfe freigegeben
- **WHEN** der Nutzer einen gesperrten Song auf der Doppelseite, mit geöffnetem Popover oder im Pattern-Editor ansieht
- **THEN** ist jeder dort aktive Knopf als lesend freigegeben

#### Scenario: Freigegebener Knopf
- **WHEN** der Song gesperrt ist und der Nutzer im Pfad auf „Songs“ klickt
- **THEN** zeigt die App die Song-Liste

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

### Requirement: Auswahl im gesperrten Song
Takte und Segmente eines gesperrten Songs MUST auswählbar bleiben wie im entsperrten Song. Ihr Popover MUST nur die Aktionen „Ab hier abspielen“ und „In Schleife abspielen“ anbieten, das Popover von Takten zusätzlich die Links zu Groove und Fill. Die Patternseite MUST die Karten ausgewählter Takte hervorheben wie im entsperrten Song.

#### Scenario: Takte auswählen
- **WHEN** der Nutzer bei gesperrtem Song Takt 5 anklickt und mit Shift Takt 8 anklickt
- **THEN** sind die Takte 5 bis 8 ausgewählt und hervorgehoben
- **AND** bietet das Popover außer den Links zu Groove und Fill nur „Ab hier abspielen“ und „In Schleife abspielen“

#### Scenario: Segment auswählen
- **WHEN** der Nutzer bei gesperrtem Song den Segmentnamen „Verse“ anklickt
- **THEN** ist das Segment ausgewählt und das Popover bietet nur „Ab hier abspielen“ und „In Schleife abspielen“

#### Scenario: Schleife im gesperrten Song
- **WHEN** der Nutzer bei gesperrtem Song die Takte 5 bis 8 auswählt und „In Schleife abspielen“ wählt
- **THEN** spielt die App die Takte 5 bis 8 in Schleife

#### Scenario: Link im gesperrten Song
- **WHEN** der Nutzer bei gesperrtem Song einen Takt mit Groove A auswählt und „zum Groove“ anklickt
- **THEN** öffnet die App den Pattern-Editor von A gesperrt

#### Scenario: Karten im gesperrten Song
- **WHEN** der Nutzer bei gesperrtem Song einen Takt mit Groove A auswählt
- **THEN** ist die Karte von A hervorgehoben

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

### Requirement: Fremde Änderungen im gesperrten Song
Änderungen, die während der Sperre über den Abgleich eintreffen, MUST im gesperrten Song erscheinen. Der Sperrzustand MUST dabei erhalten bleiben.

#### Scenario: Änderung eines Mitglieds
- **WHEN** ein anderes Mitglied den Titel des gerade gesperrt geöffneten Songs ändert
- **THEN** zeigt die Doppelseite den neuen Titel und der Song bleibt gesperrt

### Requirement: Wiedergabe beim Wechsel des Zustands
Ein Wechsel des Sperrzustands MUST eine laufende Wiedergabe unverändert weiterlaufen lassen.

#### Scenario: Sperren während der Wiedergabe
- **WHEN** der Song abgespielt wird und der Nutzer auf das Schloss klickt
- **THEN** läuft die Wiedergabe ohne Neustart weiter
