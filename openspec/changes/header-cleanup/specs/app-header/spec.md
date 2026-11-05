# Spec Delta

## Purpose

Legt den Aufbau der App-Kopfzeile fest: ein Menü mit allen Aktionen zu Datei und Konto sowie ein dauerhaft sichtbares Konto-Symbol.

## ADDED Requirements

### Requirement: Menü
Links in der Kopfzeile MUST ein Knopf mit Hamburger-Symbol und ohne Text ein Menü öffnen. Das Menü MUST die Einträge „Exportieren“ und „Importieren“ enthalten, dazu abgemeldet „Anmelden“ und angemeldet „Abmelden“, jeweils mit Symbol und Text. Ein Trennstrich MUST „Exportieren“ und „Importieren“ vom Eintrag zum Konto trennen.

#### Scenario: Menü abgemeldet
- **GIVEN** der Nutzer ist nicht angemeldet
- **WHEN** er das Menü öffnet
- **THEN** enthält es „Exportieren“, „Importieren“ und „Anmelden“

#### Scenario: Menü angemeldet
- **GIVEN** der Nutzer ist angemeldet
- **WHEN** er das Menü öffnet
- **THEN** enthält es „Exportieren“, „Importieren“ und „Abmelden“

#### Scenario: Trennstrich
- **WHEN** der Nutzer das Menü öffnet
- **THEN** steht ein Trennstrich zwischen „Importieren“ und dem Eintrag zum Konto

### Requirement: Menü schließen
Das Menü MUST sich beim Wählen eines Eintrags, mit einem Klick außerhalb und mit Escape schließen.

#### Scenario: Klick außerhalb
- **GIVEN** das Menü ist offen
- **WHEN** der Nutzer außerhalb des Menüs klickt
- **THEN** schließt sich das Menü

#### Scenario: Escape
- **GIVEN** das Menü ist offen
- **WHEN** der Nutzer Escape drückt
- **THEN** schließt sich das Menü

### Requirement: Export und Import über das Menü
„Exportieren“ und „Importieren“ im Menü MUST die Bibliothek exportieren bzw. die Dateiauswahl für den Import öffnen. Eine gewählte Datei MUST auch nach dem Schließen des Menüs den Import-Dialog öffnen.

#### Scenario: Exportieren
- **WHEN** der Nutzer im Menü „Exportieren“ wählt
- **THEN** erhält er die Export-Datei
- **AND** das Menü ist geschlossen

#### Scenario: Importieren
- **WHEN** der Nutzer im Menü „Importieren“ wählt und eine gültige Datei auswählt
- **THEN** zeigt die App den Import-Dialog mit den Songs der Datei
- **AND** das Menü ist geschlossen

### Requirement: Anmelden und Abmelden über das Menü
„Anmelden“ im Menü MUST denselben Anmeldedialog öffnen wie das Konto-Symbol. „Abmelden“ im Menü MUST dieselbe Aktion auslösen wie „Abmelden“ im Konto-Popover, einschließlich der Nachfrage bei nicht übertragenen Änderungen.

#### Scenario: Anmelden im Menü
- **GIVEN** der Nutzer ist nicht angemeldet
- **WHEN** er im Menü „Anmelden“ wählt
- **THEN** zeigt die App den Anmeldedialog
- **AND** das Menü ist geschlossen

#### Scenario: Abmelden im Menü
- **GIVEN** der Nutzer ist angemeldet
- **WHEN** er im Menü „Abmelden“ wählt
- **THEN** ist er abgemeldet

#### Scenario: Abmelden im Menü mit nicht übertragenen Änderungen
- **GIVEN** der Nutzer ist angemeldet und Änderungen konnten nicht übertragen werden
- **WHEN** er im Menü „Abmelden“ wählt
- **THEN** fragt die App nach, bevor sie ihn abmeldet

### Requirement: Konto-Symbol
Rechts in der Kopfzeile MUST immer ein Knopf mit Konto-Symbol und ohne Text stehen. Das Symbol MUST ein Kreis mit einer Personen-Silhouette sein, die am Kreisrand endet. Angemeldet MUST die Silhouette gefüllt sein, in derselben Farbe wie abgemeldet und ohne Signalfarbe, und der Tooltip die Adresse nennen, abgemeldet MUST der Tooltip „Anmelden“ lauten. Abgemeldet MUST der Knopf den Anmeldedialog öffnen, angemeldet das Konto-Popover öffnen und schließen.

#### Scenario: Abgemeldet
- **GIVEN** der Nutzer ist nicht angemeldet
- **WHEN** die Kopfzeile erscheint
- **THEN** zeigt sie das Konto-Symbol mit dem Tooltip „Anmelden“

#### Scenario: Angemeldet
- **GIVEN** der Nutzer ist als ich@example.com angemeldet
- **WHEN** die Kopfzeile erscheint
- **THEN** zeigt sie das gefüllte Konto-Symbol mit dem Tooltip „ich@example.com“

#### Scenario: Symbol bleibt beim Öffnen
- **GIVEN** der Nutzer ist angemeldet
- **WHEN** er das Konto-Symbol wählt
- **THEN** öffnet sich das Konto-Popover
- **AND** das Konto-Symbol bleibt sichtbar

#### Scenario: Symbol schließt das Popover
- **GIVEN** das Konto-Popover des angemeldeten Nutzers ist offen
- **WHEN** der Nutzer das Konto-Symbol wählt
- **THEN** schließt sich das Konto-Popover

### Requirement: Anmeldedialog
Das Anmeldeformular MUST als modaler Dialog mittig über einem abgedunkelten Hintergrund erscheinen, gleich ob es aus dem Menü oder über das Konto-Symbol geöffnet wurde.

#### Scenario: Über das Konto-Symbol
- **GIVEN** der Nutzer ist nicht angemeldet
- **WHEN** er das Konto-Symbol wählt
- **THEN** zeigt die App den Anmeldedialog

#### Scenario: Kontrast zum Hintergrund
- **WHEN** der Anmeldedialog in hellem oder dunklem Farbschema offen ist
- **THEN** ist die Seite dahinter dunkler als ohne Dialog
- **AND** der Dialog hebt sich mit einem Rand vom Hintergrund ab

#### Scenario: Schritt bleibt über beide Wege
- **GIVEN** die App fragt nach dem Code und der Dialog wurde mit Escape geschlossen
- **WHEN** der Nutzer im Menü „Anmelden“ wählt
- **THEN** fragt der Dialog weiterhin nach dem Code

### Requirement: Konto-Popover angemeldet
Angemeldet MUST das Konto-Popover die Adresse und „Abmelden“ zeigen. „Abmelden“ MUST das Popover schließen.

#### Scenario: Inhalt
- **GIVEN** der Nutzer ist als ich@example.com angemeldet
- **WHEN** er das Konto-Symbol wählt
- **THEN** zeigt das Popover „ich@example.com“ und „Abmelden“

#### Scenario: Abmelden im Popover
- **GIVEN** das Konto-Popover des angemeldeten Nutzers ist offen
- **WHEN** er „Abmelden“ wählt
- **THEN** schließt sich das Popover und er ist abgemeldet
