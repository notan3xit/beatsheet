# Proposal

## Why

Ein Song lässt sich bisher nicht kopieren. Wer einen Song aus einem Workbook für sich weiterentwickeln oder eine Variante eines eigenen Songs anlegen will, hat keinen Weg dazu. Zugleich verschiebt ein Ziehen oder ein Klick im Menü „Zu Workbook …“ einen Song ohne Rückfrage dauerhaft ins Workbook und teilt ihn samt Verlauf mit allen Mitgliedern.

## What Changes

- Jede Song-Kachel, in „Meine Songs“ wie im Workbook, trägt ein Symbol „Kopieren“. Nach einer Rückfrage entsteht in „Meine Songs“ eine Kopie „<Titel> (Kopie)“ mit neuer ID und ohne Verlauf. Das Original bleibt unverändert.
- Workbook-Kacheln lassen sich auf „Meine Songs“ ziehen. Loslassen dort legt nach derselben Rückfrage eine Kopie an. Andere Workbooks und das eigene Workbook sind dabei kein Ziel.
- Verschieben eines Songs in ein Workbook, über „Zu Workbook …“ oder durch Ziehen, geschieht erst nach einer Rückfrage, die die Folgen nennt.
- Die Ziele beim Ziehen werden so angelegt, dass ein späterer Change das Sortieren durch Ziehen innerhalb eines Workbooks ergänzen kann. Das Sortieren selbst ist nicht Teil dieses Changes.

## Capabilities

### New Capabilities

### Modified Capabilities
- `song-library`: Song kopieren über das Symbol auf der Kachel, mit Rückfrage.
- `workbook-sync`: Rückfrage beim Verschieben in ein Workbook; Workbook-Kacheln lassen sich als Kopie nach „Meine Songs“ ziehen; „Meine Songs“ als hervorgehobenes Ziel.
- `workbooks`: Der eigene Bestand ist beim Ziehen aus „Meine Songs“ kein Ziel, beim Ziehen aus einem Workbook als „Meine Songs“ schon.

## Impact

- `src/state/notebookStore.ts`: Kopie eines Songs anlegen.
- `src/ui/SongList.tsx`, `src/ui/SongTile.tsx`, `src/ui/WorkbookCard.tsx`, `src/ui/icons.tsx`: Symbol „Kopieren“, Rückfragen zu Kopieren und Verschieben.
- `src/ui/dragSong.tsx`, `src/ui/WorkbookArea.tsx`: Ziele mit Art statt reiner Workbook-ID, Workbook-Kacheln ziehbar, „Meine Songs“ als Ziel.
- `src/ui/styles.css`: Hervorhebung von „Meine Songs“ als Ziel.
- Server, API, Dateiformat und Dokumentform bleiben unverändert; die Kopie gelangt über den vorhandenen Abgleich in den Account.
