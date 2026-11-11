# pattern-sequencer Specification

## Purpose

Ermöglicht das Eingeben und Bearbeiten des Inhalts eines Patterns in einem Step-Raster statt in Notenschrift. Die Unterteilung ist pro Beat wählbar, damit sich gerade und triolische Figuren in einem Pattern mischen lassen.

## Requirements

### Requirement: Instrumentenset
Der Sequencer MUST für jedes Pattern genau diese Instrumente als Zeilen anbieten, von oben nach unten: Crash, Ride, Hi-Hat (geschlossen), Hi-Hat (offen), Tom 1, Tom 2, Snare, Standtom, Bassdrum, Hi-Hat-Pedal.

#### Scenario: Zeilen des Rasters
- **WHEN** der Nutzer ein Pattern im Sequencer öffnet
- **THEN** zeigt das Raster die zehn Instrumente in der festgelegten Reihenfolge

### Requirement: Raster aus Beats und Positionen
Der Sequencer MUST je Beat so viele Spalten zeigen, wie die Unterteilung des Beats vorgibt. Beats MUST visuell voneinander abgegrenzt und mit ihrer Nummer beschriftet sein.

#### Scenario: Gemischte Unterteilung
- **WHEN** ein Pattern mit 4 Beats in Sechzehnteln vorliegt und Beat 3 auf Achteltriolen steht
- **THEN** zeigt das Raster für die Beats 1, 2 und 4 je 4 Spalten und für Beat 3 genau 3 Spalten

### Requirement: Schläge setzen und entfernen
Der Nutzer MUST durch Aktivieren einer Rasterzelle einen Schlag für das Instrument an dieser Position setzen und durch erneutes Aktivieren wieder entfernen können. An einer Position MUST mehrere Instrumente gleichzeitig gesetzt sein können. Wird ein Schlag entfernt, MUST auch seine Spielweise entfallen; ein danach neu gesetzter Schlag MUST normal gespielt sein.

#### Scenario: Schlag setzen
- **WHEN** der Nutzer in Beat 1 die Zelle der Bassdrum an Position 1 aktiviert
- **THEN** enthält das Pattern einen Bassdrum-Schlag auf der „1“

#### Scenario: Schlag entfernen
- **WHEN** der Nutzer eine bereits gesetzte Zelle erneut aktiviert
- **THEN** ist der Schlag an dieser Position entfernt

#### Scenario: Gleichzeitige Schläge
- **WHEN** der Nutzer an derselben Position Hi-Hat und Snare setzt
- **THEN** enthält das Pattern beide Schläge an dieser Position

#### Scenario: Flam entfernen und neu setzen
- **WHEN** die Snare auf der „1“ einen Flam hat und der Nutzer die Zelle zweimal ohne Shift aktiviert
- **THEN** hat das Pattern auf der „1“ einen normalen Snare-Schlag ohne Flam

### Requirement: Hi-Hat geschlossen und offen schließen sich aus
An einer Position MUST höchstens eine der Varianten Hi-Hat (geschlossen) und Hi-Hat (offen) gesetzt sein. Setzt der Nutzer eine Variante, entfernt das System die andere an dieser Position.

#### Scenario: Wechsel auf offene Hi-Hat
- **WHEN** an einer Position die geschlossene Hi-Hat gesetzt ist und der Nutzer dort die offene Hi-Hat setzt
- **THEN** ist an dieser Position nur noch die offene Hi-Hat gesetzt

### Requirement: Unterteilung pro Beat
Der Nutzer MUST für jeden Beat einzeln eine Unterteilung wählen können: Achtel (2), Sechzehntel (4), Zweiunddreißigstel (8), Achteltriolen (3), Sechzehnteltriolen (6) oder Zweiunddreißigsteltriolen (12). Die Auswahl MUST sie in dieser Reihenfolge kurz als „8tel“, „16tel“, „32tel“, „8tel-Triolen“, „16tel-Triolen“ und „32tel-Triolen“ bezeichnen.

#### Scenario: Beat auf Triolen umstellen
- **WHEN** der Nutzer Beat 2 eines leeren Patterns von Sechzehnteln auf Achteltriolen umstellt
- **THEN** hat Beat 2 drei Positionen und die übrigen Beats bleiben unverändert

#### Scenario: Bezeichnungen in der Auswahl
- **WHEN** der Nutzer die Auswahl der Unterteilung eines Beats öffnet
- **THEN** stehen dort „8tel“, „16tel“, „32tel“, „8tel-Triolen“, „16tel-Triolen“ und „32tel-Triolen“ in dieser Reihenfolge

#### Scenario: Beat auf Zweiunddreißigsteltriolen umstellen
- **WHEN** der Nutzer Beat 1 eines leeren Patterns von Sechzehnteln auf Zweiunddreißigsteltriolen umstellt
- **THEN** hat Beat 1 zwölf Positionen und die übrigen Beats bleiben unverändert

#### Scenario: Beat auf Zweiunddreißigstel umstellen
- **WHEN** der Nutzer Beat 1 eines leeren Patterns von Sechzehnteln auf Zweiunddreißigstel umstellt
- **THEN** hat Beat 1 acht Positionen und die übrigen Beats bleiben unverändert

### Requirement: Schläge beim Wechsel der Unterteilung
Beim Wechsel der Unterteilung eines Beats MUST jeder Schlag erhalten bleiben, dessen zeitliche Lage innerhalb des Beats auch im neuen Raster existiert, zusammen mit seiner Spielweise. Gehen dabei Schläge verloren, MUST der Nutzer vorher bestätigen.

#### Scenario: Sechzehntel nach Achtel ohne Verlust
- **WHEN** ein Beat in Sechzehnteln Schläge auf den Positionen 1 und 3 hat und der Nutzer auf Achtel umstellt
- **THEN** liegen die Schläge ohne Nachfrage auf den Achtel-Positionen 1 und 2

#### Scenario: Achtel nach Sechzehntel
- **WHEN** ein Beat in Achteln Schläge auf den Positionen 1 und 2 hat und der Nutzer auf Sechzehntel umstellt
- **THEN** liegen die Schläge auf den Sechzehntel-Positionen 1 und 3

#### Scenario: Sechzehntel nach Triole mit Verlust
- **WHEN** ein Beat in Sechzehnteln Schläge auf den Positionen 1 und 2 hat und der Nutzer auf Achteltriolen umstellt
- **THEN** fragt das System nach einer Bestätigung, weil der Schlag auf Position 2 verloren ginge
- **AND** nach Bestätigung bleibt nur der Schlag auf Triolen-Position 1 erhalten
- **AND** bei Ablehnung bleibt der Beat unverändert in Sechzehnteln

#### Scenario: Achteltriole nach Sechzehnteltriole
- **WHEN** ein Beat in Achteltriolen Schläge auf allen drei Positionen hat und der Nutzer auf Sechzehnteltriolen umstellt
- **THEN** liegen die Schläge ohne Nachfrage auf den Positionen 1, 3 und 5

#### Scenario: Spielweise folgt dem Schlag
- **WHEN** ein Beat in Sechzehnteln eine Ghost Note der Snare auf Position 3 hat und der Nutzer auf Achtel umstellt
- **THEN** liegt auf Achtel-Position 2 eine Ghost Note der Snare

#### Scenario: Sechzehntel nach Zweiunddreißigstel
- **WHEN** ein Beat in Sechzehnteln Schläge auf allen vier Positionen hat und der Nutzer auf Zweiunddreißigstel umstellt
- **THEN** liegen die Schläge ohne Nachfrage auf den Positionen 1, 3, 5 und 7

#### Scenario: Zweiunddreißigstel nach Sechzehntel mit Verlust
- **WHEN** ein Beat in Zweiunddreißigsteln Schläge auf den Positionen 1 und 2 hat und der Nutzer auf Sechzehntel umstellt
- **THEN** fragt das System nach einer Bestätigung, weil der Schlag auf Position 2 verloren ginge
- **AND** nach Bestätigung bleibt nur der Schlag auf Sechzehntel-Position 1 erhalten

#### Scenario: Sechzehnteltriole nach Zweiunddreißigsteltriole
- **WHEN** ein Beat in Sechzehnteltriolen Schläge auf allen sechs Positionen hat und der Nutzer auf Zweiunddreißigsteltriolen umstellt
- **THEN** liegen die Schläge ohne Nachfrage auf den Positionen 1, 3, 5, 7, 9 und 11

#### Scenario: Achteltriole nach Zweiunddreißigsteltriole
- **WHEN** ein Beat in Achteltriolen Schläge auf allen drei Positionen hat und der Nutzer auf Zweiunddreißigsteltriolen umstellt
- **THEN** liegen die Schläge ohne Nachfrage auf den Positionen 1, 5 und 9

### Requirement: Änderungen rückgängig machen
Der Sequencer MUST Änderungen am Pattern-Inhalt rückgängig machen und wiederherstellen können, mindestens für die letzten 50 Schritte des aktuell geöffneten Patterns.

#### Scenario: Rückgängig und Wiederherstellen
- **WHEN** der Nutzer einen Schlag setzt und danach „Rückgängig“ wählt
- **THEN** ist der Schlag wieder entfernt
- **AND** nach „Wiederherstellen“ ist er wieder gesetzt

### Requirement: Notenvorschau beim Bearbeiten
Während der Nutzer im Sequencer arbeitet, MUST die Notendarstellung des Patterns sichtbar sein und nach jeder Änderung den aktuellen Inhalt zeigen.

#### Scenario: Vorschau aktualisiert sich
- **WHEN** der Nutzer im Sequencer einen Snare-Schlag setzt
- **THEN** zeigt die Notendarstellung den Snare-Schlag, ohne dass der Nutzer speichern oder neu laden muss

### Requirement: Spielweise eines Schlags
Ein Schlag MUST diese Spielweisen haben können: Snare normal, Flam, Drag, Ghost Note, Rim Shot, Cross-Stick; Tom 1, Tom 2 und Standtom normal, Flam, Drag, Ghost Note; Ride normal, Glocke; Crash normal, Choke. Die Zelle MUST ihre Spielweise anzeigen.

#### Scenario: Anzeige in der Zelle
- **WHEN** die Snare auf der „1“ eine Ghost Note hat
- **THEN** zeigt die Zelle an, dass dort eine Ghost Note liegt, und ihr zugänglicher Name nennt „Ghost Note“

### Requirement: Spielweise per Shift-Klick
Shift-Klick auf eine gesetzte Zelle eines Instruments mit Spielweisen nach „Spielweise eines Schlags“ MUST die Spielweise in der dort genannten Reihenfolge weiterschalten und nach der letzten zu normal zurückkehren. Shift-Klick auf eine leere Zelle MUST einen Schlag mit der ersten Spielweise nach normal setzen. Bei anderen Instrumenten MUST Shift-Klick nichts ändern.

#### Scenario: Spielweise durchschalten
- **WHEN** die Snare auf der „1“ gesetzt ist und der Nutzer die Zelle sechsmal mit Shift aktiviert
- **THEN** ist der Schlag nacheinander Flam, Drag, Ghost Note, Rim Shot, Cross-Stick und wieder normal

#### Scenario: Spielweisen der Toms
- **WHEN** Tom 1 auf der „1“ gesetzt ist und der Nutzer die Zelle viermal mit Shift aktiviert
- **THEN** ist der Schlag nacheinander Flam, Drag, Ghost Note und wieder normal

#### Scenario: Bell auf der Ride
- **WHEN** die Ride auf der „1“ gesetzt ist und der Nutzer die Zelle zweimal mit Shift aktiviert
- **THEN** ist der Schlag nacheinander Glocke und wieder normal

#### Scenario: Choke auf leerer Crash-Zelle
- **WHEN** der Nutzer eine leere Zelle der Crash mit Shift aktiviert
- **THEN** enthält das Pattern dort einen Crash-Schlag mit Choke

#### Scenario: Flam auf leerer Zelle
- **WHEN** der Nutzer eine leere Zelle von Tom 1 mit Shift aktiviert
- **THEN** enthält das Pattern dort einen Tom-1-Schlag mit Flam

#### Scenario: Shift-Klick auf der Hi-Hat
- **WHEN** der Nutzer eine Zelle der Hi-Hat (geschlossen) mit Shift aktiviert
- **THEN** bleibt das Pattern unverändert

### Requirement: Betonung eines Schlags
Jeder Schlag außer einer Ghost Note MUST zusätzlich zu seiner Spielweise betont sein können. Strg-Klick, auf dem Mac Cmd-Klick, auf eine gesetzte Zelle MUST die Betonung umschalten und die Spielweise beibehalten. Auf einer leeren Zelle MUST er einen betonten normalen Schlag setzen. Auf einer Ghost Note MUST er nichts ändern. Die Zelle MUST die Betonung anzeigen.

#### Scenario: Betonung umschalten
- **WHEN** die Hi-Hat auf der „1“ gesetzt ist und der Nutzer die Zelle zweimal mit Strg aktiviert
- **THEN** ist der Schlag nacheinander betont und wieder unbetont

#### Scenario: Mit Cmd auf dem Mac
- **WHEN** die Hi-Hat auf der „1“ gesetzt ist und der Nutzer die Zelle mit Cmd aktiviert
- **THEN** ist der Schlag betont

#### Scenario: Betonter Flam
- **WHEN** die Snare auf der „1“ einen Flam hat und der Nutzer die Zelle mit Strg aktiviert
- **THEN** ist der Schlag ein betonter Flam

#### Scenario: Leere Zelle
- **WHEN** der Nutzer eine leere Zelle der Bassdrum mit Strg aktiviert
- **THEN** enthält das Pattern dort einen betonten normalen Bassdrum-Schlag

#### Scenario: Ghost Note
- **WHEN** die Snare auf der „1“ eine Ghost Note hat und der Nutzer die Zelle mit Strg aktiviert
- **THEN** bleibt das Pattern unverändert

#### Scenario: Anzeige in der Zelle
- **WHEN** die Snare auf der „1“ ein betonter Rim Shot ist
- **THEN** zeigt die Zelle Spielweise und Betonung an, und ihr zugänglicher Name nennt „Rim Shot“ und „betont“

### Requirement: Betonung folgt ihrem Schlag
Wird ein Schlag entfernt, MUST seine Betonung mit entfallen. Wird eine Spielweise zur Ghost Note, MUST die Betonung entfallen. Beim Wechsel der Unterteilung MUST die Betonung mit ihrem Schlag wandern.

#### Scenario: Schlag entfernen und neu setzen
- **WHEN** die Snare auf der „1“ betont ist und der Nutzer die Zelle zweimal ohne Taste aktiviert
- **THEN** hat das Pattern auf der „1“ einen unbetonten normalen Snare-Schlag

#### Scenario: Weiterschalten zur Ghost Note
- **WHEN** die Snare auf der „1“ ein betonter Drag ist und der Nutzer die Zelle mit Shift aktiviert
- **THEN** ist der Schlag eine unbetonte Ghost Note

#### Scenario: Wechsel der Hi-Hat-Variante
- **WHEN** die geschlossene Hi-Hat auf der „1“ betont ist und der Nutzer dort die offene Hi-Hat setzt
- **THEN** ist an dieser Position eine unbetonte offene Hi-Hat gesetzt

#### Scenario: Wechsel der Unterteilung
- **WHEN** ein Beat in Sechzehnteln eine betonte Snare auf Position 3 hat und der Nutzer auf Achtel umstellt
- **THEN** liegt auf Achtel-Position 2 eine betonte Snare
