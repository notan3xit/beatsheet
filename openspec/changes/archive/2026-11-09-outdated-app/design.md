# Design

## Context

`applySong` gleicht das Dokument per `syncMap` an `toDocShape(song)` an. `syncMap` löscht dabei jeden Schlüssel des Dokuments, der im Ziel fehlt. Ein Song entsteht aus dem Dokument über `fromDocShape`, das nur bekannte Felder liest. Jeder empfangene Song läuft über `store.applyRemote` → `connectStore` → `repository.write` zurück ins Dokument. Ein Feld einer neueren Version geht deshalb schon beim bloßen Empfangen verloren.

Die Dokumentform enthält feste Felder (`title`, `meter` …) und Wörterbücher mit Daten als Schlüsseln: Positionen in `hits[<instrument>]`, Akzente in `accents`, Spielweisen in `articulations`, Betonungen als `emphasis:<instrument>:<position>` direkt im Beat.

Die App kennt ihre Version aus `CHANGELOG[0].version`; ein Test gleicht sie mit `package.json` ab. Der Server läuft aus einem Paket, das `package.json` enthält. Der Client übersetzt Fehler mit Status < 500 und unbekanntem Code in `unreachable`, also in den Offline-Hinweis; das gilt auch für alte Clients.

## Goals / Non-Goals

**Goals:**
- Neue optionale Felder überstehen jede ältere Version ab dieser.
- Offene ältere Tabs, auch bis 0.8.0, schreiben keine Songs mehr, sobald eine neuere Version auf dem Server läuft.

**Non-Goals:**
- Schutz neuer Werte in bekannten Feldern (etwa einer neuen Spielweise) über D1 hinaus. Eine ältere Version würde sie beim Lesen wegnormalisieren und den Song zurückschreiben; die Versionsprüfung (D2) verhindert, dass sie solche Songs überhaupt empfängt. Ungeschützt bleibt nur ein auf eine ältere Version zurückgerollter Server, solange noch neuere Tabs schreiben.
- Erzwungenes Neuladen oder Abfragen der Server-Version ohne Abgleich.
- Prüfen anderer Anfragen (Workbooks anlegen, umbenennen, Mitglieder, Profil, Verschieben, Löschen): Sie übertragen keine Song-Inhalte.

## Decisions

### D1: Eigene Schlüssel je Ebene
`syncMap` bekommt zu jedem Objekt eine Beschreibung, welche Schlüssel es besitzt und wie seine Kinder beschrieben sind. Gelöscht werden nur besessene Schlüssel, die im Ziel fehlen; alle anderen bleiben unberührt.
- Feste Objekte (Song, Pattern, Segment, Block, Takt) besitzen ihre Felder aus der Dokumentform, optionale wie `meter` eingeschlossen.
- Beat: `subdivision`, `hits`, `articulations` und alle Schlüssel mit Präfix `emphasis:`.
- `hits`: die Instrumente aus `INSTRUMENTS`; darin besitzt jedes Instrument alle Positionsschlüssel.
- `articulations`: die Container aus `ARTICULATION_CONTAINERS` und flache Schlüssel `<instrument>:<position>` mit bekanntem Instrument; darin besitzen die Container alle Positionsschlüssel.
- `accents`: alle Schlüssel.

Die Beschreibung steht neben `toDocShape` in `songDoc.ts`. Ein Test prüft, dass jeder Schlüssel, den `toDocShape` für einen vollständig belegten Song erzeugt, besessen ist. Ein neues Feld, das dort fehlt, ließe sich sonst nicht mehr entfernen.
- Alternative: nie löschen, nur setzen. Dann ließen sich bekannte optionale Felder und Datenschlüssel nicht mehr entfernen.
- Alternative: Unbekanntes in `Song` mitführen. Das zieht Fremdfelder durch Domain und Store.

Listen bleiben wie bisher: Elemente mit `id` werden über die ID abgeglichen, ein bestehendes Element per `syncMap` und damit ebenfalls schonend.

### D2: Version im Header, Vergleich nach Semver
`createSyncApi` sendet bei jeder Anfrage den Header `Beatsheet-Version: <CHANGELOG[0].version>`. Der Server liest beim Start `version` aus `package.json`. Für `POST /api/workbooks/<id>/sync` und `POST /api/workbooks/<id>/songs` prüft er vor jeder anderen Verarbeitung: fehlt der Header, ist er keine Version der Form `x.y.z` oder numerisch kleiner als die eigene, antwortet er `409 {"error":"outdated"}`. Neuere Versionen nimmt er an, damit ein Zurückrollen des Servers niemanden aussperrt.
- Alternative: Server-Version in jeder Antwort, Prüfung im Client. Alte Tabs prüfen nichts; die Prüfung muss beim Server liegen.
- Alternative: Build-ID statt Version. Genauer, braucht aber eine eigene Build-Ausgabe; jede Veröffentlichung hebt die Version ohnehin.

### D3: Pause im Abgleich
`SyncError` bekommt `outdated`. Meldet eine Anfrage `outdated`, setzt `createSync` den Zustand `outdated` und benachrichtigt die Oberfläche. Ab dann starten `syncWorkbook`, `syncAll` und durch Ereignisse, Sichtbarkeit oder Store ausgelöste Abgleiche keine Anfrage mehr; laufende Antworten werden verworfen (`generation` erhöhen). Der Zustand `offline` wird nicht mehr gesetzt. Lokales Speichern über `connectStore` läuft unverändert. Da die Pause erst nach dem Neuladen endet, gibt es keinen Rückweg.

### D4: Hinweis „Neu laden“
`WorkbookActions` bekommt `isOutdated()`. `App.tsx` zeigt analog zu `OfflineNote` eine `OutdatedNote` mit `role="status"` und einem Knopf „Neu laden“, ohne Schließen. Ist sie sichtbar, entfällt `OfflineNote`. Der Knopf wartet auf `connection.flush()` und das Speichern im Repository (`repo.settled()`) und ruft dann `location.reload()`. Die Ansicht steht in der Adresse und bleibt erhalten. Farben und Flächen wie die übrigen Hinweise (`message note`).

## Risks / Trade-offs

- [Clients bis 0.8.0 zeigen nur den Offline-Hinweis, nicht „Neu laden“] → Der Hinweis sagt, dass Änderungen später übertragen werden. Das stimmt nach dem Neuladen; einmalige Übergangslücke.
- [Veröffentlichung ohne Versionssprung] → Die Prüfung greift dann nicht. Jede Veröffentlichung hebt die Version, die Versionsliste prüft das per Test.
- [Ein Tab lädt kurz vor der Veröffentlichung die neue Oberfläche vom alten Server] → Er ist neuer als der Server und wird angenommen; D1 schützt den alten Server-Stand.
- [Ein vergessenes Feld in der Beschreibung aus D1 lässt sich nicht mehr löschen] → Test über einen vollständig belegten Song.

## Migration Plan

Keine Datenmigration. Mit der Veröffentlichung weist der Server alte Clients ab; deren Songs bleiben lokal und gehen nach dem Neuladen hinaus. Rückweg: ältere Version veröffentlichen; neuere Clients werden von ihr angenommen.
