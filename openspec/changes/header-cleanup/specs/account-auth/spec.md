# Spec Delta

## MODIFIED Requirements

### Requirement: Anmeldecode anfordern
Der Nutzer MUST in der App einen Anmeldecode für eine Mail-Adresse anfordern können. Der Server MUST an diese Adresse eine Mail mit einem sechsstelligen Code senden, der 10 Minuten gültig ist. Der Betreff der Mail MUST mit dem Code beginnen. Die Antwort MUST für bekannte und unbekannte Adressen gleich sein. Eine Anforderung MUST einen zuvor angeforderten Code derselben Adresse ungültig machen.

#### Scenario: Code anfordern
- **WHEN** der Nutzer „Anmelden“ wählt, „ich@example.com“ eingibt und „Code senden“ wählt
- **THEN** geht an ich@example.com eine Mail mit einem sechsstelligen Code
- **AND** die App fragt nach dem Code

#### Scenario: Code im Betreff
- **WHEN** der Server eine Anmeldemail mit dem Code 012345 sendet
- **THEN** lautet der Betreff „012345 ist dein Anmeldecode für beatsheet“

#### Scenario: Ungültige Adresse
- **WHEN** der Nutzer „keine-adresse“ eingibt und „Code senden“ wählt
- **THEN** wird keine Mail gesendet und die App meldet, dass die Adresse ungültig ist

#### Scenario: Neuer Code ersetzt den alten
- **WHEN** der Nutzer für dieselbe Adresse nach mehr als 30 Sekunden erneut einen Code anfordert
- **THEN** gilt nur noch der neue Code

### Requirement: Sitzung
Nach der Anmeldung MUST der Nutzer angemeldet bleiben, auch nach Neuladen oder Schließen der App, bis er sich abmeldet oder 90 Tage seit der Anmeldung vergangen sind. Die App MUST die Adresse des angemeldeten Nutzers im Tooltip des Konto-Symbols und im Konto-Popover zeigen.

#### Scenario: Neuladen
- **WHEN** der angemeldete Nutzer die App neu lädt
- **THEN** nennt der Tooltip des Konto-Symbols weiterhin seine Adresse

#### Scenario: Sitzung abgelaufen
- **WHEN** seit der Anmeldung mehr als 90 Tage vergangen sind
- **THEN** ist der Nutzer abgemeldet

## ADDED Requirements

### Requirement: Anmeldeformular schließen
Escape MUST das Anmeldeformular schließen und seinen Schritt behalten. „Abbrechen“ MUST es schließen und zum Schritt der Mail-Adresse zurückkehren. Ein Klick außerhalb des Dialogs MUST es offen lassen.

#### Scenario: Klick auf den Hintergrund
- **GIVEN** das Anmeldeformular ist offen
- **WHEN** der Nutzer auf den Hintergrund klickt
- **THEN** bleibt das Formular offen

#### Scenario: Escape im Code-Schritt
- **GIVEN** die App fragt nach dem Code für ich@example.com
- **WHEN** der Nutzer Escape drückt und danach das Konto-Symbol wählt
- **THEN** fragt die App weiterhin nach dem Code für ich@example.com

#### Scenario: Escape im Schritt der Mail-Adresse
- **GIVEN** das Anmeldeformular fragt nach der Mail-Adresse
- **WHEN** der Nutzer Escape drückt
- **THEN** schließt sich das Formular

#### Scenario: Abbrechen im Code-Schritt
- **GIVEN** die App fragt nach dem Code für ich@example.com
- **WHEN** der Nutzer „Abbrechen“ wählt und danach das Konto-Symbol wählt
- **THEN** fragt die App nach der Mail-Adresse

### Requirement: Stabile Anordnung im Anmeldedialog
Der Anmeldedialog MUST in allen Schritten und mit allen Meldungen dieselbe Größe behalten. Hinweise und Fehler MUST an genau einer Stelle unter dem Eingabefeld erscheinen, deren Platz immer freigehalten wird; ein Fehler MUST dort den Hinweis ersetzen. Elemente ohne eigene Höhe, die etwa ein Passwortmanager in das Formular einfügt, MUST Felder und Knöpfe nicht verschieben.

#### Scenario: Schritt wechselt
- **GIVEN** das Anmeldeformular fragt nach der Mail-Adresse
- **WHEN** der Nutzer einen Code anfordert
- **THEN** behält der Dialog seine Größe und das Feld und die Knöpfe ihre Stelle
- **AND** der Hinweis auf den gesendeten Code steht unter dem Eingabefeld

#### Scenario: Fehler ersetzt den Hinweis
- **GIVEN** die App fragt nach dem Code für ich@example.com
- **WHEN** der Nutzer einen falschen Code eingibt
- **THEN** steht die Fehlermeldung anstelle des Hinweises unter dem Eingabefeld
- **AND** Feld und Knöpfe behalten ihre Stelle

#### Scenario: Eingefügtes Element
- **GIVEN** das Anmeldeformular ist offen
- **WHEN** ein Passwortmanager neben dem Eingabefeld ein Element ohne eigene Höhe einfügt
- **THEN** bleiben die Knöpfe an ihrer Stelle

### Requirement: Code neu senden
Im Code-Schritt MUST links „Neu senden“ als Textknopf ohne Hintergrund stehen, rechts „Abbrechen“ und „Anmelden“, alle einzeilig. Nach erfolgreichem erneuten Senden MUST das Formular nennen, dass ein neuer Code geschickt wurde.

#### Scenario: Neu senden
- **GIVEN** die App fragt nach dem Code für ich@example.com
- **WHEN** der Nutzer nach mehr als 30 Sekunden „Neu senden“ wählt
- **THEN** nennt das Formular, dass ein neuer Code an ich@example.com geschickt wurde

#### Scenario: Neu senden zu früh
- **GIVEN** die App fragt nach dem Code für ich@example.com
- **WHEN** der Nutzer innerhalb von 30 Sekunden „Neu senden“ wählt
- **THEN** meldet die App, dass später erneut angefordert werden kann
- **AND** das Formular nennt keinen neuen Code
