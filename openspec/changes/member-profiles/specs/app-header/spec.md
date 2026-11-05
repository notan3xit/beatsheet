# Spec Delta

## MODIFIED Requirements

### Requirement: Konto-Symbol
Rechts in der Kopfzeile MUST immer ein Knopf mit Konto-Symbol und ohne Text stehen. Das Symbol MUST ein Kreis mit einer Personen-Silhouette sein, die am Kreisrand endet. Angemeldet mit Profil MUST es statt der Silhouette das Kürzel des Profils in seiner Farbe zeigen, genauso wie bei den Mitgliedern eines Workbooks; angemeldet ohne bekanntes Profil MUST die Silhouette gefüllt sein, in derselben Farbe wie abgemeldet. Angemeldet MUST der Tooltip die Adresse nennen, abgemeldet MUST der Tooltip „Anmelden“ lauten. Abgemeldet MUST der Knopf den Anmeldedialog öffnen, angemeldet das Konto-Popover öffnen und schließen.

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
