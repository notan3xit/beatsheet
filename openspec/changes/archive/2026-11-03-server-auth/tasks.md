# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests bleiben unverändert.

## 1. Setup

- [x] 1.1 Gerüst nach design.md D1, D2: `server/tsconfig.json`, `server/main.ts` (Argumente nach D3, startet einen leeren Server), Skript `server` in `package.json`, `tsc -p server` in `build`, `server-data` in `.gitignore`, Vitest-Projekte `app`/`server`. Prüfen: `npm run server -- --port 8790` startet und antwortet auf `curl localhost:8790/api/auth/session` mit 404; `npm test` grün wie vorher; `npm run build` gelingt

## 2. Capability `account-auth`: Server

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `server/auth.test.ts`: alle Szenarien der Spec `account-auth` außer den reinen App-Szenarien („Server nicht erreichbar“, „Anmelden ohne Server“) gegen den Handler aus `createApp` mit In-Memory-Datenbank, fester Uhr, festem Zufall und gesammelten Mails; dazu die Fehlercodes aus design.md D4, 415 ohne JSON-`Content-Type`, gleiche Antwort für bekannte und unbekannte Adressen, Begrenzung gesamt 50/Stunde. Prüfen: `npm test -- server` rot
- [x] 2.2 Tests erfassen (rot), `server/mail.test.ts`: Outbox-Mailer nach design.md D6 (Dateiname, keine `.tmp`-Datei danach, Modus `0644`, nur erlaubte Felder) in einem temporären Verzeichnis. Prüfen: `npm test -- mail` rot
- [x] 2.3 `server/db.ts` (Schema D5, Server-Geheimnis), `server/mail.ts` (D6), `server/auth.ts` und `server/app.ts` (D3–D5, D7), Anbindung in `server/main.ts`. Prüfen: `npm test -- server mail` grün, `tsc -p server` fehlerfrei

## 3. Capability `account-auth`: App

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `src/ui/account.test.tsx` mit einer Fake-`AccountApi`: „Code anfordern“, „Ungültige Adresse“, „Erste Anmeldung“, „Falscher Code“, „Abgelaufener Code“, „Zu viele Fehlversuche“, „Zweite Anforderung innerhalb von 30 Sekunden“ (Meldung), „Neuladen“ (Sitzung beim Start), „Abmelden“ (Songs unverändert), „Server nicht erreichbar“, „Anmelden ohne Server“. Zusätzlich `src/account/api.test.ts`: HTTP-Client bildet Statuscodes und Netzwerkfehler auf Ergebnisse ab (gemocktes `fetch`). Prüfen: `npm test -- account` rot
- [x] 3.2 `src/account/api.ts`, `src/ui/AccountMenu.tsx`, Prop `account` in `App`, Styles nur mit semantischen Tokens (D8). Prüfen: `npm test -- account styles` grün

## 4. Integration

- [x] 4.1 Proxy nach design.md D9 in `vite.config.ts`; `AGENTS.md`: Aufbau (`server/`, `src/account`) und Befehle (`npm run server`). Prüfen: `npm test`, `npm run build` grün, `npx tsc --noEmit` fehlerfrei
- [x] 4.2 Ende-zu-Ende mit artjom: Server mit `--insecure-cookie`, Dev-Server auf einem freigegebenen Port; von außen Code an eine echte Adresse anfordern, Mail kommt an, Anmelden, Neuladen, Abmelden; Datenbank enthält keinen Klartext-Code. Ergebnis in design.md festhalten
- [x] 4.3 `openspec validate server-auth --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
