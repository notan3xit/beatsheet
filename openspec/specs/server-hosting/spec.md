# server-hosting Specification

## Purpose

Macht den Server als einzelnen Dienst betreibbar: Oberfläche und API auf einem Port, überwachbar, von außen konfigurierbar und jederzeit sauber beendbar.

## Requirements

### Requirement: Auslieferung der Oberfläche
Ist ein Verzeichnis für die Oberfläche konfiguriert, MUST der Server dessen Dateien auf `GET` und `HEAD` ausliefern, `/` als `index.html`, jeweils mit dem zur Dateiendung passenden `Content-Type`. Pfade unter `/api` MUST weiterhin nur die API erreichen. Ohne konfiguriertes Verzeichnis MUST der Server außerhalb von `/api` mit `404` antworten.

#### Scenario: Startseite
- **GIVEN** ein Verzeichnis für die Oberfläche mit `index.html`
- **WHEN** ein Browser `GET /` anfragt
- **THEN** antwortet der Server mit `200`, dem Inhalt von `index.html` und dem Typ `text/html`

#### Scenario: Datei mit passendem Typ
- **WHEN** ein Browser eine vorhandene `.js`-Datei anfragt
- **THEN** antwortet der Server mit `200`, ihrem Inhalt und einem JavaScript-Typ

#### Scenario: HEAD
- **WHEN** ein Client `HEAD /` anfragt
- **THEN** antwortet der Server mit `200` und denselben Kopfzeilen wie bei `GET`, ohne Körper

#### Scenario: Unbekannte Datei
- **WHEN** ein Browser eine Datei anfragt, die es nicht gibt
- **THEN** antwortet der Server mit `404`

#### Scenario: Unbekannter API-Pfad
- **GIVEN** das Verzeichnis enthält eine Datei `api/x`
- **WHEN** ein Client `GET /api/x` anfragt
- **THEN** antwortet der Server mit `404` und dem JSON-Fehler `not-found`

#### Scenario: Ohne Verzeichnis
- **GIVEN** kein Verzeichnis für die Oberfläche ist konfiguriert
- **WHEN** ein Browser `GET /` anfragt
- **THEN** antwortet der Server mit `404`

### Requirement: Kein Zugriff außerhalb des Verzeichnisses
Der Server MUST ausschließlich reguläre Dateien innerhalb des Verzeichnisses der Oberfläche ausliefern. Pfade, die es verlassen oder ein Segment mit führendem Punkt enthalten, MUST er mit `404` beantworten, auch in kodierter Form.

#### Scenario: Pfad aus dem Verzeichnis heraus
- **GIVEN** neben dem Verzeichnis liegt eine Datei `secret`
- **WHEN** ein Client `/../secret` oder `/%2e%2e/secret` oder `/..%2fsecret` anfragt
- **THEN** antwortet der Server mit `404` und liefert die Datei nicht aus

#### Scenario: Punktdatei
- **GIVEN** das Verzeichnis enthält `.env`
- **WHEN** ein Client `/.env` anfragt
- **THEN** antwortet der Server mit `404`

#### Scenario: Verzeichnis als Pfad
- **WHEN** ein Client den Pfad eines Unterverzeichnisses anfragt
- **THEN** antwortet der Server mit `404`

#### Scenario: Ungültige Kodierung
- **WHEN** ein Client `/%ff%` oder einen Pfad mit Nullbyte anfragt
- **THEN** antwortet der Server mit `404`

### Requirement: Zwischenspeichern der Oberfläche
Dateien unter `/assets/` tragen einen Inhalts-Hash im Namen und MUST als ein Jahr unveränderlich zwischenspeicherbar ausgeliefert werden. Alle anderen Dateien MUST der Browser vor jeder Verwendung neu prüfen müssen, damit eine neue Version sofort ankommt.

#### Scenario: Gehashte Datei
- **WHEN** ein Browser eine Datei unter `/assets/` anfragt
- **THEN** enthält die Antwort `Cache-Control: public, max-age=31536000, immutable`

#### Scenario: Startseite nach neuer Version
- **WHEN** ein Browser `/` anfragt
- **THEN** enthält die Antwort `Cache-Control: no-cache`

### Requirement: Health-Pfad
`GET /api/health` MUST ohne Anmeldung mit `200` antworten, solange die Datenbank lesbar ist, und sonst mit `503`. Die Antwort MUST NOT zwischengespeichert werden und MUST NOT Daten von Accounts oder Songs enthalten.

#### Scenario: Gesunder Server
- **WHEN** ein Client ohne Sitzung `GET /api/health` anfragt
- **THEN** antwortet der Server mit `200`, `Cache-Control: no-store` und dem Körper `{"status":"ok"}`

#### Scenario: Datenbank nicht lesbar
- **GIVEN** die Datenbank ist nicht lesbar
- **WHEN** ein Client `GET /api/health` anfragt
- **THEN** antwortet der Server mit `503` und dem JSON-Fehler `unhealthy`

### Requirement: Adresse der App aus der Umgebung
Die Adresse der App für Links in Einladungsmails MUST aus `--app-url` kommen, sonst aus der Umgebungsvariable `BEATSHEET_APP_URL`. Eine leere Variable MUST wie eine fehlende gelten.

#### Scenario: Nur Umgebungsvariable
- **GIVEN** `BEATSHEET_APP_URL=https://a.example` und kein `--app-url`
- **WHEN** der Server seine Konfiguration liest
- **THEN** ist die Adresse der App `https://a.example`

#### Scenario: Argument hat Vorrang
- **GIVEN** `BEATSHEET_APP_URL=https://a.example` und `--app-url https://b.example`
- **WHEN** der Server seine Konfiguration liest
- **THEN** ist die Adresse der App `https://b.example`

#### Scenario: Leere Variable
- **GIVEN** `BEATSHEET_APP_URL` ist leer und kein `--app-url`
- **WHEN** der Server seine Konfiguration liest
- **THEN** ist keine Adresse der App gesetzt

### Requirement: Beenden auf SIGTERM
Auf `SIGTERM` MUST der Server keine neuen Verbindungen annehmen, bestehende Verbindungen einschließlich des Ereigniskanals schließen, die Datenbank schließen und sich mit Code `0` beenden, auch als PID 1. Bestätigte Änderungen MUST danach erhalten sein.

#### Scenario: Beenden mit offenem Ereigniskanal
- **GIVEN** ein laufender Serverprozess mit einem offenen Ereigniskanal
- **WHEN** der Prozess `SIGTERM` erhält
- **THEN** endet er innerhalb von zwei Sekunden mit Code `0`

#### Scenario: Daten nach dem Beenden
- **GIVEN** ein Serverprozess, bei dem ein Anmeldecode angefordert und bestätigt wurde
- **WHEN** der Prozess `SIGTERM` erhält und neu mit demselben Datenverzeichnis startet
- **THEN** gilt die zuvor erhaltene Sitzung weiterhin

### Requirement: Betrieb aus einem Paket
Der Server MUST allein mit `package.json`, `dist`, `server`, `src/domain`, `src/persistence` und den Produktionsabhängigkeiten laufen. Er MUST ohne Schreibrechte in diesem Paket arbeiten und MUST nur in das Datenverzeichnis schreiben.

#### Scenario: Start aus dem Paket
- **GIVEN** ein Verzeichnis nur mit den Pfaden des Pakets
- **WHEN** der Server dort mit `--static dist` startet
- **THEN** antworten `/` und `/api/health` jeweils mit `200`, und ein Anmeldecode lässt sich anfordern

#### Scenario: Schreibgeschütztes Paket
- **GIVEN** das Paket ist nicht beschreibbar und das Datenverzeichnis liegt außerhalb
- **WHEN** der Server läuft und ein Anmeldecode angefordert wird
- **THEN** arbeitet er fehlerfrei, und im Paket ist keine Datei hinzugekommen
