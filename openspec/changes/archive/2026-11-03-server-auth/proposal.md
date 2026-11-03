# Proposal

## Why

Songs sollen in Workbooks mit anderen geteilt werden, über einen Server als zentrale Autorität. Dafür braucht es zuerst einen Server und eine Identität: Wer auf ein Workbook zugreift, muss angemeldet sein. Die Mail-Adresse ist die Identität; ein Einmalcode per Mail erspart Passwörter.

## What Changes

- Neue Server-Komponente im Repository (Node, Daten in SQLite), getrennt startbar.
- Anmeldung per Mail-Adresse und sechsstelligem Einmalcode: Code anfordern, Code eingeben, angemeldet. Beim ersten Anmelden entsteht das Konto.
- Sitzung per Cookie, bleibt über Neuladen hinweg bestehen; Abmelden beendet sie auf dem Server.
- Schutz vor Missbrauch: Codes laufen ab, Fehlversuche und Code-Anforderungen sind begrenzt, Codes und Sitzungsschlüssel liegen nicht im Klartext vor.
- In der App: Anmelden/Abmelden im Kopf, Anzeige der angemeldeten Adresse.
- Die App bleibt ohne Anmeldung und ohne erreichbaren Server vollständig nutzbar; Songs bleiben lokal.
- Für Tests ohne HTTPS: Der Vite-Dev-Server leitet `/api` an den Server weiter, App und Server teilen so einen Ursprung.

Nicht enthalten: Workbooks, Mitglieder, Teilen, Sync, Betrieb hinter HTTPS, Konto löschen oder Adresse ändern.

## Capabilities

### New Capabilities
- `account-auth`: Anmeldung per Mail und Einmalcode, Sitzung, Abmelden, Begrenzungen, Nutzung ohne Anmeldung.

### Modified Capabilities
- keine

## Impact

- Neu: `server/` (HTTP-Server, SQLite über `node:sqlite`, Mailversand über `$MAIL_OUTBOX`), Start mit `npm run server`
- Neu: `src/account/` (Client für die Anmelde-Schnittstelle), Komponente für Anmelden/Abmelden im App-Kopf (`src/ui/App.tsx`)
- `vite.config.ts`: Proxy `/api` im Dev-Server; `package.json`: Skripte, Build prüft auch `server/`
- Keine neue Laufzeitabhängigkeit; `AGENTS.md`: Aufbau und Befehle
