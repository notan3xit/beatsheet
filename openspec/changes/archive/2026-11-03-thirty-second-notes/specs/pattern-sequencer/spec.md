# Spec Delta

## MODIFIED Requirements

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
