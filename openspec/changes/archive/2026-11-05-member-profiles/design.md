# Design

## Context

`users` kennt nur `id` und `email`. Mitglieder sind Mail-Adressen (`members.email`), auch ohne Konto, und `Workbook.members` ist auf Server, Client und in IndexedDB ein `string[]`. Die Anmeldung läuft über `AccountApi` und `AccountSession`; viele Tests bauen `AccountApi` nach. Änderungen an Workbooks erreichen Mitglieder über das Ereignis `workbooks`, auf das der Client mit einem Abgleich der Workbook-Liste reagiert.

## Goals / Non-Goals

**Goals:**
- Profile ergänzen, ohne `members` umzubauen und ohne die bestehenden Nachbauten von `AccountApi` anzufassen

**Non-Goals:**
- Profilbilder, Profilseiten anderer Nutzer

## Decisions

### D1: Spalten in `users`, Migration beim Öffnen

`users` erhält `name TEXT`, `initials TEXT` und `color TEXT`, alle `NULL` ohne Profil. `openDatabase` prüft mit `PRAGMA table_info(users)`, ob die Spalten fehlen, und ergänzt sie mit `ALTER TABLE`. Neue Datenbanken bekommen sie direkt über `SCHEMA`.

Alternative: eigene Tabelle `profiles`. Verworfen, weil ein Profil genau zu einem Account gehört und mit ihm entsteht.

### D2: Endpunkte `GET` und `PUT /api/auth/profile`

`GET` antwortet mit `{ profile: { name, initials, color } | null }`, `PUT` nimmt `{ name, initials, color }`, speichert und antwortet mit dem gespeicherten Profil; ohne Sitzung `401`, bei ungültigen Angaben `400` mit `invalid-profile`. Die Prüfung liegt in `server/profile.ts`: Name nach `trim` 1–40 Zeichen ohne `\p{Cc}`, `\p{Zl}`, `\p{Zp}`, wie beim Workbook-Titel; Kürzel nach `trim` 1–2 Codepunkte ohne `\s` und `\p{Cc}`; Farbe aus `PATTERN_COLORS` (`src/domain/types.ts`, ohne Rot). Nach dem Speichern sendet der Server `workbooks` an alle Mitglieder aller Workbooks des Nutzers und an ihn selbst.

`GET /api/auth/session` bleibt unverändert. So bleiben `AccountApi` und alle Nachbauten unberührt.

### D3: `Workbook.profiles`

`Workbook` erhält das optionale Feld `profiles?: Record<string, MemberProfile>` mit `MemberProfile = { name: string; initials: string; color: PatternColor }`, nur für Mitglieder mit Profil. `present` in `server/workbooks.ts` füllt es über einen Join von `members` mit `users`. Lokal gespeicherte Workbooks ohne das Feld bleiben gültig; eine neue IndexedDB-Version ist nicht nötig. Weil `present` nur Workbooks des Anfragenden liefert, sehen Profile nur Mitglieder gemeinsamer Workbooks.

Alternative: `members` als Liste von Objekten. Verworfen, weil das Server, Abgleich, Speicherung und gut 80 Teststellen umbaut, ohne mehr zu leisten.

### D4: `ProfileApi` und Zustand im Client

`src/account/profile.ts` enthält `ProfileApi` (`load`, `save`) mit HTTP-Umsetzung und die reinen Funktionen `suggestedName(email)` und `suggestedColor(email)`. Die Farbe kommt aus einem einfachen Hash der Adresse (FNV-1a) modulo der Anzahl der Pattern-Farben. `App` erhält wie bei `account` ein optionales Prop `profile` für Tests.

Ein `useProfile`-Zustand lädt das Profil, sobald eine Adresse bekannt ist, und unterscheidet `unknown` (noch nicht geladen oder Server nicht erreichbar), `none` und `{ name, color }`. Nur bei `none` erscheint der Pflichtdialog; `unknown` zeigt nichts. Beim Abmelden wird der Zustand verworfen.

### D5: Dialog „Profil“

`src/ui/ProfileDialog.tsx` nutzt dieselben Klassen wie der Anmeldedialog (`.login-dialog`, `.login-form`) für Breite, Titel, Felder, Meldungsplatz und Knöpfe. Beide stehen auf `.backdrop.anchored` oben verankert statt mittig, damit nach dem Anmelden der Profil-Dialog mit dem Titel an derselben Stelle erscheint und nur nach unten wächst. Modus `required`: kein Escape, kein Wegklicken, Knöpfe „Abmelden“ (links, als Textknopf) und „Speichern“; „Abmelden“ ruft dasselbe `useLogout` wie das Konto-Popover. Modus `edit`: zusätzlich „Abbrechen“ und Escape. Das Feld „Kürzel“ wird beim Öffnen über `initialsOfName` aus dem vorbelegten Namen gefüllt und danach nur vom Nutzer geändert. Die Farbe wird über eine Reihe runder Knöpfe mit `aria-pressed` gewählt, jeder mit dem Farbnamen als Beschriftung. Eine Vorschau zeigt das Kürzel in der gewählten Farbe. Fehler stehen an einer festen Stelle unter den Feldern, wie im Anmeldedialog.

Das Konto-Popover zeigt über den Knöpfen Name und Adresse und erhält „Profil bearbeiten“ neben „Abmelden“.

### D8: Konto-Symbol mit Profil

`AppHeader` gibt das eigene Profil an `AccountMenu` weiter. Mit Profil zeigt der Knopf dasselbe `MemberAvatar`-Kürzel wie die Mitglieder, in Symbolgröße; ohne bekanntes Profil, etwa wenn der Server nicht erreichbar ist, bleibt die Silhouette. Name und Tooltip des Knopfs bleiben `Konto <Adresse>` bzw. die Adresse. `MemberAvatar` zieht dafür aus `WorkbookCard.tsx` in `src/ui/MemberAvatar.tsx` und nimmt ein Profil und eine Adresse statt eines Workbooks.

### D6: Anzeige der Mitglieder

Mitglieder mit Profil zeigen ihr gespeichertes Kürzel, sonst wie bisher die Anfangsbuchstaben aus der Adresse. `initialsOfName` liegt in `src/domain/profile.ts`, damit auch der Server es nutzt (das Paket enthält `src/domain`, nicht `src/account`). Es liefert die Vorbelegung und das Kürzel für Profile, die vor dem Kürzel gespeichert wurden: Der Server ergänzt es in `profileOf`, der Client beim Laden, falls eine Antwort es nicht enthält. Kürzel mit Profil tragen die Farbe über `patternStyle` als Hintergrund (`color-mix` mit `--bg`, wie gefüllte Flächen), ohne Profil `--control`. Der Tooltip der Kürzel nennt Namen bzw. Adressen. Die Mitgliederliste zeigt den Namen mit kleinem Kürzel davor; ohne Profil die Adresse in `--muted` mit „noch nicht angemeldet“. Beim Besitzer entfällt der Hinweis: Er hat das Workbook mit einem Konto angelegt, ihm fehlt höchstens das Profil. Die Beschriftung von „Entfernen“ nennt weiter die Adresse, damit sie eindeutig bleibt.

### D7: Einladungsmail

Hat der Besitzer ein Profil, lautet der Betreff `<Name> (<Adresse>) hat dich zu „<Titel>“ eingeladen`, ebenso der erste Satz der Mail; sonst wie bisher. Ein Name kann keine Zeilenumbrüche enthalten (D2), der Betreff bleibt damit für `$MAIL_OUTBOX` gültig.

## Risks / Trade-offs

- [Bestehende Accounts sehen den Dialog beim nächsten Start] → Gewollt; mit der Vorbelegung reicht „Speichern“.
- [Gleiche Namen sind in der Mitgliederliste nicht zu unterscheiden] → Für kleine Gruppen vertretbar; „Entfernen“ nennt die Adresse.
- [Ein weiterer Aufruf beim Start] → Nur angemeldet, einmal je Start und nach dem Anmelden.
- [`ALTER TABLE` auf der laufenden Datenbank] → Nur Spalten mit `NULL`, schnell und ohne Umschreiben der Tabelle; vor dem Deployment eine Sicherung der Datenbank.
