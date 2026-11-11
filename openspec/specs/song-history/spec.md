# song-history Specification

## Purpose

Macht die Änderungsgeschichte eines Songs sichtbar: wer wann was geändert hat, wie der Song zu einem früheren Zeitpunkt aussah, und erlaubt, einen früheren Stand als neue Änderung wiederherzustellen.

## Requirements

### Requirement: Autor einer Änderung
Jede Änderung, die ein angemeldeter Nutzer an einem Song vornimmt, MUST sein Konto als Autor tragen, auch wenn der Server gerade nicht erreichbar ist. Der Autor MUST das Konto über eine Kennung bezeichnen, die keine Adresse enthält. Änderungen ohne Anmeldung MUST keinen Autor tragen. Der Autor MUST mit der Änderung auf alle Geräte gelangen und unverändert bleiben. Ist der Autor einer Änderung eine Adresse, MUST die App ihn dem Konto dieser Adresse zuordnen und die Änderung für dieses Konto als eigene werten.

#### Scenario: Änderung im Workbook
- **WHEN** der angemeldete Nutzer „max@example.org“ im Workbook-Song „Hysteria“ einen Schlag setzt
- **THEN** zeigt der Verlauf des Songs auf jedem Gerät eines Mitglieds diese Änderung mit dem Autor „max@example.org“

#### Scenario: Keine Adresse im Song
- **WHEN** der angemeldete Nutzer „max@example.org“ einen Song ändert
- **THEN** enthält das gespeicherte Song-Dokument die Adresse „max@example.org“ nicht

#### Scenario: Offline nach Neustart
- **WHEN** der angemeldete Nutzer die App ohne erreichbaren Server neu startet und einen Workbook-Song ändert
- **THEN** trägt die Änderung sein Konto als Autor

#### Scenario: Ohne Anmeldung
- **WHEN** ein nicht angemeldeter Nutzer einen lokalen Song ändert
- **THEN** trägt die Änderung keinen Autor

#### Scenario: Adresse als Autor
- **GIVEN** eine Änderung an „Hysteria“ in „Band“ trägt die Adresse „max@example.org“ als Autor
- **AND** max@example.org ist Mitglied von „Band“ und heißt „Max“
- **WHEN** ein Mitglied den Verlauf von „Hysteria“ öffnet
- **THEN** erscheint die Änderung unter „Max“

#### Scenario: Eigene Adresse
- **GIVEN** eine Änderung an „Hysteria“ trägt die Adresse von Artjom als Autor
- **WHEN** Artjom einen früheren Stand wiederherstellt, der diese Änderung zurücknimmt
- **THEN** weist der Dialog nicht auf Änderungen anderer Autoren hin

### Requirement: Verlauf öffnen
Die Doppelseite MUST gesperrt wie entsperrt einen Knopf „Verlauf“ zeigen, zwischen „Song löschen“ und dem Schalter „Struktur ausklappen“. Er MUST die Ansicht „Verlauf“ des Songs öffnen. Die Ansicht MUST das Schloss des Songs zeigen, mit demselben Zustand wie Doppelseite und Pattern-Editor.

#### Scenario: Verlauf öffnen
- **WHEN** der Nutzer auf der Doppelseite von „Hysteria“ auf „Verlauf“ klickt
- **THEN** zeigt die App den Verlauf von „Hysteria“

#### Scenario: Sperrzustand bleibt
- **WHEN** der Nutzer den entsperrten Song „Hysteria“ öffnet, den Verlauf öffnet und zur Doppelseite zurückkehrt
- **THEN** ist der Song im Verlauf und danach auf der Doppelseite entsperrt

### Requirement: Kein Verlauf auf Smartphones
Ist das Fenster schmaler als 40rem, MUST die Doppelseite keinen Knopf „Verlauf“ zeigen, und eine Adresse, die den Verlauf eines Songs nennt, MUST die Doppelseite des Songs zeigen.

#### Scenario: Smartphone
- **WHEN** der Nutzer die Doppelseite von „Hysteria“ in einem 390 px breiten Fenster öffnet
- **THEN** gibt es keinen Knopf „Verlauf“

#### Scenario: Link auf den Verlauf am Smartphone
- **WHEN** die App in einem 390 px breiten Fenster mit einer Adresse gestartet wird, die den Verlauf von „Hysteria“ nennt
- **THEN** zeigt die App die Doppelseite von „Hysteria“ und die Adresse nennt diese Doppelseite

### Requirement: Gegenstand einer Änderung
Jede Änderung MUST genau einem Gegenstand zugeordnet sein: den Song-Daten (Titel, Tempo, Standard-Takt), der Struktur oder einem Pattern. Berührt eine Änderung mehrere, MUST sie in dieser Reihenfolge dem ersten zugeordnet sein; entfernt sie aber ein Pattern und in der Struktur nur die Verweise darauf, MUST sie dem Pattern zugeordnet sein. Eine Änderung ohne sichtbare Wirkung MUST dem Gegenstand der vorangehenden Änderung zugeordnet sein.

#### Scenario: Schlag setzen
- **WHEN** der Nutzer im Groove „Verse“ einen Schlag setzt
- **THEN** ist die Änderung dem Pattern „Verse“ zugeordnet

#### Scenario: Pattern aus der Struktur anlegen
- **WHEN** der Nutzer im Takt-Popover einen neuen Fill anlegt und dem Takt zuweist
- **THEN** ist die Änderung der Struktur zugeordnet

#### Scenario: Verwendetes Pattern löschen
- **WHEN** der Nutzer den Groove „Verse“ löscht, den drei Takte verwenden
- **THEN** ist die Änderung dem Pattern „Verse“ zugeordnet

### Requirement: Bearbeitungen
Der Verlauf MUST Änderungen zu Bearbeitungen zusammenfassen: aufeinanderfolgende Änderungen desselben Autors am selben Gegenstand am selben Kalendertag. Eine Änderung eines anderen Autors, an einem anderen Gegenstand oder an einem anderen Tag MUST eine neue Bearbeitung beginnen.

#### Scenario: Viele Klicks
- **WHEN** der Nutzer im Groove „Verse“ hintereinander 40 Schläge setzt und entfernt
- **THEN** zeigt der Verlauf dafür eine Bearbeitung

#### Scenario: Unterbrechung
- **WHEN** der Nutzer den Groove „Verse“ ändert, danach einen Takt zuweist und danach „Verse“ wieder ändert
- **THEN** zeigt der Verlauf zwei Bearbeitungen von „Verse“ und dazwischen eine der Struktur

#### Scenario: Neuer Tag
- **WHEN** der Nutzer den Groove „Verse“ am Montag und ohne andere Änderung dazwischen am Dienstag ändert
- **THEN** zeigt der Verlauf zwei Bearbeitungen von „Verse“

### Requirement: Leere Neuanlage
Legt ein Autor ein Pattern an und bleibt es ohne Schläge bis zu seiner nächsten Bearbeitung durch denselben Autor, MUST der Verlauf Anlage und diese Bearbeitung als eine Bearbeitung „neu“ zeigen, auch wenn andere Bearbeitungen dazwischen liegen. Änderungen von Name, Länge, Farbe oder Taktart des leeren Patterns MUST dazugehören. Ein Pattern mit Schlägen, etwa eine Kopie, MUST NOT so zusammengefasst werden.

#### Scenario: Fill anlegen, zuweisen, ausarbeiten
- **WHEN** der Nutzer einen leeren Fill „Fill 1“ anlegt, ihn in „Intro Fill“ umbenennt, einem Takt zuweist und dann Schläge setzt
- **THEN** zeigt der Verlauf eine Bearbeitung „Intro Fill“ als neu und dazwischen eine der Struktur
- **AND** keine eigene Bearbeitung für das Anlegen oder Umbenennen

#### Scenario: Kopie
- **WHEN** der Nutzer den Groove „Verse“ dupliziert, die Kopie ändert, einen Takt zuweist und die Kopie umbenennt
- **THEN** zeigt der Verlauf die Kopie als neu mit Hinweis auf „Verse“ und das Umbenennen als eigene Bearbeitung

### Requirement: Liste der Bearbeitungen
Der Verlauf MUST die Bearbeitungen neueste zuerst listen, mit Trennern je Kalendertag. Jede Bearbeitung MUST ihren Gegenstand mit Art und Namen, eine Zusammenfassung ihres Nettounterschieds und die Uhrzeit ihrer letzten Änderung zeigen. Eine Bearbeitung ohne Nettounterschied MUST als solche erkennbar und zurückgenommen dargestellt sein.

#### Scenario: Zusammenfassung
- **WHEN** der Nutzer im Groove „Verse“ sechs Schläge setzt und zwei entfernt
- **THEN** nennt die Bearbeitung „Verse“ als Groove und sechs neue und zwei entfernte Schläge

#### Scenario: Hin und zurück
- **WHEN** der Nutzer im Groove „Verse“ einen Schlag setzt und wieder entfernt
- **THEN** erscheint die Bearbeitung als eine ohne Nettounterschied

### Requirement: Personen im Verlauf
In einem Song eines gemeinsamen Workbooks MUST der Verlauf bei jedem Wechsel des Autors zwischen benachbarten Bearbeitungen eine Kopfzeile mit Kürzel, Farbe und Namen aus dem Profil des Autors zeigen, ohne bekanntes Profil seine Adresse. Ohne Autor oder wenn der Autor kein Mitglied des Workbooks ist, MUST sie „Unbekannt“ zeigen. In lokalen Songs und in „Meine Songs“ MUST der Verlauf keine Personen zeigen.

#### Scenario: Zwei Personen
- **WHEN** Artjom und danach Max den Song „Hysteria“ im gemeinsamen Workbook bearbeiten
- **THEN** zeigt der Verlauf oben eine Kopfzeile „Max“ mit dessen Bearbeitungen und darunter eine Kopfzeile „Artjom“

#### Scenario: Ausgetretenes Mitglied
- **GIVEN** Max hat „Hysteria“ in „Band“ bearbeitet und „Band“ danach verlassen
- **WHEN** ein Mitglied den Verlauf von „Hysteria“ öffnet
- **THEN** zeigt die Kopfzeile von Max’ Bearbeitungen „Unbekannt“

#### Scenario: Wieder eingeladen
- **GIVEN** Max hat „Hysteria“ in „Band“ bearbeitet, wurde aus „Band“ entfernt und wieder eingeladen
- **WHEN** ein Mitglied den Verlauf von „Hysteria“ öffnet
- **THEN** zeigt die Kopfzeile von Max’ Bearbeitungen „Max“

#### Scenario: Eigener Song
- **WHEN** der Nutzer den Verlauf eines Songs in „Meine Songs“ öffnet
- **THEN** zeigt der Verlauf keine Kopfzeilen mit Personen

### Requirement: Stand einer Bearbeitung
Der Verlauf MUST beim Öffnen die neueste Bearbeitung gewählt haben. Zur gewählten Bearbeitung MUST er ihren Stand zeigen und kennzeichnen, ob es der aktuelle Stand des Songs ist oder von wann er stammt.

#### Scenario: Ältere Bearbeitung wählen
- **WHEN** der Nutzer im Verlauf eine Bearbeitung von gestern 21:10 wählt
- **THEN** zeigt der Verlauf den Stand von gestern 21:10 und kennzeichnet ihn als früheren Stand

### Requirement: Schritte einer Bearbeitung
Zur gewählten Bearbeitung MUST ein Regler den Stand vor der Bearbeitung und den Stand nach jeder ihrer Änderungen wählbar machen, vorgewählt der letzte. Zwei Knöpfe „‹“ und „›“ MUST einen Schritt zurück bzw. vor gehen und am jeweiligen Ende wirkungslos sein. Die gewählte Position MUST als „vorher“ oder als Schritt von Gesamtzahl erkennbar sein.

#### Scenario: Zurückschritt
- **WHEN** die gewählte Bearbeitung 49 Änderungen hat und der Nutzer zweimal „‹“ klickt
- **THEN** zeigt der Verlauf den Stand nach Schritt 47 von 49

#### Scenario: Vor der Bearbeitung
- **WHEN** der Nutzer den Regler an den Anfang stellt
- **THEN** zeigt der Verlauf den Stand vor der Bearbeitung und „‹“ ist wirkungslos

### Requirement: Vergleich eines Patterns
Für eine Bearbeitung eines Patterns MUST der Verlauf in der Zeile unter den Song-Daten Name, Länge, Farbe und Taktart des Patterns zeigen, geänderte Werte alt und neu. Darunter MUST er den Sequencer im gewählten Stand lesend und mit allen Instrumenten zeigen, darüber den Sequencer vor der Bearbeitung (siehe „Sequencer vor der Bearbeitung“). Für eine Kopie MUST statt des Zustands davor ihre Vorlage erscheinen, für ein neues Pattern ohne Vorlage der Hinweis, dass es vorher nicht bestand.

#### Scenario: Umbenannt
- **WHEN** der Nutzer eine Bearbeitung wählt, in der der Groove „Breakdown 1“ in „Breakdown“ umbenannt wurde
- **THEN** erscheint beim Namen „Breakdown 1“ als alter und „Breakdown“ als neuer Wert

#### Scenario: Kopie
- **WHEN** der Nutzer die Bearbeitung einer Kopie von „Refrain“ wählt
- **THEN** zeigt der Verlauf links den Sequencer von „Refrain“ als Vorlage

### Requirement: Sequencer vor der Bearbeitung
Der Sequencer vor der Bearbeitung bzw. der Vorlage MUST eingeklappt erscheinen und sich auf- und wieder einklappen lassen. Hat die Bearbeitung die Unterteilung eines Beats geändert, MUST er aufgeklappt erscheinen. Beide Sequencer MUST in einem gemeinsamen Bereich stehen und gemeinsam scrollen, sodass ihre Beats übereinander bleiben.

#### Scenario: Eingeklappt
- **WHEN** der Nutzer eine Bearbeitung wählt, die im Groove „Verse“ Schläge setzt
- **THEN** ist der Sequencer vor der Bearbeitung eingeklappt und lässt sich aufklappen

#### Scenario: Unterteilung geändert
- **WHEN** der Nutzer eine Bearbeitung wählt, die einen Beat von 16teln auf Triolen umstellt
- **THEN** ist der Sequencer vor der Bearbeitung aufgeklappt

#### Scenario: Gemeinsam scrollen
- **WHEN** der Nutzer den aufgeklappten Vergleich waagrecht scrollt
- **THEN** scrollen beide Sequencer um dieselbe Strecke

### Requirement: Markierungen im Vergleichs-Sequencer
Der Sequencer des gewählten Stands MUST neue Schläge, Schläge mit geänderter Spielweise oder Betonung und entfernte Schläge je unterschiedlich markieren, unterscheidbar nicht nur über die Farbe. Schläge MUST nach ihrer Lage im Beat verglichen werden, sodass eine andere Unterteilung allein keinen Schlag als neu oder entfernt markiert. Spielweisen und Betonungen MUST wie im Sequencer des Pattern-Editors erscheinen.

#### Scenario: Spielweise geändert
- **WHEN** in der gewählten Bearbeitung ein Snare-Schlag von Ghost Note zu Rim Shot wechselte
- **THEN** ist dieser Schlag als geändert markiert und zeigt das Zeichen für Rim Shot

#### Scenario: Unterteilung gewechselt
- **WHEN** in der gewählten Bearbeitung ein Beat von 16teln zu 32teln wechselte und seine Schläge an derselben Lage blieben
- **THEN** ist keiner dieser Schläge als neu oder entfernt markiert

### Requirement: Verwendung eines Patterns im Song
Für eine Bearbeitung eines Patterns MUST der Verlauf das Motiv der Struktur im gewählten Stand zeigen, die Takte mit diesem Pattern in seiner Farbe, alle übrigen neutral. Ist das Pattern keinem Takt zugeordnet, MUST der Verlauf statt des Motivs darauf hinweisen.

#### Scenario: Groove im Refrain
- **WHEN** der Nutzer eine Bearbeitung des Grooves „Refrain“ wählt, der in zwei Segmenten verwendet wird
- **THEN** sind im Motiv nur die Takte dieser beiden Segmente mit „Refrain“ farbig

#### Scenario: Ohne Zuordnung
- **WHEN** der Nutzer eine Bearbeitung eines Fills wählt, der im gewählten Stand keinem Takt zugeordnet ist
- **THEN** zeigt der Verlauf den Hinweis und kein Motiv

### Requirement: Vergleich der Struktur
Für eine Bearbeitung der Struktur MUST der Verlauf die Struktur vor der Bearbeitung und im gewählten Stand als Motive nebeneinander zeigen, mit Segmentnamen und ohne Begrenzung der Zeilen. Farbig in ihrer Patternfarbe MUST nur Geändertes sein, vorher Entferntes und Umbelegtes, nachher Neues und Umbelegtes; alles Übrige neutral. Neue, verschobene und umbenannte Segmente MUST erkennbar sein, umbenannte mit altem und neuem Namen.

#### Scenario: Takte gekürzt
- **WHEN** in der gewählten Bearbeitung das Segment „Outro“ von vier auf zwei Takte gekürzt wurde
- **THEN** zeigt das Motiv vorher die beiden entfallenen Takte hervorgehoben und alle anderen Segmente neutral

#### Scenario: Segment umbenannt
- **WHEN** in der gewählten Bearbeitung das Segment „Refrain (Kopie)“ in „Refrain 2“ umbenannt wurde
- **THEN** zeigt das Motiv nachher „Refrain (Kopie)“ als alten und „Refrain 2“ als neuen Namen

### Requirement: Takte im Motiv
Jeder Takt in einem Motiv des Verlaufs MUST beim Überfahren sofort, ohne Verzögerung, am Zeiger einen Hinweis mit Taktnummer und den im jeweiligen Stand zugeordneten Groove und Fill zeigen, für einen leeren Takt, dass er leer ist. Der Hinweis MUST beim Verlassen des Takts verschwinden. Die zum Überfahren empfindliche Fläche MUST den ganzen Takt umfassen, nicht nur seinen Strich.

#### Scenario: Takt überfahren
- **WHEN** der Nutzer im Motiv vorher einen Takt mit Groove „Verse“ und Fill „Into Chorus“ überfährt
- **THEN** zeigt die App sofort einen Hinweis mit „Verse“ und „Into Chorus“

#### Scenario: Takt verlassen
- **WHEN** der Nutzer den Zeiger vom Takt auf eine Fläche außerhalb des Motivs bewegt
- **THEN** verschwindet der Hinweis

### Requirement: Vergleich der Song-Daten
Für jeden Stand MUST der Verlauf als Erstes Titel, Tempo und Standard-Takt des Songs zeigen. Für eine Bearbeitung der Song-Daten MUST er geänderte Werte alt und neu zeigen.

#### Scenario: Tempo geändert
- **WHEN** der Nutzer eine Bearbeitung wählt, in der das Tempo von 40 auf 117 stieg
- **THEN** erscheint beim Tempo 40 als alter und 117 als neuer Wert

### Requirement: Wiederherstellen anbieten
Zeigt der Verlauf nicht den aktuellen Stand, MUST er „<Art> auf diesen Stand“ für den Gegenstand der Bearbeitung anbieten, mit der Art „Groove“, „Fill“, „Struktur“ oder „Song-Daten“, und „Ganzen Song auf diesen Stand“. Beides MUST nur im entsperrten Song wirken.

#### Scenario: Groove
- **WHEN** der Nutzer im entsperrten Song einen früheren Stand des Grooves „Verse“ wählt
- **THEN** bietet der Verlauf „Groove auf diesen Stand“ und „Ganzen Song auf diesen Stand“ an

#### Scenario: Aktueller Stand
- **WHEN** der Nutzer die neueste Bearbeitung in ihrem letzten Schritt wählt
- **THEN** bietet der Verlauf kein Wiederherstellen an

#### Scenario: Gesperrt
- **WHEN** der Song gesperrt ist und der Nutzer einen früheren Stand wählt
- **THEN** lässt sich nichts wiederherstellen

### Requirement: Bestätigung des Wiederherstellens
Vor jedem Wiederherstellen MUST ein modaler Dialog Art und Zeitpunkt des Zielstands nennen und die Folgen je betroffenem Gegenstand: zurückgesetzt, wieder angelegt oder gelöscht, mit Namen, für Song-Daten alte und neue Werte. Nimmt das Wiederherstellen Änderungen anderer Autoren seit dem Zielstand zurück, MUST der Dialog darauf hinweisen. „Abbrechen“ und Escape MUST ohne Änderung schließen.

#### Scenario: Änderungen anderer
- **WHEN** Max den Groove „Verse“ nach dem gewählten Stand geändert hat und Artjom „Groove auf diesen Stand“ wählt
- **THEN** nennt der Dialog „Verse“ als zurückgesetzt und weist darauf hin, dass Änderungen von Max zurückgenommen werden

#### Scenario: Abbrechen
- **WHEN** der Nutzer im Dialog „Abbrechen“ wählt
- **THEN** bleibt der Song unverändert

#### Scenario: Nichts zu tun
- **WHEN** der Gegenstand im aktuellen Stand dem gewählten Stand entspricht
- **THEN** sagt der Dialog das und bietet nur „Abbrechen“ an

### Requirement: Pattern wiederherstellen
„Groove auf diesen Stand“ bzw. „Fill auf diesen Stand“ MUST das Pattern auf seinen Zustand im gewählten Stand setzen. Ist es inzwischen gelöscht, MUST es mit derselben ID wieder entstehen, ohne Zuordnungen zu Takten. Bestand es im gewählten Stand nicht, MUST es gelöscht werden. Struktur und andere Patterns MUST unverändert bleiben.

#### Scenario: Gelöschten Groove zurückholen
- **WHEN** der Nutzer den Stand vor dem Löschen des Grooves „Verse“ wählt und „Groove auf diesen Stand“ bestätigt
- **THEN** gibt es „Verse“ wieder mit den Schlägen von damals, und kein Takt verweist auf ihn

### Requirement: Struktur wiederherstellen
„Struktur auf diesen Stand“ MUST Segmente, Blöcke und Takte auf den gewählten Stand setzen. Verweist diese Struktur auf inzwischen gelöschte Patterns, MUST sie mit ihrem Zustand im gewählten Stand wieder entstehen. Andere Patterns und die Song-Daten MUST unverändert bleiben.

#### Scenario: Gelöschter Groove in der Struktur
- **WHEN** der gewählte Stand Takte mit dem inzwischen gelöschten Groove „Verse“ enthält und der Nutzer „Struktur auf diesen Stand“ bestätigt
- **THEN** zeigt die Struktur diese Takte wieder mit „Verse“, und „Verse“ ist wieder ein Pattern des Songs

### Requirement: Song-Daten und ganzen Song wiederherstellen
„Song-Daten auf diesen Stand“ MUST Titel, Tempo und Standard-Takt auf den gewählten Stand setzen und sonst nichts ändern. „Ganzen Song auf diesen Stand“ MUST Song-Daten, Struktur und alle Patterns auf den gewählten Stand setzen; später angelegte Patterns MUST dabei entfallen.

#### Scenario: Ganzer Song
- **WHEN** der Nutzer den Stand vor dem Anlegen des Fills „Intro Fill“ wählt und „Ganzen Song auf diesen Stand“ bestätigt
- **THEN** gleicht der Song dem gewählten Stand und „Intro Fill“ gibt es nicht mehr

### Requirement: Wiederherstellung als neue Änderung
Eine Wiederherstellung MUST eine neue Änderung auf dem aktuellen Stand sein, die sich wie jede Änderung speichert, abgleicht und mit gleichzeitigen Änderungen nach `song-merge` zusammenführt. Die bisherige Historie MUST erhalten bleiben. Der Verlauf MUST die Wiederherstellung als solche mit dem Zeitpunkt des Zielstands zeigen; sie MUST sich selbst wiederherstellen lassen.

#### Scenario: Eintrag im Verlauf
- **WHEN** der Nutzer den Groove „Verse“ auf den Stand von 20:31 wiederherstellt
- **THEN** zeigt der Verlauf oben eine Bearbeitung „Verse“ als Wiederherstellung des Stands von 20:31
- **AND** alle früheren Bearbeitungen stehen unverändert darunter

#### Scenario: Wiederherstellung zurücknehmen
- **WHEN** der Nutzer danach den Stand vor dieser Wiederherstellung wählt und „Groove auf diesen Stand“ bestätigt
- **THEN** hat „Verse“ wieder die Schläge von vor der Wiederherstellung

### Requirement: Änderungen während des geöffneten Verlaufs
Treffen Änderungen ein, während der Verlauf geöffnet ist, MUST die Liste sie zeigen. Die gewählte Bearbeitung und der gezeigte Stand MUST dabei gewählt bleiben.

#### Scenario: Max ändert gleichzeitig
- **WHEN** Artjom einen früheren Stand von „Verse“ ansieht und Max währenddessen das Tempo ändert
- **THEN** erscheint oben eine Bearbeitung der Song-Daten von Max, und Artjom sieht weiter denselben Stand von „Verse“
