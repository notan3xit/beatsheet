## ADDED Requirements

### Requirement: Erklärung der Workbooks
Neben der Überschrift „Workbooks“ MUST ein Knopf mit dem Symbol eines Fragezeichens im Kreis und der Beschriftung „Was sind Workbooks?“ für Screenreader stehen, solange der Bereich sichtbar ist. Er MUST ein Popover öffnen und schließen, das in höchstens drei Sätzen erklärt, wozu Workbooks dienen. Das Popover MUST sich bei einem Klick außerhalb und mit Escape schließen. Der Bereich MUST ohne Workbook keinen Hinweistext zeigen.

#### Scenario: Erklärung öffnen
- **GIVEN** der Nutzer ist angemeldet
- **WHEN** er neben „Workbooks“ auf den Knopf „Was sind Workbooks?“ klickt
- **THEN** zeigt die App ein Popover mit der Erklärung der Workbooks

#### Scenario: Erklärung schließen
- **GIVEN** das Popover mit der Erklärung ist offen
- **WHEN** der Nutzer Escape drückt, außerhalb klickt oder erneut auf den Knopf „Was sind Workbooks?“ klickt
- **THEN** ist das Popover geschlossen

#### Scenario: Ohne Workbook
- **GIVEN** der Nutzer ist angemeldet und hat kein Workbook
- **WHEN** er die Startseite öffnet
- **THEN** zeigt der Bereich „Workbooks“ die Überschrift mit dem Knopf „Was sind Workbooks?“ und „+ Workbook“, aber keinen Hinweistext
