# Spec Delta

## MODIFIED Requirements

### Requirement: Mitglied einladen
Der Besitzer MUST eine Mail-Adresse zum Workbook einladen können. Die Person MUST sofort Mitglied sein, auch ohne bestehendes Konto, und eine Mail mit Titel des Workbooks und Adresse des Besitzers erhalten; hat der Besitzer ein Profil, MUST die Mail auch seinen Namen nennen. Ungültige Adressen und vorhandene Mitglieder MUST die App mit einer Meldung ablehnen.

#### Scenario: Einladen
- **WHEN** der Besitzer anna@example.com zu „Band“ einlädt
- **THEN** ist anna@example.com unter den Mitgliedern von „Band“ aufgeführt
- **AND** an anna@example.com geht eine Mail, die „Band“ und die Adresse des Besitzers nennt

#### Scenario: Name des Besitzers in der Mail
- **GIVEN** der Besitzer ich@example.com heißt „Artjom“
- **WHEN** er anna@example.com zu „Band“ einlädt
- **THEN** lautet der Betreff der Mail „Artjom (ich@example.com) hat dich zu „Band“ eingeladen“

#### Scenario: Erste Anmeldung nach der Einladung
- **GIVEN** anna@example.com wurde zu „Band“ eingeladen und hatte noch kein Konto
- **WHEN** sie sich zum ersten Mal anmeldet
- **THEN** zeigt ihre Seitenleiste „Band“, und gewählt zeigt es alle Songs des Workbooks

#### Scenario: Bereits Mitglied
- **WHEN** der Besitzer eine Adresse einlädt, die schon Mitglied ist
- **THEN** meldet die App, dass die Person bereits Mitglied ist, und es geht keine Mail hinaus

## ADDED Requirements

### Requirement: Mitglieder mit Profil
Die Kürzel im Kopf eines Workbooks MUST für Mitglieder mit Profil ihr Kürzel in ihrer Farbe zeigen, die Mitgliederliste ihren Namen ohne Adresse. Mitglieder ohne Profil MUST mit ihrer Adresse, grau und mit dem Hinweis „noch nicht angemeldet“ erscheinen. Der Server MUST die Profile nur Mitgliedern gemeinsamer Workbooks zeigen.

#### Scenario: Kürzel in Farbe
- **GIVEN** anna@example.com heißt „Anna Berg“ mit dem Kürzel „AB“ und der Farbe Grün
- **WHEN** ein Mitglied „Band“ wählt
- **THEN** zeigt der Kopf von „Band“ für sie „AB“ in Grün

#### Scenario: Mitgliederliste
- **GIVEN** anna@example.com heißt „Anna Berg“
- **WHEN** ein Mitglied die Mitglieder von „Band“ öffnet
- **THEN** steht dort „Anna Berg“ und nicht „anna@example.com“

#### Scenario: Noch nicht angemeldet
- **GIVEN** ben@example.com wurde zu „Band“ eingeladen und hat sich nie angemeldet
- **WHEN** ein Mitglied die Mitglieder von „Band“ öffnet
- **THEN** steht dort „ben@example.com“ mit „noch nicht angemeldet“

### Requirement: Geänderte Profile erscheinen bei allen
Ändert ein Nutzer sein Profil, MUST die Änderung bei allen anderen Mitgliedern seiner Workbooks, die die App geöffnet haben und den Server erreichen, binnen 5 Sekunden erscheinen, ohne Neuladen.

#### Scenario: Neuer Name
- **GIVEN** anna@example.com und ich@example.com haben „Band“ geöffnet
- **WHEN** anna@example.com sich in „Anna B.“ umbenennt
- **THEN** zeigt die App von ich@example.com binnen 5 Sekunden „Anna B.“ unter den Mitgliedern von „Band“
