# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren.

## 1. Profil auf dem Server

- [x] 1.1 Tests aus den Szenarien erfassen (rot), neu `server/profile.test.ts`: „Name und Farbe“ (leerer, zu langer, gleicher Name, Rot und unbekannte Farbe abgelehnt), Speichern und Laden über `GET`/`PUT /api/auth/profile`, `401` ohne Sitzung, Ereignis `workbooks` an die Mitglieder nach dem Speichern; Migration einer Datenbank ohne die neuen Spalten. Prüfen: `npm test -- server/profile` rot
- [x] 1.2 Spalten und Migration nach design.md D1, Endpunkte und Prüfung nach D2. Prüfen: die Tests aus 1.1 grün

## 2. Profile in Workbooks und Einladungsmail

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `server/workbooks.test.ts`: `profiles` nur für Mitglieder mit Profil und nur für Mitglieder des Workbooks, „Name des Besitzers in der Mail“, Mail ohne Profil wie bisher. Prüfen: `npm test -- server/workbooks` zeigt diese Tests rot
- [x] 2.2 `MemberProfile` und `Workbook.profiles` nach D3, `present` und Einladungsmail nach D7. Prüfen: die Tests aus 2.1 und `npm test -- src/sync src/persistence` grün

## 3. Profil im Client

- [x] 3.1 Tests aus den Szenarien erfassen (rot), neu `src/account/profile.test.ts`: „Vorbelegung des Profils“ (Name aus der Adresse, gleiche Farbe für dieselbe Adresse, nie Rot). Prüfen: `npm test -- src/account/profile` rot
- [x] 3.2 `suggestedName`, `suggestedColor` und `ProfileApi` nach D4. Prüfen: die Tests aus 3.1 grün

## 4. Dialog „Profil“

- [x] 4.1 Tests aus den Szenarien erfassen (rot), neu `src/ui/profile.test.tsx` mit Nachbau von `ProfileApi`: „Profil anlegen“ (erste Anmeldung, Escape und Klick daneben, Speichern, Abmelden, Neuladen, Server nicht erreichbar), „Name und Farbe“ (leerer Name mit Meldung), „Profil ändern“ (Name ändern, Abbrechen, Escape). Prüfen: `npm test -- src/ui/profile` rot
- [x] 4.2 `useProfile` nach D4, `ProfileDialog` und „Profil bearbeiten“ im Konto-Popover nach D5, CSS mit Tokens. Prüfen: die Tests aus 4.1, `account`, `appMenu` und `src/ui/styles.test.ts` grün

## 5. Mitglieder mit Profil

- [x] 5.1 Tests aus den Szenarien erfassen (rot), `src/ui/workbooks.test.tsx`: „Mitglieder mit Profil“ (Kürzel in Farbe, Mitgliederliste mit Namen, noch nicht angemeldet) und „Geänderte Profile erscheinen bei allen“ über ein neues `profiles` im Store. Prüfen: `npm test -- workbooks` zeigt diese Tests rot
- [x] 5.2 Kürzel, Tooltip und Mitgliederliste nach D6. Prüfen: die Tests aus 5.1 grün

## 6. Abschluss

- [x] 6.1 Browser-Prüfung `~/tools/playwright/beatsheet-check.mjs` um den Pflichtdialog nach der Anmeldung, „Profil bearbeiten“ und die Kürzel erweitern und in hell und dunkel ausführen. Prüfen: alle Prüfungen bestanden, Screenshots angesehen
- [x] 6.2 `npm run build`, `npm test` und `openspec validate member-profiles --strict`. Prüfen: alle fehlerfrei

## 7. Konto-Symbol und Popover mit Profil

- [x] 7.1 Tests erfassen (rot), `src/ui/profile.test.tsx`: „Angemeldet mit Profil“ und „Inhalt mit Profil“; ohne Profil bleibt die Silhouette. Prüfen: `npm test -- src/ui/profile` zeigt diese Tests rot
- [x] 7.2 `MemberAvatar` nach D8 verschieben, Konto-Symbol und Popover umsetzen, CSS mit Tokens, Browser-Prüfung nachziehen. Prüfen: die Tests aus 7.1, `npm test`, `npm run build` und Browser-Prüfung fehlerfrei, Screenshots angesehen

## 8. Kürzel im Profil

- [x] 8.1 Tests nachziehen und erfassen (rot): Kürzel in `server/profile.test.ts` (Speichern, Laden, ungültig), `server/workbooks.test.ts`, `src/account/profile.test.ts` (Vorbelegung), `src/ui/profile.test.tsx` („Kürzel bleibt bei geändertem Namen“, „Ungültiges Kürzel“, „Kürzel ändern“) und `src/ui/workbooks.test.tsx`. Prüfen: `npm test -- profile workbooks` zeigt die neuen Tests rot
- [x] 8.2 Spalte und Prüfung nach D1 und D2, `MemberProfile` nach D3, Dialog nach D5, Anzeige nach D6. Prüfen: `npm test`, `npm run build` und Browser-Prüfung fehlerfrei, Screenshots angesehen

## 9. Profile ohne Kürzel

- [x] 9.1 Tests erfassen (rot): „Gespeichertes Profil ohne Kürzel“ in `server/profile.test.ts` (Spalte `initials` leer, Name gesetzt) und in `src/account/profile.test.ts` (Antwort ohne Kürzel). Prüfen: `npm test -- profile` zeigt diese Tests rot
- [x] 9.2 `initialsOfName` nach `src/domain/profile.ts`, Ergänzung in `profileOf` und beim Laden im Client nach D6. Prüfen: `npm test`, `npm run build` und Browser-Prüfung fehlerfrei

## Workflow follow-up

- Vor dem Deployment die Datenbank des Servers sichern, weil D1 sie beim ersten Start migriert.
- Specs übernehmen und Change archivieren.
