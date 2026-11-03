# Design

## Context

Siehe proposal.md. Ausgangslage:

- **Client:**
  - `connectStore` schreibt jede Store-Änderung entprellt (300 ms) ins Repository.
  - Das Repository hält je Song ein Automerge-Dokument im Speicher und in IndexedDB (Version 3, Store `documents` mit `{id, bytes}`).
  - `applySong` überträgt einen Song als minimale Änderung ins Dokument, `songOf` liest ihn normalisiert zurück. Die Dokumentform enthält die Song-ID.
- **Server:**
  - `server/` führt TypeScript ohne Build aus.
  - Anmeldung, Sitzungs-Cookie und Mailversand stammen aus `server-auth`.
  - JSON-Körper sind dort auf 4 KB begrenzt, Mitglieder werden über die Mail-Adresse identifiziert.
- **Account-Status:** Den Anmeldestatus kennt bisher nur `AccountMenu` (lokaler Zustand).
- **Song löschen:** Die Nachfrage steht in `Songbook.tsx`.
- **Automerge-Doku:**
  - Für Abgleich ohne gespeicherten Zustand sind `saveSince(doc, heads)` und `loadIncremental` vorgesehen.
  - Zwei unabhängig erzeugte Dokumente haben keine gemeinsame Herkunft und lassen sich nicht sinnvoll zusammenführen. Gleichzeitig angelegte Container unter demselben Schlüssel verdrängen sich.

## Goals / Non-Goals

**Goals:**
- Server und Client nutzen dieselbe Dokumentform und dieselbe Formatprüfung.
- Der Sync-Endpunkt bleibt ohne Zustand je Verbindung; die Benachrichtigung ist davon getrennt.
- Kein Verlust lokaler Änderungen durch das Zusammenspiel von Store, Repository und Sync.
- Testbar ohne echtes Netz: Server-Handler im Test, zwei Clients mit getrennten Datenbanken.

**Non-Goals:**
- Automerge-Sync-Protokoll (`generateSyncMessage`), WebSocket, Anwesenheit.
- Kompaktierung oder inkrementelle Speicherung auf dem Server.
- Mehrere Serverprozesse (die Benachrichtigung liegt im Speicher eines Prozesses).

## Decisions

### D1: Gemeinsamer Code von Server und Client

Der Server importiert `src/persistence/songDoc.ts` und `src/persistence/fileFormat.ts` direkt.
- **Laufzeit:** `src/` importiert ohne Dateiendung. Ein Resolve-Hook (`server/resolve.ts`, registriert über `server/register.ts` mit `node --import`) ergänzt bei relativen Importen ohne Endung `.ts`.
- **Typprüfung:** `server/tsconfig.json` prüft mit `module: Preserve`, `moduleResolution: Bundler`. `NodeNext` verlangt Endungen und scheitert an `src/`.
- **Syntax:** Die mitbenutzten Module unterliegen damit auch `erasableSyntaxOnly`.
- **Vorabprobe:** Laden, `songOf` und der Abgleich über Export und Import liefen unter Node 24. Ein kaputtes Dokument wurde abgewiesen.

Alternativen:
- Logik im Server duplizieren: Dann laufen zwei Prüfungen auseinander.
- Endungen in `src/` ergänzen: Das ändert viele Dateien ohne fachlichen Grund.

### D2: Daten auf dem Server

```
workbooks    (id TEXT PK, title, owner TEXT, created_at)          -- owner = Mail-Adresse
members      (workbook_id, email, added_at, PK (workbook_id, email))  -- Besitzer ist auch Mitglied
songs        (id TEXT PK, workbook_id, doc BLOB, deleted INTEGER, updated_at)
invitations  (owner TEXT, at)                                      -- für die Begrenzung
```

- **Mitglieder:** Sie werden über die Mail-Adresse geführt (normalisiert wie in `account-auth`). Eine Einladung braucht daher kein Konto, und `account-auth` bleibt unverändert.
- **Song-IDs:** Sie sind global eindeutig. Ein gelöschter Song bleibt als Grabstein (`deleted = 1`, `doc` leer), damit Geräte, die offline waren, vom Löschen erfahren. Die ID bleibt dabei belegt.
- **Gespeicherter Stand:** Pro Song wird ein Stand gespeichert, `A.save` nach jeder angenommenen Änderung.

### D3: Schnittstelle

Alle Endpunkte erfordern eine Sitzung (sonst 401). Ein Workbook, in dem der Nutzer nicht Mitglied ist, ergibt 404. Körper sind JSON mit Pflicht-`Content-Type`. Die Grenze liegt bei 2 MB für `/api/workbooks/**`, bei 4 KB für die übrigen Endpunkte. Binärdaten werden in base64 übertragen.

| Endpunkt | Erfolg | Fehler |
|---|---|---|
| `GET /api/workbooks` | 200 `{workbooks: [{id, title, owner, members}]}` | |
| `POST /api/workbooks` `{title?}` | 201 Workbook | 400 `invalid-title` |
| `PATCH /api/workbooks/:id` `{title}` | 200 | 403 `not-owner`, 400 `invalid-title` |
| `DELETE /api/workbooks/:id` | 204 | 403 `not-owner`, 409 `not-empty` |
| `POST /api/workbooks/:id/members` `{email}` | 204, Mail | 403 `not-owner`, 400 `invalid-email`, 409 `already-member`, 429 `rate-limited` |
| `DELETE /api/workbooks/:id/members/:email` | 204 | 403 (Fremde entfernen ohne Besitz; Besitzer verlässt sich selbst) |
| `POST /api/workbooks/:id/songs` `{id, doc}` | 201 | 409 `exists`, 422 `invalid-song` |
| `DELETE /api/workbooks/:id/songs/:songId` | 204 | 404 |
| `POST /api/workbooks/:id/sync` (D4) | 200 | |
| `GET /api/events` (D6) | `text/event-stream` | 401 |

`POST /songs` verschiebt einen Song ins Workbook: Er bringt das vollständige Dokument mit. Ein Song, der in einer Karte angelegt wird, nutzt denselben Endpunkt.

### D4: Abgleich mit Heads

Der Client merkt sich je Workbook-Song `serverHeads`: den letzten Stand, den er mit dem Server geteilt hat.

```
Anfrage:  { songs: [{ id, base: serverHeads, changes?: saveSince(doc, base) }] }
Server je bekanntem Song des Workbooks:
  Client nennt ihn nicht            -> { id, status: 'new', doc: save(serverDoc) }
  Grabstein                         -> { id, status: 'deleted' }
  base leer oder !hasHeads(base)    -> { id, status: 'unrelated', doc: save(serverDoc) }
  changes: loadIncremental in Kopie; Prüfung (D5) scheitert
                                    -> { id, status: 'invalid', doc: save(serverDoc) }
  sonst                             -> speichern; { id, status: 'ok', changes: saveSince(serverDoc, clientHeads), heads }
Client nennt einen unbekannten Song -> { id, status: 'deleted' }
```

`clientHeads` sind die Heads nach dem Einspielen der Client-Änderungen. Der Client bekommt also nichts zurück, was er selbst geschickt hat.

**Erkennen getrennter Herkunft:** Lokal entsteht ein Dokument nur über `createSongDoc`, also ohne Server-Stand (`base` leer). Hat der Server den Song schon, ist ein leeres oder unbekanntes `base` genau der Fall der unabhängig entstandenen Fassung. Bei `unrelated` und `invalid` übernimmt der Client das Server-Dokument und legt seine eigene Fassung als „<Titel> (Kopie)“ mit neuer ID in „Meine Songs“ ab.

**Lokaler Song, der auch auf dem Server liegt:** Liefert der Server unter `new` einen Song, dessen ID der Client bereits als lokalen Song führt (etwa nach einem Import), verfährt der Client ebenso: Server-Fassung ins Workbook, eigene Fassung als Kopie.

Alternative Automerge-Sync-Protokoll: Es braucht einen Sync-Zustand je Gegenstelle und mehrere Nachrichten hin und her. Das lohnt sich erst bei einer dauerhaften Verbindung.

### D5: Prüfung auf dem Server

Nach `loadIncremental` in eine Kopie des Server-Dokuments gelten drei Bedingungen:
- Es fehlen keine Abhängigkeiten (`getMissingDeps` leer).
- `songOf` gelingt, und die ID im Dokument entspricht der Song-ID.
- `parseNotebookFile(serializeNotebook([song]))` ist erfolgreich.

Erst dann wird gespeichert. `POST /songs` prüft das vollständige Dokument auf dieselbe Weise.

### D6: Benachrichtigung über Server-Sent Events

`GET /api/events` hält die Antwort offen. Der Server führt im Speicher `Map<email, Set<ServerResponse>>` und sendet:
- `event: workbook` mit `data: {id}`, nachdem ein Song des Workbooks angelegt, geändert oder gelöscht wurde, an alle Mitglieder;
- `event: workbooks` nach Änderungen an Titel, Mitgliedern, Anlegen oder Löschen, an alle betroffenen Adressen, auch an entfernte.

Alle 25 s geht ein Kommentar `: ping` hinaus, damit Proxys die Verbindung halten. Inhalte gehen nie über diesen Kanal. Der Client reagiert mit einem Sync oder mit `GET /api/workbooks`. Bricht die Verbindung ab, verbindet sich `EventSource` selbst neu, und der Client gleicht danach einmal alles ab. Der Vite-Proxy leitet den Stream durch.

Alternative Polling alle 2 bis 3 s: Es verursacht dauernd Last und reagiert trotzdem träger.

### D7: Client-Speicher

IndexedDB Version 4:
- Datensätze in `documents` bekommen die optionalen Felder `workbookId` und `serverHeads`.
- Ein neuer Store `workbooks` hält die zuletzt bekannte Liste, damit die Karten auch offline erscheinen.
- Vorhandene Daten bleiben unverändert, alle Songs gelten als lokal.

Repository-Erweiterungen:
- `loadAll` liefert zusätzlich Zugehörigkeit und Workbooks.
- Neue Funktionen:
  - `outgoing(id)`: liefert `base` und `changes`.
  - `receive(id, song, response)`: synchron, siehe D8.
  - `adopt(id, bytes, workbookId)`: Server-Dokument übernehmen.
  - `place(id, workbookId, heads)`: Zugehörigkeit setzen.
  - `forgetWorkbookSongs()`: Workbook-Songs entfernen, beim Abmelden.

Die Zugehörigkeit gehört weder zum `Song` noch ins Dokument oder ins Dateiformat. Sie ist Sache des Servers, der Client hält nur eine Kopie.

### D8: Keine verlorenen Änderungen zwischen Store und Sync

**Problem:** Der Store kann sich ändern, während eine Sync-Anfrage unterwegs ist. Würde die Antwort den Store-Song einfach überschreiben, ginge diese Änderung verloren. Und schriebe `connectStore` später den alten Store-Song per `applySong` ins zusammengeführte Dokument, würden die Server-Änderungen rückgängig gemacht.

**Lösung:** Die Antwort wird je Song in einem synchronen Schritt angewendet:
1. den aktuellen Store-Song mit `applySong` ins Dokument;
2. `loadIncremental(changes)`;
3. `songOf` in den Store (`store.applyRemote`, ohne Revisionserhöhung, ohne Ansichtswechsel, außer wenn der geöffnete Song gelöscht wurde);
4. `serverHeads` setzen.

Danach findet `connectStore` keinen Unterschied mehr, `applySong` erzeugt also keine Änderung. Die Speicherung in IndexedDB folgt asynchron. Vor jeder Anfrage schreibt der Sync ausstehende Änderungen mit `flush` ins Dokument.

### D8a: Store und Account-Status

Store-Erweiterungen:
- `NotebookState` bekommt `workbooks` und `placement` (Song-ID → Workbook-ID).
- Neue Funktionen:
  - `applyRemote(songs, removedIds)`
  - `setWorkbooks(list)`
  - `place(songId, workbookId | null)`
  - `createSong(title, workbookId?)`
- Undo bleibt unverändert. Eine fremde Änderung am geöffneten Pattern landet nicht im Verlauf, wird aber durch Undo überschrieben, wenn der Nutzer zurückgeht.

Account-Status:
- Er wandert aus `AccountMenu` in einen kleinen Account-Zustand (`src/account/session.ts`, abonnierbar), weil Karten, Sync und Menü ihn teilen.
- `AccountMenu` liest und setzt ihn, die Anmelde-API bleibt unverändert.

### D9: Sync-Steuerung

`src/sync/` steuert alles für einen angemeldeten Nutzer:
- **Auslöser:**
  - Start nach erfolgreicher Sitzung
  - Ereignis vom Server
  - Tab wird sichtbar
  - `online`
  - alle 60 s, solange der Tab sichtbar ist
  - Store-Änderung an einem Workbook-Song, 500 ms nach der letzten Änderung
- **Ablauf:** Je Workbook läuft höchstens eine Anfrage. Auslöser während einer laufenden Anfrage führen zu genau einer weiteren.
- **Fehler:**
  - 404 für ein Workbook oder sein Fehlen in `GET /api/workbooks`: Mitgliedschaft beendet (D10).
  - 401: Sync ruht, der Account-Status wechselt auf abgemeldet, die Songs bleiben.
  - Netzwerkfehler: Der nächste Auslöser versucht es erneut.

### D10: Abkoppeln nach dem Austritt

Für jeden Song des verlorenen Workbooks gilt:
- Er bekommt eine neue ID und ein neues Dokument (`createSongDoc`) aus dem aktuellen lokalen Stand, einschließlich nicht übertragener Änderungen.
- Zugehörigkeit und alte ID werden entfernt.

Die App meldet einmal je Workbook „Du bist nicht mehr Mitglied von ‚<Titel>‘. Die Songs liegen jetzt unter Meine Songs.“ Dieselbe Routine erzeugt die Kopien bei `unrelated` und `invalid` (D4), dort mit dem Zusatz „(Kopie)“ im Titel.

### D11: Einladungsmail und Begrenzung

Absendername ist „beatsheet“, der Betreff lautet „<Besitzer> hat dich zu „<Titel>“ eingeladen“. Der Text nennt den Weg zur Anmeldung. Die Adresse der App kommt aus dem neuen Argument `--app-url`; ohne das Argument fehlt der Link.

Begrenzung: 20 Einladungen je Besitzer und Stunde (`invitations`). Einladungen zählen außerdem zur Gesamtgrenze von 50 Mails pro Stunde aus `account-auth`. Diese wird dazu über Anmeldecodes und Einladungen gemeinsam gezählt.

### D12: Oberfläche

- **`SongList`:** Sie wird zur Startseite mit Karten.
- **`WorkbookCard`:** Titel (für den Besitzer an Ort und Stelle umbenennbar, wie `EditableHeading`), Mitgliederzeile, Knopf „Mitglieder“, Song-Tabelle, „Song anlegen“, für den Besitzer bei leerem Workbook „Workbook löschen“.
- **Popover „Mitglieder“:** Liste der Mitglieder.
  - Für den Besitzer zusätzlich ein Feld zum Einladen und „Entfernen“ je Mitglied.
  - Für andere Mitglieder „Workbook verlassen“.
- **„Meine Songs“:** Das Eingabefeld zum Anlegen bleibt oben. Angemeldet und mit mindestens einem Workbook bekommt jede Zeile die Aktion „Zu Workbook …“ (Menü mit den Workbooks). Aktionen in der Zeile öffnen den Song nicht.
- **„Neues Workbook“:** nur angemeldet.
- **Songbook:** Die Nachfrage beim Löschen nennt bei Workbook-Songs, dass der Song für alle Mitglieder von „<Titel>“ gelöscht wird.
- **Import-Dialog:** Er bekommt die Zugehörigkeit und zeigt bei „Ersetzen“ eines Workbook-Songs den Hinweis.
- **Styles:** nur mit semantischen Tokens. Karten als `--surface` mit Rahmen, Titel prominent.

### D13: Abmelden

Abmelden läuft in dieser Reihenfolge:
1. `flush` und ein Sync aller Workbooks.
2. Schlägt der Sync fehl oder bleiben Änderungen offen, fragt die App nach. Bei „Abbrechen“ bleibt der Nutzer angemeldet.
3. `POST /api/auth/logout`.
4. `forgetWorkbookSongs()` und Store-Bereinigung. Ist der geöffnete Song betroffen, wechselt die App zur Startseite.

Läuft die Sitzung ab (401), bleiben die Workbook-Songs erhalten, bis der Nutzer sich wieder anmeldet. Ist er danach nicht Mitglied (anderes Konto), greift D10.

## Risks / Trade-offs

- [Löschen gewinnt gegen gleichzeitiges Bearbeiten: Offline gemachte Änderungen an einem gelöschten Song gehen verloren] → So in der Spec festgelegt. Die Nachfrage beim Löschen nennt die Tragweite.
- [Benachrichtigung nur in einem Prozess] → Es läuft nur ein Prozess. Zusätzlich gleicht der Client alle 60 s und bei Sichtbarkeit ab.
- [Fremde Änderung am geöffneten Pattern und Undo] → Undo stellt den eigenen Vorzustand her und kann die fremde Änderung überschreiben. Bekannt und akzeptiert.
- [Ein Mitglied mit manipuliertem Client kann Inhalte zerstören (Schreibrechte für alle)] → Der Server prüft Form und Größe (D5). Inhaltliche Zerstörung bleibt möglich, Schutz davor gibt es erst mit Leserechten oder Verlauf.
- [Gemeinsam genutzter Code: Änderungen in `src/persistence` können den Server brechen] → `tsc -p server` prüft beides, und die Server-Tests nutzen die echten Module.
- [Reines HTTP beim Test] → wie in `server-auth`: Betrieb erst mit HTTPS-Namen.
- [Dokumente wachsen mit ihrer Historie] → Für Songs unkritisch, die Grenze von 2 MB je Anfrage greift sonst.

## Migration Plan

IndexedDB Version 4 legt nur den Store `workbooks` an, vorhandene Datensätze bleiben gültig. Die Server-Tabellen entstehen mit `CREATE TABLE IF NOT EXISTS`. Es gibt keinen Rückweg: Ältere App-Versionen öffnen die Datenbank in Version 4 nicht. Das gilt für jede Erhöhung der Version.
