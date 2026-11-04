# Design

## Context

`server/main.ts` liest Argumente und startet `createApp`; `createApp` beantwortet alles außerhalb von `/api` mit `404`. Die App navigiert über den URL-Hash, Pfade außer Dateien gibt es also nicht. `node:sqlite` arbeitet synchron, und Schreibvorgänge sind damit abgeschlossen, bevor ein Signal-Handler läuft.

Die Betriebsumgebung startet die App in einem Standard-Image für Node 24 aus einem nur lesbaren Ordner. Beschreibbar ist nur das Datenverzeichnis. TLS und Komprimierung übernimmt der vorgelagerte Proxy. Die Produktionsabhängigkeiten enthalten keine nativen Module.

## Goals / Non-Goals

**Goals:**
- Ein Prozess, ein Port: Oberfläche und API aus demselben Ursprung.

**Non-Goals:**
- TLS, Komprimierung und Sicherheitskopfzeilen wie CSP: Die ersten beiden übernimmt der Proxy, CSP wäre ein eigener Change.
- Skript zum Veröffentlichen des Pakets.

## Decisions

**D1: Eigene Dateiauslieferung statt Bibliothek.** `server/static.ts` mit `node:fs` deckt den kleinen Bedarf ab und hält den Server frei von Abhängigkeiten. Alternative `serve-static`: mehr Funktionsumfang, als hier gebraucht wird.

**D2: Pfadprüfung auf Segmentebene.** Pfad dekodieren (bei Fehler `404`), an `/` und `\` trennen, jedes Segment gegen `.`-Anfang und Nullbyte prüfen, dann unter das Verzeichnis setzen und mit `lstat` auf eine reguläre Datei prüfen. Symlinks werden dadurch nicht ausgeliefert. Der Pfad kommt aus `request.url`, ohne Normalisierung durch einen Client.

**D3: Auslieferung nach dem API-Routing.** `createApp` erhält `staticDir?: string`. Ein erstes Segment `api` geht auch in kodierter Form nie an die Dateien. Andere Methoden als `GET` und `HEAD` bleiben beim JSON-`404`. Dateien werden gestreamt, weil das Bundle mehrere MB groß ist.

**D4: `Content-Type` als feste Tabelle.** Endungen von `dist` (`html`, `js`, `css`, `wasm`, `svg`, `png`, `ico`, `json`, `map`, `woff2`, `txt`), sonst `application/octet-stream`. Dazu `X-Content-Type-Options: nosniff`.

**D5: Health-Prüfung liest `sqlite_master`.** Das berührt die Datenbankdatei, anders als `SELECT 1`, und ist unabhängig vom Schema. Fehler werden als `503` beantwortet und auf die Konsole geschrieben. Der Pfad liest keine Sitzung.

**D6: Konfiguration in `server/config.ts`.** `readConfig(argv, env)` kapselt `parseArgs` und die Umgebung, damit der Vorrang ohne Prozessstart testbar ist. `MAIL_OUTBOX` zieht mit um. Neue Option `--static <verzeichnis>`.

**D7: Beenden ohne Wartezeit.** `server.close`, `closeAllConnections`, `db.close`, Exit `0`. Der Ereigniskanal würde ein Warten auf offene Verbindungen sonst immer bis zum Timeout ausreizen. Eine abgebrochene Anfrage holt der Abgleich des Clients nach (beim Öffnen des Ereigniskanals und regelmäßig); bestätigte Schreibvorgänge sind wegen der synchronen Datenbank abgeschlossen. Alternative Wartefrist: verzögert jeden Neustart ohne Gewinn. Der Test startet einen echten Prozess; PID 1 selbst wird nicht simuliert, das Verhalten hängt nur am registrierten Handler.

**D8: Paket statt Image.** Das Paket besteht aus `package.json`, `dist`, `server`, `src/domain`, `src/persistence` und `node_modules` nach `npm ci`, `npm run build` und `npm prune --omit=dev`. `server-data` gehört nie dazu. Es läuft mit `node --import ./server/register.ts server/main.ts --host 0.0.0.0 --port 8787 --data <daten> --static dist`. Der Bau braucht keine Container-Werkzeuge.

**D9: Prüfung des Pakets.** Der automatische Test stellt die Pfade in einem Temp-Verzeichnis zusammen, nimmt Schreibrechte und startet den echten Prozess; `node_modules` ist dabei eine Verknüpfung, und unter Windows entfällt der Test, weil dort Rechte und Signale anders wirken. Einmalig läuft dieselbe Prüfung von Hand mit echten Produktionsabhängigkeiten und durch `tar` gepackt.

## Risks / Trade-offs

- [Paket läuft erst auf dem Zielsystem im Standard-Image] → Dieselbe Node-Hauptversion und die Prüfung aus D9 decken fehlende Dateien ab; schlägt der Start dort fehl, greift das Zurücksetzen auf die vorherige Version.
- [Testdateien aus `server` und `src` im Paket] → Harmlos, sie werden im Betrieb nicht geladen.
- [Neuladen des Proxys schließt den Ereigniskanal] → `EventSource` verbindet neu, und der Client gleicht beim Öffnen ab.
