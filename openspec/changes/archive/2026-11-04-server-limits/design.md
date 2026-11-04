# Design

## Context

Siehe proposal.md. Ausgangslage:

- **Vorhanden:** Körper sind auf 2 MB begrenzt, Mails auf 50 pro Stunde, Einladungen auf 20 je Besitzer und Stunde. Die Mailgrenze begrenzt auch neue Accounts, aber nicht ausreichend: Bis zu 1200 Anmeldungen am Tag mit je 20 MB ergäben 24 GB.
- **Gemessen:** Ein Song mit 12 Patterns und 192 Takten belegt 6,6 KB, nach 1000 Änderungen 7 KB. Die Historie wächst dank Komprimierung langsam.
- **Speicherort:** `songs.doc` enthält den Stand; Grabsteine belegen eine Zeile ohne Inhalt.

## Goals / Non-Goals

**Goals:**
- Platte und Datei-Deskriptoren lassen sich über die API nicht ausschöpfen.
- Eine Grenze führt nie zu Datenverlust oder zu Kopien.

**Non-Goals:**
- Schutz vor Rechenlast durch viele Anfragen. Das regelt ein vorgelagerter Proxy oder ein eigener Change.
- Anzeige des Verbrauchs.
- Grenzen, die ein Nutzer selbst ändern kann.

## Decisions

### D1: Grenzen an einer Stelle

`server/limits.ts` definiert die Werte, `AppDeps` kann sie für Tests überschreiben:

| Grenze | Wert | Begründung |
|---|---|---|
| Speicher je Account | 20 MB | rund 2500 große Songs |
| Speicher gesamt | 5 GB | Annahme, bis die Platte des Deployments feststeht |
| eigene Workbooks | 50 | |
| Mitglieder je Workbook | 50 | begrenzt zugleich die Ereignisse je Änderung |
| Ereignis-Verbindungen je Account | 10 | |
| Ereignis-Verbindungen gesamt | 1000 | |

### D2: Belegung

Ein Song belegt `length(doc) + 1024` Byte, auch als Grabstein. Der Zuschlag begrenzt so auch Zeilen: Wer Songs anlegt und löscht, füllt die Grenze ebenfalls. Grabsteine bleiben, bis ihr Workbook gelöscht wird.

Die Belegung entsteht bei jeder Prüfung aus den Tabellen (`SUM` über `songs` je Besitzer, gesamt). Ein eigener Zähler könnte auseinanderlaufen. Die Prüfung läuft synchron mit dem Schreiben, ohne `await` dazwischen, damit parallele Anfragen die Grenze nicht gemeinsam überschreiten.

Abgewiesen wird nur, was mehr belegt als zuvor. Löschen und wiederholte Übertragungen bleiben so immer möglich. Eine echte Änderung lässt das Dokument wegen der Historie meist wachsen und fällt in einem vollen Bestand daher unter die Grenze.

Alternative Belegung beim Schreibenden: Beim Zusammenführen lässt sich Dokumentgröße keinem Mitglied zuordnen. Dafür kann ein Mitglied den Speicher des Besitzers füllen; der Besitzer kann es entfernen.

### D3: Schnittstelle

| Fall | Antwort |
|---|---|
| `POST /songs`, `move` über der Grenze | 409 `quota-exceeded` oder `server-full` |
| Song im Abgleich über der Grenze | `{ id, status: 'quota', reason, changes?, heads }`, die übrigen Songs laufen weiter |
| zu viele Workbooks | 409 `too-many-workbooks` |
| zu viele Mitglieder | 409 `too-many-members`, vor dem Zählen der Einladung |
| `GET /api/events` über der Grenze | 429 `too-many-connections` |

`reason` ist `quota-exceeded` oder `server-full`. `changes` enthält die Änderungen anderer seit `base`, `heads` den Stand des Servers: Wer gerade nicht schreiben darf, sieht weiter, was andere ändern.

`move` prüft den Besitzer des Ziels. Bei gleichem Besitzer ändert sich die Belegung nicht, und die Gesamtgrenze ist nie betroffen.

Der Status 409 statt 507: Der Client liest Fehlercodes nur unter 500, weil 5xx auch vom Proxy kommen kann. `server-full` protokolliert der Server mit `console.error`, höchstens einmal pro Stunde, damit ein voller Server nicht auch das Protokoll füllt.

### D4: Client

- **`quota` im Abgleich:** Der Client behandelt die Antwort wie `ok`: Er spielt fremde Änderungen ein und merkt sich `heads`. Seine eigenen Änderungen bleiben im Dokument, gehen beim nächsten Abgleich wieder hinaus, und `hasUnsent` bleibt wahr. Anders als bei `invalid` entsteht keine Kopie.
- **Hochladen:** `quota-exceeded` und `server-full` lassen den Song lokal wie `invalid-song` (account-songs, D3), aber ohne Sperre je Revision: Der nächste Abgleich versucht es erneut, damit der Song ankommt, sobald Platz frei ist.
- **Meldung:** einmal, bis ein Abgleich dieses Workbooks wieder ohne `quota` gelingt; Hochladen zählt getrennt davon. Text nach Grund: „Der Speicher von ‚<Workbook>‘ ist voll …“, „Dein Speicher ist voll …“, „Der Server ist voll …“. Für den eigenen Bestand nennt sie, dass Löschen Platz schafft.
- **Aktionen:** `moveSong`, `createSongIn`, `createWorkbook` und `invite` zeigen die neuen Codes über `syncMessage`.
- **Ereigniskanal:** `EventSource` beendet sich bei 429 selbst. Der vorhandene Auslöser öffnet ihn beim nächsten Abgleich erneut, bis dahin gilt der 60-Sekunden-Abgleich.

### D5: Reihenfolge der Prüfungen

Beim Einladen: `already-member`, dann `too-many-members`, dann die Begrenzung der Mails. So verbraucht eine aussichtslose Einladung kein Mail-Kontingent.

## Risks / Trade-offs

- [Ein Mitglied füllt den Speicher des Besitzers] → Der Besitzer kann es entfernen; die Songs bleiben dann bei ihm, er kann sie löschen.
- [Gesamtgrenze trifft alle, sobald jemand viel belegt] → Die Grenze je Account begrenzt den Einzelnen, das Protokoll macht es sichtbar. Der Wert steht bis zum Deployment nicht fest.
- [Grabsteine belegen dauerhaft 1 KB] → Bei 20 MB fallen sie erst nach Zehntausenden gelöschten Songs ins Gewicht.
- [`SUM` bei jedem Schreiben] → Der Index auf `songs.workbook_id` genügt für die erwartete Größe.
- [Tote Verbindungen belegen Plätze] → Der Ping alle 25 s schließt sie, sobald das Schreiben scheitert. Bis dahin hilft der 60-Sekunden-Abgleich.

## Migration Plan

Keine Datenänderung. Accounts über einer Grenze behalten ihre Daten, nur wachsen können sie nicht mehr.
