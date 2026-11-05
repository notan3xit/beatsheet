# app-header Specification

## Purpose

Legt den Aufbau der App-Kopfzeile fest: ein Menü mit allen Aktionen zu Datei und Konto und der Wahl von Farbschema und Klang sowie ein dauerhaft sichtbares Konto-Symbol.

## Requirements

### Requirement: Menü
Links in der Kopfzeile MUST ein Knopf mit Hamburger-Symbol und ohne Text ein Menü öffnen. Das Menü MUST die Einträge „Exportieren“ und „Importieren“ enthalten, dazu abgemeldet „Anmelden“ und angemeldet „Abmelden“, jeweils mit Symbol und Text. Ein Trennstrich MUST „Exportieren“ und „Importieren“ vom Eintrag zum Konto trennen. Unter dem Eintrag zum Konto MUST nach je einem weiteren Trennstrich der Abschnitt „Farbschema“ (siehe `color-theme`) und dann „Klang“ (siehe `playback-sound`) folgen.

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
Rechts in der Kopfzeile MUST immer ein Knopf ohne Text stehen. Mit Profil MUST er das Kürzel des Profils in seiner Farbe zeigen, wie bei den Mitgliedern eines Workbooks; abgemeldet oder ohne bekanntes Profil einen Kreis mit Personen-Silhouette, die am Kreisrand endet, angemeldet gefüllt und ohne Signalfarbe. Der Tooltip MUST angemeldet die Adresse nennen, abgemeldet „Anmelden“ lauten. Abgemeldet MUST der Knopf den Anmeldedialog öffnen, angemeldet das Konto-Popover öffnen und schließen.

#### Scenario: Abgemeldet
- **GIVEN** der Nutzer ist nicht angemeldet
- **WHEN** die Kopfzeile erscheint
- **THEN** zeigt sie das Konto-Symbol mit dem Tooltip „Anmelden“

#### Scenario: Angemeldet
- **GIVEN** der Nutzer ist als ich@example.com angemeldet
- **WHEN** die Kopfzeile erscheint
- **THEN** zeigt sie das gefüllte Konto-Symbol mit dem Tooltip „ich@example.com“

#### Scenario: Angemeldet mit Profil
- **GIVEN** der Nutzer ist als ich@example.com angemeldet und heißt „Artjom Weyand“ mit dem Kürzel „AW“ und der Farbe Grün
- **WHEN** die Kopfzeile erscheint
- **THEN** zeigt das Konto-Symbol „AW“ in Grün wie bei den Mitgliedern

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
Angemeldet MUST das Konto-Popover über den Knöpfen den Namen aus dem Profil, sofern bekannt, und die Adresse zeigen, darunter „Profil bearbeiten“ und „Abmelden“. „Abmelden“ MUST das Popover schließen.

#### Scenario: Inhalt
- **GIVEN** der Nutzer ist als ich@example.com angemeldet
- **WHEN** er das Konto-Symbol wählt
- **THEN** zeigt das Popover „ich@example.com“ und „Abmelden“

#### Scenario: Inhalt mit Profil
- **GIVEN** der Nutzer ist als ich@example.com angemeldet und heißt „Artjom Weyand“
- **WHEN** er das Konto-Symbol wählt
- **THEN** zeigt das Popover über den Knöpfen „Artjom Weyand“ und „ich@example.com“

#### Scenario: Abmelden im Popover
- **GIVEN** das Konto-Popover des angemeldeten Nutzers ist offen
- **WHEN** er „Abmelden“ wählt
- **THEN** schließt sich das Popover und er ist abgemeldet

### Requirement: Logo in der Kopfzeile
Zwischen Menü-Knopf und Konto-Symbol MUST die Kopfzeile das Logo als Überschrift zeigen: links das Symbol einer Roten Beete, rechts daneben den Schriftzug „beatsheet“. Die Überschrift MUST den zugänglichen Namen „Beatsheet“ tragen; Symbol und Striche MUST für Screenreader verborgen sein.

#### Scenario: Aufbau
- **WHEN** die Kopfzeile erscheint
- **THEN** stehen von links nach rechts Menü-Knopf, Beeten-Symbol, Schriftzug und Konto-Symbol

#### Scenario: Zugänglicher Name
- **WHEN** ein Screenreader die Kopfzeile liest
- **THEN** nennt er die Überschrift „Beatsheet“

### Requirement: Beeten-Symbol
Das Symbol MUST eine rundliche Knolle mit nach unten auslaufender Wurzelspitze und darüber grüne Blätter zeigen. Die Knolle MUST in einer Mischung aus „mauve“ und „maroon“ der aktiven Variante gehalten sein, die Blätter in „green“. Das Symbol MUST höher sein als die Kleinbuchstaben des Schriftzugs und mit ihm vertikal zentriert stehen.

#### Scenario: Farben im Hellmodus
- **WHEN** die Kopfzeile bei heller Systemeinstellung erscheint
- **THEN** ist die Knolle eine Mischung aus Latte „mauve“ und „maroon“ und die Blätter sind Latte „green“

#### Scenario: Farben im Dunkelmodus
- **WHEN** die Kopfzeile bei dunkler Systemeinstellung erscheint
- **THEN** ist die Knolle eine Mischung aus Mocha „mauve“ und „maroon“ und die Blätter sind Mocha „green“

### Requirement: Schrift des Schriftzugs
Der Schriftzug MUST in Kleinbuchstaben in der Schrift Comfortaa (fett) stehen. Die App MUST die Schrift selbst ausliefern, ohne Abruf von einem fremden Server. Die übrige Oberfläche MUST ihre bisherige Schrift behalten.

#### Scenario: Schrift
- **WHEN** die Kopfzeile erscheint
- **THEN** stehen die Buchstaben „b“, „a“, „t“, „s“, „h“ und „t“ des Schriftzugs in Comfortaa
- **AND** Menüeinträge und Seiteninhalt stehen in der bisherigen Schrift

#### Scenario: Keine fremde Quelle
- **WHEN** die App geladen wird
- **THEN** lädt sie die Schrift vom eigenen Server und von keinem anderen

### Requirement: „e“ aus drei Strichen
Jedes „e“ des Schriftzugs MUST aus drei waagerechten Strichen mit runden Enden bestehen, oberer und unterer gleich lang, der mittlere kürzer und links bündig. Der obere Strich MUST mit der Oberkante der Kleinbuchstaben abschließen, der untere auf der Grundlinie stehen. Jeder Strich MUST eine Akzentfarbe der aktiven Variante ungleich „red“ haben, die Striche eines „e“ MUST verschiedene Farben haben.

#### Scenario: Form
- **WHEN** die Kopfzeile erscheint
- **THEN** besteht jedes der drei „e“ aus drei waagerechten Strichen, der mittlere kürzer als die beiden anderen

#### Scenario: Höhe wie die Kleinbuchstaben
- **WHEN** die Kopfzeile erscheint
- **THEN** reichen die Striche eines „e“ von der Grundlinie bis zur Oberkante der Kleinbuchstaben wie „a“ und „s“

#### Scenario: Farben
- **WHEN** die Kopfzeile in hellem oder dunklem Farbschema erscheint
- **THEN** hat jeder Strich eine Akzentfarbe der aktiven Variante ungleich „red“
- **AND** die drei Striche eines „e“ unterscheiden sich in der Farbe
