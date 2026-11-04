# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren.

## 1. Auslieferung der Oberfläche

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `server/static.test.ts` gegen `createApp` mit Temp-Verzeichnis (`staticDir` im `testHarness`): Startseite, Typ, `HEAD`, unbekannte Datei, `/api/x` mit gleichnamiger Datei, ohne Verzeichnis, Traversal roh und kodiert über rohe HTTP-Anfragen, Punktdatei, Unterverzeichnis, ungültige Kodierung, Nullbyte, `Cache-Control` für `/assets/` und `/`. Prüfen: `npm test -- static` rot
- [x] 1.2 `server/static.ts` nach D1, D2, D4 und Einbindung in `createApp` nach D3. Prüfen: `npm test -- static` grün, `tsc -p server` fehlerfrei

## 2. Health-Pfad

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `server/health.test.ts`: `200` ohne Sitzung mit `no-store` und Körper, `503` nach `db.close()`. Prüfen: `npm test -- health` rot
- [x] 2.2 `GET /api/health` nach D5 in `createApp`. Prüfen: `npm test -- health` grün

## 3. Konfiguration

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `server/config.test.ts`: Umgebungsvariable, Vorrang von `--app-url`, leere Variable, `--static`, `MAIL_OUTBOX`. Prüfen: `npm test -- config` rot
- [x] 3.2 `server/config.ts` nach D6, `server/main.ts` darauf umstellen. Prüfen: `npm test -- config` grün; `npm run server` startet mit den bisherigen Vorgaben

## 4. Beenden

- [x] 4.1 Tests aus den Szenarien erfassen (rot), `server/shutdown.test.ts` mit echtem Prozess (`node --import ./server/register.ts server/main.ts`, freier Port, Temp-Datenverzeichnis, Code aus der Konsolen-Mail): Ende mit Code `0` innerhalb von zwei Sekunden bei offenem Ereigniskanal, Sitzung nach Neustart gültig. Prüfen: `npm test -- shutdown` rot
- [x] 4.2 `SIGTERM`-Handler nach D7 in `server/main.ts`. Prüfen: `npm test -- shutdown` grün

## 5. Betrieb aus einem Paket

- [x] 5.1 Test aus den Szenarien erfassen, `server/package.test.ts` nach D9: Start aus dem Paket, schreibgeschütztes Paket ohne neue Dateien. Der Server kann das schon, ein Rot entfällt daher. Prüfen: `npm test -- package` grün
- [x] 5.2 Manuelle Prüfung nach D9: `npm ci`, `npm run build`, Paket mit Produktionsabhängigkeiten zusammenstellen, mit `tar` packen, entpacken, Schreibrechte entziehen und mit dem Befehl aus D8 starten. Prüfen: `/` und `/api/health` liefern `200`, `POST /api/auth/code` liefert `204`

## 6. Dokumentation und Abschluss

- [x] 6.1 `AGENTS.md` ergänzen: Option `--static`, `BEATSHEET_APP_URL`, Health-Pfad und Paketbau, ohne umgebungsspezifische Angaben. Prüfen: Die genannten Befehle stimmen mit `package.json` und `server/config.ts` überein
- [x] 6.2 Gesamtprüfung: `npm run build`, `npm test` und `openspec validate server-deployment --strict` fehlerfrei

## Workflow follow-up

- Specs übernehmen und den Change archivieren.
- Außerhalb des Repos: `beatsheet-release` packt das Paket, sobald der App-Ordner angelegt ist.
