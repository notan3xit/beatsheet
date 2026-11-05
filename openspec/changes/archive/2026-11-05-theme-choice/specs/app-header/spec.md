# Spec Delta

## MODIFIED Requirements

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
