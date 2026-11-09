# Proposal

## Why

Eine noch geöffnete ältere App-Version beschädigt Songs, die sie abgleicht: Beim Zurückschreiben eines empfangenen Songs ins Automerge-Dokument löscht sie jedes Feld, das sie nicht kennt. So hat ein Tab mit 0.4.0 den Standard-Takt (neu in 0.5.0) aus einem Workbook-Song entfernt, als neue Änderung ohne Autor. Das widerspricht der Regel, dass ältere Versionen neue optionale Felder gefahrlos übergehen.

## What Changes

- Das Übertragen eines Songs ins Dokument entfernt nur Felder, die die eigene Version kennt. Felder neuerer Versionen bleiben unverändert stehen.
- Die App schickt bei jedem Abgleich ihre Version mit. Der Server weist Abgleich und das Anlegen von Workbook-Songs ab, wenn die Version fehlt oder älter ist als seine eigene. Das hält auch heute schon geöffnete alte Tabs davon ab, Songs zu schreiben.
- Erfährt die App so, dass sie veraltet ist, pausiert sie den Abgleich bis zum Neuladen: Sie überträgt nichts und übernimmt nichts. Oben steht dauerhaft ein Hinweis darauf mit dem Knopf „Neu laden“. Lokal weiterarbeiten bleibt möglich; die Änderungen gehen nach dem Neuladen hinaus.

## Capabilities

### New Capabilities

### Modified Capabilities
- `library-persistence`: Felder neuerer Versionen bleiben im Song-Dokument erhalten.
- `workbook-sync`: Abgleich nur mit aktueller App-Version, Pause mit Hinweis bei veralteter Version.

## Impact

- `src/persistence/songDoc.ts`: bekannte Felder je Ebene der Dokumentform, `syncMap` löscht nur diese.
- `src/sync/api.ts`, `src/sync/sync.ts`: Version im Request, Fehler `outdated`, Pause des Abgleichs, Hinweis mit „Neu laden“.
- `server/workbooks.ts`: Versionsprüfung für Abgleich und Anlegen von Songs; Version des Servers aus `package.json`.
- Clients bis 0.8.0 schicken keine Version; ihr Abgleich scheitert, sie zeigen den Offline-Hinweis bis zum Neuladen.
- Dateiformat und Dokumentform bleiben unverändert.
