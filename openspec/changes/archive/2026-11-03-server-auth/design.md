# Design

## Context

Siehe proposal.md. Bisher gibt es nur die Browser-App (Vite, React, Vitest mit jsdom; `src/test/setup.ts` setzt jsdom-Hilfen voraus). Abhängigkeiten in `App` werden für Tests als Props eingereicht (`player`). Der App-Kopf (`.app-header` in `src/ui/App.tsx`) enthält Titel und Export/Import.

Rahmen der Umgebung: Node 24 (bringt `node:sqlite` und das Ausführen von TypeScript ohne Build mit), Mailversand über JSON-Dateien in `$MAIL_OUTBOX` (Vertrag von fs4), öffentlich erreichbar nur über die freigegebenen Ports ohne TLS. Das Repository wird auch unter Windows benutzt.

Folge-Change: Workbooks und Sync nutzen Konto und Sitzung dieses Changes (WebSocket mit Sitzungs-Cookie).

## Goals / Non-Goals

**Goals:**
- Server ohne neue Laufzeitabhängigkeiten, unter Linux und Windows startbar.
- Server-Logik ohne echtes Netz, Mail und Uhr testbar.
- Testen von außen ohne HTTPS über einen gemeinsamen Ursprung.

**Non-Goals:**
- Betrieb hinter HTTPS, Prozessverwaltung, Deployment.
- Konto löschen, Adresse ändern, mehrere Sitzungen verwalten.

## Decisions

### D1: Verzeichnis `server/`, TypeScript direkt mit Node

Node 24 führt `.ts`-Dateien ohne Build aus (Type Stripping). Erlaubt ist nur entfernbare Syntax (kein `enum`, keine Parameter-Properties), Importe tragen die Endung `.ts`. Eigene `server/tsconfig.json` (`types: ["node"]`, kein DOM, `allowImportingTsExtensions`, `erasableSyntaxOnly`); `npm run build` prüft sie mit `tsc -p server`. Start: `npm run server` (`node server/main.ts`).
Alternative `tsx`/Build-Schritt: zusätzliche Abhängigkeit ohne Nutzen.

### D2: Vitest mit zwei Projekten

`vite.config.ts` → `test.projects`: `app` (`src/**`, jsdom, bisheriges Setup) und `server` (`server/**`, Umgebung `node`, ohne Setup). Das bestehende Setup greift auf jsdom-Objekte zu und ließe sich in der Node-Umgebung nicht laden.

### D3: HTTP mit `node:http`, Fabrik mit eingereichten Abhängigkeiten

`createApp({ db, now, mail, random })` liefert den Request-Handler; `server/main.ts` liest die Konfiguration und startet `http.createServer`. Tests rufen den Handler über einen Server auf einem freien Port auf und setzen Uhr, Zufall und Mail ein. Keine Router-Bibliothek: vier Endpunkte.

Konfiguration über Argumente (`node:util` `parseArgs`, unter Windows ohne Umgebungsvariablen nutzbar): `--port` (8787), `--host` (127.0.0.1), `--data` (`./server-data`, in `.gitignore`), `--insecure-cookie`. `$MAIL_OUTBOX` aus der Umgebung.

### D4: Schnittstelle

Alle Antworten JSON, Anfragen mit Körper MUST `Content-Type: application/json` tragen (sonst 415) und höchstens 4 KB groß sein.

| Endpunkt | Erfolg | Fehler |
|---|---|---|
| `POST /api/auth/code` `{email}` | 204 | 400 `invalid-email`, 429 `rate-limited` |
| `POST /api/auth/verify` `{email, code}` | 200 `{email}` + Cookie | 400 `wrong-code`, `expired`, `too-many-attempts`, `no-code` |
| `GET /api/auth/session` | 200 `{email}` | 401 |
| `POST /api/auth/logout` | 204, Cookie gelöscht | – |

`no-code`: keine offene Anforderung (nie angefordert oder bereits verwendet). Die Antwort von `/code` hängt nicht davon ab, ob ein Konto existiert.

### D5: Daten (SQLite über `node:sqlite`)

```
users          (id TEXT PK, email TEXT UNIQUE, created_at)
login_codes    (email TEXT PK, code_hash, expires_at, attempts)   -- je Adresse höchstens ein offener Code
code_requests  (email, at)                                         -- für die Begrenzungen, älter als 1 h wird gelöscht
sessions       (token_hash TEXT PK, user_id, created_at, expires_at)
```

- Code: `crypto.randomInt` sechsstellig mit führenden Nullen; gespeichert als HMAC-SHA-256 mit einem Server-Geheimnis (32 Bytes, beim ersten Start als Datei im Datenverzeichnis angelegt). Ein reiner Hash wäre bei 10⁶ möglichen Codes sofort umkehrbar.
- Sitzungsschlüssel: 32 Zufallsbytes (base64url), gespeichert als SHA-256.
- Ablauf: Code 10 Minuten, Sitzung 90 Tage ab Anmeldung (ohne Verlängerung).
- Begrenzung: je Adresse 1 je 30 Sekunden und 10/Stunde, gesamt 50/Stunde, gezählt über `code_requests`.
- Adressen: getrimmt und klein geschrieben; gültig, wenn höchstens 254 Zeichen, ohne Leer- und Steuerzeichen und in der Form `x@y.z`.

### D6: Mailversand

`createOutboxMailer(dir)` schreibt nach dem fs4-Vertrag: Name `<UTC YYYYMMDDTHHMMSS>_<id>.json`, zuerst `.<name>.tmp`, dann Umbenennen, Modus `0644`; Felder `from_name: "drumstuff"`, `to`, `subject`, `text`. Ohne `$MAIL_OUTBOX` gibt `createConsoleMailer()` die Mail auf der Konsole aus. Kein erneutes Schreiben bei Fehlern (der Vertrag verbietet doppelte Dateien); scheitert das Schreiben, antwortet `/code` mit 500.

### D7: Sitzungs-Cookie

`drumstuff_session`, `HttpOnly`, `SameSite=Lax`, `Path=/api`, `Max-Age` 90 Tage, `Secure` außer mit `--insecure-cookie` (nötig für Tests über reines HTTP; Browser verwerfen `Secure`-Cookies ohne HTTPS). Zusammen mit dem Pflicht-`Content-Type` (D4) können fremde Seiten keine Anfragen mit Sitzung auslösen.

### D8: Client

`src/account/api.ts`: Schnittstelle `AccountApi` (`session`, `requestCode`, `verify`, `logout`) mit Ergebnissen `{ ok: true, … } | { ok: false, error }`; Netzwerkfehler ergeben `unreachable`. `createHttpAccountApi()` nutzt `fetch` auf `/api`. `App` bekommt optional `account?: AccountApi` (wie `player`), Vorgabe ist die HTTP-Variante.

Komponente `AccountMenu` (`src/ui/AccountMenu.tsx`) im App-Kopf neben Export/Import: abgemeldet ein Knopf „Anmelden“, der ein Formular öffnet (Adresse → „Code senden“ → Code → „Anmelden“, „Abbrechen“); angemeldet die Adresse und „Abmelden“. Der Anmeldestatus ist lokaler Zustand der Komponente, nicht Teil des Notebook-Stores. Beim Start fragt sie `session()` ab; bis zur Antwort und bei `unreachable` zeigt sie „Anmelden“. Meldungen je Fehler auf Deutsch; Styles nur mit semantischen Tokens.

### D9: Test über die freigegebenen Ports

`vite.config.ts` → `server.proxy`: `/api` an `http://localhost:8787` (überschreibbar mit `DRUMSTUFF_API`). Testaufbau: Server mit `--insecure-cookie` auf localhost, Dev-Server mit `--host 0.0.0.0 --port <freigegebener Port>`. Der Server selbst muss dafür nicht öffentlich erreichbar sein. Container-spezifische Ports und Pfade stehen nicht im Repository.

Der Dev-Server liefert Dateien aus dem Projektverzeichnis aus, also auch das vorgegebene Datenverzeichnis `server-data`. `server.fs.deny` sperrt es zusätzlich zu Vites eigenen Sperren (`.env`, Schlüssel, `.git`); für Tests von außen liegt das Datenverzeichnis zudem außerhalb des Projekts (`--data`).

Ergebnis des Tests (2026-11-03): Code an eine echte Adresse angefordert, Mail kam an, Anmelden, Neuladen und Abmelden funktionieren (Sitzung danach aus der Datenbank gelöscht); nichts in `refused/`. Die Datenbank enthält den Code nicht (`login_codes` nach der Anmeldung leer) und vom Sitzungsschlüssel nur den SHA-256-Hash.

## Risks / Trade-offs

- [Reines HTTP beim Test: Code und Cookie unverschlüsselt] → Nur für Tests; Betrieb erst mit HTTPS-Name (eigener Schritt mit witek). `Secure` ist Vorgabe.
- [Missbrauch des gemeinsamen Mailversands von fs4] → Begrenzungen je Adresse und gesamt (D5); keine Mail bei ungültiger Adresse.
- [Raten von Codes] → 5 Fehlversuche je Code, 10 Codes je Stunde und Adresse: höchstens 50 Versuche pro Stunde bei 10⁶ Möglichkeiten.
- [`node:sqlite` noch nicht als stabil markiert] → Nutzung auf `DatabaseSync` mit einfachem SQL beschränkt, in `server/db.ts` gekapselt.
- [Type Stripping verbietet manche Syntax] → `erasableSyntaxOnly` meldet sie bei `tsc`.
