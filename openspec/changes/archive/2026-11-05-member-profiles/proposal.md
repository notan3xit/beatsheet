# Proposal

## Why

Mitglieder eines Workbooks erscheinen nur als Mail-Adressen und graue Kürzel. In einer Gruppe ist schwer zu erkennen, wer wer ist, und Adressen sind ein schlechter Ersatz für Namen.

## What Changes

- Jeder Account hat ein Profil aus Name, Kürzel und Farbe; das Kürzel ist aus dem Namen vorbelegt und lässt sich ändern.
- Nach der Anmeldung MUST ein Nutzer ohne Profil es anlegen, bevor er die App nutzt: Ein Dialog, vorbelegt aus der Mail-Adresse, lässt sich nur mit „Speichern“ oder „Abmelden“ verlassen. Das gilt auch für bestehende Accounts beim nächsten Start.
- Über „Profil bearbeiten“ im Konto-Popover lässt sich das Profil jederzeit ändern.
- Im Workbook zeigen die Mitglieder-Kürzel Farbe und Anfangsbuchstaben des Namens; die Mitgliederliste zeigt Namen statt Adressen. Eingeladene ohne Konto erscheinen weiter mit ihrer Adresse und dem Hinweis „noch nicht angemeldet“.
- Änderungen am Profil erscheinen bei allen anderen Mitgliedern gemeinsamer Workbooks.
- Die Einladungsmail nennt den Namen des Besitzers zusätzlich zu seiner Adresse.

Mit Profil zeigt auch das Konto-Symbol oben rechts das farbige Kürzel, und das Konto-Popover nennt Name und Adresse.

## Capabilities

### New Capabilities
- `account-profile`: Name, Kürzel und Farbe eines Accounts, Pflicht zum Anlegen und Ändern

### Modified Capabilities
- `workbooks`: Anzeige der Mitglieder mit Profil, Einladungsmail mit Namen des Besitzers
- `app-header`: Konto-Symbol mit Kürzel und Farbe des Profils, Name und Adresse im Konto-Popover

## Impact

- `server/db.ts` (Spalten `name`, `initials` und `color` in `users`, Migration bestehender Datenbanken), `server/profile.ts`, `server/app.ts` (Endpunkt zum Laden und Speichern des Profils), `server/workbooks.ts` (Profile der Mitglieder, Einladungsmail)
- `src/domain/types.ts` (`Workbook.profiles` optional), `src/account/` (Profil-API und Vorbelegung), `src/ui/` (Profil-Dialog, Konto-Popover, Kürzel, Mitgliederliste)
- Keine Änderung am Dateiformat; lokal gespeicherte Workbooks ohne `profiles` bleiben gültig
