# Design

## Context

Siehe proposal.md. Ausgangslage aus `workbook-sync`:

- **Abgleich:** Workbook-Songs laufen über `POST /api/workbooks/:id/sync` mit Heads, Ereigniskanal und Zugehörigkeit im Repository (`workbookId`, `serverHeads`). Die Zugehörigkeit im Store ist `placement`.
- **Lokale Songs:** Sie haben keinen Eintrag in `placement` und stehen in „Meine Songs“. Der Sync kennt sie nicht.
- **Song-IDs auf dem Server:** Sie sind global eindeutig, Grabsteine belegen ihre ID weiter. `POST /songs` antwortet sonst `exists`.
- **Abkoppeln (D10) und Kopien (D4):** Beide erzeugen Songs ohne Zugehörigkeit.

## Goals / Non-Goals

**Goals:**
- Kein zweiter Abgleichsweg: Eigene Songs nutzen Zusammenführen, Offline-Arbeit und Ereignisse von `workbook-sync`.
- Kein Datenverlust beim Anmelden: Abweichende Fassungen bleiben als Kopie erhalten.

**Non-Goals:**
- Songs aus einem Workbook zurückholen.
- Speichergrenzen je Account.
- Auflösen von Dubletten mit unterschiedlichen IDs.

## Decisions

### D1: Persönliches Workbook

Jeder Account hat genau ein verstecktes Workbook. Eigene Songs sind Songs in diesem Workbook.

```
personal_workbooks (owner TEXT PK, workbook_id TEXT)
```

- **Anlegen:** Beim ersten `GET /api/workbooks` der Adresse, mit dem Besitzer als einzigem Mitglied.
- **Liste:** `GET /api/workbooks` liefert es mit `personal: true`. Der Titel ist technisch und wird nicht angezeigt.
- **Schutz:** `PATCH`, `DELETE` und alle Mitgliederendpunkte antworten für dieses Workbook 403 `personal`.
- **Tabelle statt Spalte:** `CREATE TABLE IF NOT EXISTS` genügt, ein vorhandenes Schema braucht keine Migration.

Alternative Getrennte Tabelle für eigene Songs mit eigenen Endpunkten: Das verdoppelt Abgleich, Prüfung und Ereignisse.

### D2: „Meine Songs“ im Client

„Meine Songs“ zeigt Songs ohne `placement` und Songs im persönlichen Workbook. Workbook-Karten und „Zu Workbook …“ filtern `personal` heraus. `Workbook` bekommt das optionale Feld `personal`.

Löschnachfrage und Import-Hinweis nennen „alle Mitglieder“ nur für nicht persönliche Workbooks.

### D3: Hochladen lokaler Songs

Solange eine Sitzung besteht, wandern Songs ohne `placement` ins persönliche Workbook. Das gilt für alle Quellen: Bestand beim Anmelden, neu angelegte Songs, Importe, Kopien aus D4 und D10.

Ablauf in `syncAll`:
1. Abgleich aller Workbooks. Der des persönlichen Workbooks überträgt zuerst vorgemerktes Löschen (D6).
2. Danach, in der Warteschlange des persönlichen Workbooks, jeder Song ohne `placement`: `POST /songs` mit dem vollständigen Dokument, dann `place`.

Das Hochladen folgt zuletzt, weil eine ID bereits in einem Workbook liegen kann. `new` löst das als Fassungsvergleich (D4), `exists` nur als Kopie. Ein einzelner Abgleich außerhalb von `syncAll` lädt danach ebenfalls hoch.

Fehler beim Hochladen:
- `exists`: Kopie mit neuer ID und „(Kopie)“ im Titel, ohne die ID erneut zu versuchen. Die Kopie geht im selben Durchlauf hinaus. Die ursprüngliche lokale Fassung entfällt.
- `invalid-song`, `too-large`: Der Song bleibt lokal. Die App meldet das einmal je Song und versucht es erst nach einer weiteren Änderung erneut.
- `unreachable`: Der nächste Auslöser versucht es erneut.

Auslöser wie in D9 von `workbook-sync`. Die Store-Beobachtung zählt Änderungen an Songs ohne `placement` zum persönlichen Workbook.

### D4: Fassungen beim Anmelden

Der bestehende Fall „Lokaler Song, der auch auf dem Server liegt“ (`new` für eine bekannte ID) legt eine Kopie an. Er bekommt eine Ausnahme: Stimmt der lokale Song inhaltlich mit dem des Servers überein, entfällt die Kopie. Das gilt für alle Workbooks. `sameSong` vergleicht die normalisierte Dokumentform, weil die Feldreihenfolge eines importierten Songs von der eines Dokuments abweicht.

Dieselbe Exportdatei auf zwei Geräten erzeugt so keine Dubletten. Ein anderes Dokument mit gleichem Inhalt ist für den Nutzer dieselbe Fassung, deshalb gilt die des Servers.

### D5: Hinweis nach der Übernahme

Nach der Anmeldung zählt die App die in diesem Durchlauf erstmals hochgeladenen Songs und meldet einmal „<n> Songs wurden in deinen Account übernommen.“ Ohne Songs entfällt der Hinweis, ebenso für Songs, die erst später entstehen.

### D6: Löschen ohne Verbindung

Eigene Songs lassen sich offline löschen. Das Repository führt `markDeleted(id)`:
- Der Datensatz bleibt mit `pendingDelete: true`, ohne Inhalt. `loadAll` überspringt ihn. Das Feld ist optional, die IndexedDB-Version bleibt.
- `write` löscht vorgemerkte Datensätze nicht.
- `pendingDeletes()` liefert IDs und Workbooks, `clearDeleted(id)` entfernt den Datensatz.

Der Sync überträgt sie per `DELETE`; `gone` zählt als erledigt. `applyReplies` ignoriert `new` für vorgemerkte IDs, damit eine laufende Anfrage den Song nicht zurückbringt. `hasUnsent` zählt sie mit, `forgetWorkbookSongs` entfernt sie.

Workbook-Songs brauchen weiter den Server: Die Nachfrage richtet sich an alle Mitglieder, und ein Löschen darf nicht unbemerkt später wirken.

Alternative Löschen nur mit Server, wie bei Workbook-Songs: Für den eigenen Bestand wäre das ein Rückschritt, offline zu löschen ging bisher.

### D7: Verschieben zwischen Workbooks

`POST /songs` lehnt die ID eines eigenen Songs ab. Neu:

| Endpunkt | Erfolg | Fehler |
|---|---|---|
| `POST /api/workbooks/:id/songs/:songId/move` `{to}` | 200 `{heads}` | 403 `not-personal`, wenn die Quelle nicht das persönliche Workbook ist; 404 ohne Mitgliedschaft im Ziel, bei gleichem Ziel oder bei unbekanntem Song |

Der Server ändert nur `workbook_id`. Dokument und Heads bleiben, offene Änderungen lassen sich also weiter übertragen. Beide Workbooks melden ein Ereignis `workbook`. Quelle ist nur das persönliche Workbook: Sonst könnte ein Mitglied Songs aus einem geteilten Workbook abziehen. Der Client behält seine `serverHeads`, denn die Heads der Antwort können ihm unbekannte Änderungen einschließen.

Abgleich mit einem veralteten Workbook:
```
Client nennt einen Song aus einem anderen Workbook, dessen Mitglied er ist
  -> { id, status: 'moved', to }
```
Der Client setzt `place` auf `to`, behält Dokument und `serverHeads` und gleicht `to` gleich ab, was offene Änderungen überträgt. Kennt er `to` noch nicht, lädt er zuerst die Workbook-Liste. Ist er dort nicht Mitglied, bleibt es bei `deleted`.

Der Abgleich von `to` kann vor dem des alten Workbooks laufen und liefert dann `new` für einen Song, den der Client in einem anderen Workbook führt. Der Client überspringt diese Antwort und gleicht das alte Workbook ab, das `moved` liefert. Andernfalls würden offene Änderungen zur Kopie.

`moveSong` nutzt `move` für Songs im persönlichen Workbook und `POST /songs` für noch nicht hochgeladene. Es läuft in den Warteschlangen beider Workbooks, damit Hochladen und Verschieben sich nicht überholen.

### D8: Abmelden

Der Ablauf aus D13 von `workbook-sync` bleibt. Änderungen:
- `prepareLogout` lädt in `syncAll` auch Songs ohne `placement` hoch.
- `hasUnsent` betrachtet nur Songs mit Server-Stand und vorgemerktes Löschen. Nie übertragene Songs gehen nicht verloren, weil sie lokal bleiben.
- `forgetWorkbookSongs` entfernt auch das persönliche Workbook und seine Songs.

### D9: Anderes Konto nach abgelaufener Sitzung

Läuft die Sitzung ab, bleiben eigene Songs auf dem Gerät. Meldet sich danach ein anderes Konto an, fehlt das alte persönliche Workbook in der Liste. D10 von `workbook-sync` greift mit neuen IDs, aber ohne Zusatz im Titel und ohne Hinweis zur Mitgliedschaft. Die Songs wandern in den Account, der sich anmeldet. Sie gelten als lokale Songs des Geräts, und der Hinweis aus D5 zählt sie.

## Risks / Trade-offs

- [Geteiltes Gerät: Lokale Songs eines Abgemeldeten wandern in den Account, der sich als Nächstes anmeldet] → So gefordert. Der Hinweis nennt die Anzahl, und übertragene Songs eines früheren Accounts liegen dann nicht mehr auf dem Gerät.
- [Ein abgelaufener Account auf einem geteilten Gerät gibt seine Songs an den nächsten Account (D9)] → Sitzungen gelten 90 Tage. Wer sich abmeldet, ist nicht betroffen.
- [Löschen gewinnt gegen gleichzeitiges Bearbeiten, nun auch zwischen eigenen Geräten] → Wie bei Workbook-Songs.
- [Importe landen sofort im Account, auch versehentliche] → Der Nutzer kann sie löschen.
- [Speicherbedarf ohne Grenze je Account] → Wie bisher bei Workbooks. Grenzen sind nicht Teil dieses Changes.
- [Viele lokale Songs beim ersten Anmelden erzeugen viele Anfragen] → Sie laufen nacheinander, je Song höchstens 2 MB.

## Migration Plan

Die Tabelle entsteht mit `CREATE TABLE IF NOT EXISTS`. Vorhandene lokale Songs bleiben unberührt, bis sich der Nutzer anmeldet. Bestehende angemeldete Sitzungen laden sie beim ersten Start hoch. Die IndexedDB-Version ändert sich nicht.
