# Spec Delta

## ADDED Requirements

### Requirement: Dialog „Was ist neu“
Der Eintrag „Version“ im Menü MUST einen modalen Dialog „Was ist neu“ öffnen. Er MUST je Version die Nummer, das Datum und die Neuerungen als Stichpunkte zeigen, die aktuelle Version zuerst, ältere chronologisch rückwärts. Der Dialog MUST höchstens 32rem hoch sein, in kleineren Fenstern höchstens so hoch wie das Fenster abzüglich eines Rands. Passt die Liste nicht in den Dialog, MUST nur die Liste rollen. „Schließen“ und Escape MUST den Dialog schließen.

#### Scenario: Dialog öffnen
- **WHEN** der Nutzer im Menü den Eintrag „Version“ wählt
- **THEN** zeigt die App den Dialog „Was ist neu“
- **AND** das Menü ist geschlossen

#### Scenario: Reihenfolge der Versionen
- **GIVEN** es gibt Einträge für die Versionen 1.1.0 und 1.0.0
- **WHEN** der Dialog geöffnet ist
- **THEN** steht 1.1.0 mit Datum und Stichpunkten über 1.0.0

#### Scenario: Höhe bei großem Fenster
- **GIVEN** die Liste ist höher als der Dialog
- **WHEN** der Dialog in einem Fenster mit 1000 px Höhe geöffnet ist
- **THEN** ist er höchstens 32rem hoch und nur die Liste rollt

#### Scenario: Schließen
- **WHEN** der Nutzer im Dialog „Schließen“ wählt
- **THEN** ist der Dialog geschlossen

#### Scenario: Escape
- **WHEN** der Dialog geöffnet ist und der Nutzer Escape drückt
- **THEN** ist der Dialog geschlossen

### Requirement: Aktuelle Version
Die im Menü gezeigte Version MUST die Version des obersten Eintrags der Neuerungen sein, und diese MUST der Version des Pakets entsprechen.

#### Scenario: Version des Pakets
- **WHEN** das Paket eine Version hat
- **THEN** nennt der oberste Eintrag der Neuerungen dieselbe Version

## MODIFIED Requirements

### Requirement: Menü
Links in der Kopfzeile MUST ein Knopf mit Hamburger-Symbol und ohne Text ein Menü öffnen. Das Menü MUST die Einträge „Exportieren“ und „Importieren“ enthalten, dazu abgemeldet „Anmelden“ und angemeldet „Abmelden“, jeweils mit Symbol und Text. Ein Trennstrich MUST „Exportieren“ und „Importieren“ vom Eintrag zum Konto trennen. Unter dem Eintrag zum Konto MUST nach je einem weiteren Trennstrich der Abschnitt „Farbschema“ (siehe `color-theme`) und dann „Klang“ (siehe `playback-sound`) folgen. Ganz unten MUST nach einem weiteren Trennstrich der Eintrag „Version“ mit Symbol und der aktuellen Versionsnummer stehen.

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

#### Scenario: Abschnitt Farbschema
- **WHEN** der Nutzer das Menü öffnet
- **THEN** folgt nach dem Eintrag zum Konto ein Trennstrich und darunter der Abschnitt „Farbschema“ mit „Wie System“, „Hell“ und „Dunkel“

#### Scenario: Abschnitt Klang
- **WHEN** der Nutzer das Menü öffnet
- **THEN** folgt nach dem Abschnitt „Farbschema“ ein Trennstrich und darunter der Abschnitt „Klang“ mit „DRSKit“ und „Synth“

#### Scenario: Eintrag Version
- **WHEN** der Nutzer das Menü öffnet
- **THEN** folgt nach dem Abschnitt „Klang“ ein Trennstrich und darunter als Letztes der Eintrag „Version“ mit der aktuellen Versionsnummer
