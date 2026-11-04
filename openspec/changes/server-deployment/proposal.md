# Proposal

## Why

Die App soll unter einer eigenen Adresse mit Anmeldung und Abgleich laufen. Dafür braucht es einen Prozess, der Oberfläche und API auf einem Port bedient und aus einem nur lesbaren Paket läuft. Der Server liefert bisher nur `/api`, hat keinen Health-Pfad, beendet sich als PID 1 nicht auf `SIGTERM` und bekommt die Adresse der App nur als Argument.

## What Changes

- Der Server liefert auf Wunsch das gebaute Frontend aus einem Verzeichnis aus.
- Neuer Endpunkt `GET /api/health`: `200` ohne Anmeldung, solange die Datenbank antwortet.
- Die Adresse der App für Einladungsmails kann auch aus `BEATSHEET_APP_URL` kommen; `--app-url` hat Vorrang.
- Der Server beendet sich bei `SIGTERM` sofort und sauber.
- Festgelegter Paketinhalt, aus dem der Server allein und schreibgeschützt läuft.

Nicht Teil des Changes: das Skript zum Veröffentlichen eines Pakets (liegt außerhalb des Repos) und das Abschalten der statischen Veröffentlichung.

## Capabilities

### New Capabilities

- `server-hosting`: Betrieb des Servers als einzelner Dienst: Auslieferung der Oberfläche, Health-Pfad, Konfiguration, Beenden und Betrieb aus einem Paket.

### Modified Capabilities

Keine.

## Impact

- `server/main.ts`, `server/app.ts`, `server/testHarness.ts`; neu `server/config.ts`, `server/static.ts`
- API: neuer Endpunkt `GET /api/health`; bestehende Endpunkte unverändert
- `AGENTS.md`: Serveroptionen und Paketbau
- Keine neuen Abhängigkeiten
