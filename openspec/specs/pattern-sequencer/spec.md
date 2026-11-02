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
Der Nutzer MUST für jeden Beat einzeln eine Unterteilung wählen können: Achtel (2), Sechzehntel (4), Achteltriolen (3) oder Sechzehnteltriolen (6).

#### Scenario: Beat auf Triolen umstellen
- **WHEN** der Nutzer Beat 2 eines leeren Patterns von Sechzehnteln auf Achteltriolen umstellt
- **THEN** hat Beat 2 drei Positionen und die übrigen Beats bleiben unverändert

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
Schläge von Snare, Tom 1, Tom 2 und Standtom MUST die Spielweise normal, Flam oder Ghost Note haben können. Shift-Klick auf eine gesetzte Zelle dieser Instrumente MUST die Spielweise in der Reihenfolge normal, Flam, Ghost Note, normal weiterschalten. Shift-Klick auf eine leere Zelle MUST einen Schlag mit Flam setzen. Bei anderen Instrumenten MUST Shift-Klick nichts ändern. Die Zelle MUST ihre Spielweise anzeigen.

#### Scenario: Spielweise durchschalten
- **WHEN** die Snare auf der „1“ gesetzt ist und der Nutzer die Zelle dreimal mit Shift aktiviert
- **THEN** ist der Schlag nacheinander Flam, Ghost Note und wieder normal

#### Scenario: Flam auf leerer Zelle
- **WHEN** der Nutzer eine leere Zelle von Tom 1 mit Shift aktiviert
- **THEN** enthält das Pattern dort einen Tom-1-Schlag mit Flam

#### Scenario: Shift-Klick auf der Hi-Hat
- **WHEN** der Nutzer eine Zelle der Hi-Hat (geschlossen) mit Shift aktiviert
- **THEN** bleibt das Pattern unverändert

#### Scenario: Anzeige in der Zelle
- **WHEN** die Snare auf der „1“ eine Ghost Note hat
- **THEN** zeigt die Zelle an, dass dort eine Ghost Note liegt, und ihr zugänglicher Name nennt „Ghost Note“
