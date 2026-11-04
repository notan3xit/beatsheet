# Spec Delta

## MODIFIED Requirements

### Requirement: Song-Liste
Das System MUST die Songs in Karten auflisten: je Workbook eine Karte (siehe `workbooks`) und eine Karte „Meine Songs“ mit den lokalen und den zum Account gehörenden Songs (siehe `account-songs`). Jede Karte MUST ihre Songs alphabetisch nach Titel in einer Tabelle mit den Spalten Titel, Takte, Grooves und Fills zeigen, mit einer Kopfzeile. Ist „Meine Songs“ leer, MUST die Karte einen Hinweis zeigen, wie man den ersten Song anlegt. Die Auswahl eines Songs MUST seine Doppelseite öffnen.

#### Scenario: Sortierte Liste
- **WHEN** die Songs „Uprising“ (32 Takte, 2 Grooves, 1 Fill) und „Hysteria“ (0 Takte, keine Patterns) in „Meine Songs“ existieren
- **THEN** zeigt die Tabelle von „Meine Songs“ zuerst „Hysteria“ mit 0, 0, 0, dann „Uprising“ mit 32, 2, 1
- **AND** die Kopfzeile lautet Titel, Takte, Grooves, Fills

#### Scenario: Leere Liste
- **WHEN** keine Songs existieren
- **THEN** zeigt „Meine Songs“ einen Hinweis zum Anlegen des ersten Songs

#### Scenario: Song öffnen
- **WHEN** der Nutzer in einer Karte „Hysteria“ auswählt
- **THEN** zeigt die App die Doppelseite von „Hysteria“

#### Scenario: Neuer Song landet in „Meine Songs“
- **WHEN** der Nutzer über das Eingabefeld der Song-Liste den Song „Skizze“ anlegt
- **THEN** steht „Skizze“ in „Meine Songs“
