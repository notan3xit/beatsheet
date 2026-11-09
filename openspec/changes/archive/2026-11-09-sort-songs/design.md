## Context

- `SongTiles` (`src/ui/SongTile.tsx`) sortiert immer nach Titel. Eine gespeicherte Reihenfolge gibt es nicht.
- Jedes gemeinsame Workbook hat ein Automerge-Dokument (`src/persistence/workbookDoc.ts`, Form `{ v: 1, seen: { [email]: { [songId]: ImmutableString } } }`). Nur der Server legt es an, damit alle Fassungen eine Herkunft haben. Der Server lässt nur Änderungen an eigenen `seen`-Einträgen zu (`changesOnlyOwn`). Der eigene Bestand hat bisher kein Dokument (`isShared` in `src/sync/sync.ts`, `!isPersonal` in `server/workbooks.ts`).
- Ziehen (`src/ui/dragSong.tsx`): Die Wirkung ergibt sich aus `dropEffect(source, target)`; Ziele sind `{ kind: 'workbook', id }` und `{ kind: 'mine' }`. Innerhalb des eigenen Bereichs gibt es bisher keine Wirkung.
- Kopieren und Verschieben laufen über `useSongTransfer` (`src/ui/songTransfer.tsx`) mit Rückfrage.

## Goals / Non-Goals

**Goals:**
- Eine Reihenfolge, die sich ohne Server-Logik zusammenführen lässt und bei gleichzeitigen Änderungen auf allen Geräten gleich ist.
- Sortieren ändert keinen Song und erscheint nicht im Song-Verlauf.

**Non-Goals:**
- Sortieren ohne Ziehen (Tastatur, Touch).
- Aufräumen von Positionen gelöschter oder verschobener Songs.
- Reihenfolge der Workbooks in der Seitenleiste.

## Decisions

### D1: Positionen je Song im Workbook-Dokument
Das Dokument erhält `order: { [songId]: ImmutableString }`. Eine Position ist ein Schlüssel nach Fractional Indexing; die Ordnung ergibt sich beim Lesen: nach Position, bei Gleichstand nach Song-ID, danach Songs ohne Position nach Titel.

- `ImmutableString`, nicht Text: Automerge führt Text zeichenweise zusammen; zwei gleichzeitige Positionen ergäben einen unsinnigen Mischwert. Als Einzelwert gewinnt eine Fassung, auf allen Geräten dieselbe.
- Alternative Automerge-Liste der IDs: Verschieben ist dort Löschen plus Einfügen, gleichzeitiges Verschieben desselben Songs erzeugt Duplikate. Verworfen.
- Alternative Feld im Song-Dokument: Sortieren erschiene im Verlauf und änderte die letzte Änderung; eine Kopie nähme die Position mit. Verworfen.
- Schlüssel erzeugt die Bibliothek `fractional-indexing` (`generateKeyBetween`, Zeichen `0-9A-Za-z`), nur im Client.

### D2: `order` legt nur der Server an
Legen zwei Geräte die Map `order` gleichzeitig an, gewinnt eine der beiden Maps und die Einträge der anderen gehen verloren. Deshalb legt `createWorkbookDoc` `order: {}` mit an, und `syncWorkbookDoc` ergänzt `order` in einem bestehenden Dokument ohne das Feld, bevor es Changes des Clients zusammenführt. Der Client setzt Positionen nur, wenn sein Dokument `order` enthält; sonst bleibt das Loslassen ohne Wirkung. `v` bleibt 1, weil ältere Clients das Feld unverändert lassen.

### D3: Dokument auch für den eigenen Bestand
Server: Der Abgleich nimmt den Teil `workbook` auch für den eigenen Bestand an. Client: Das Dokument wird für jedes Workbook abgeglichen; `isShared` bleibt nur für gesehene Stände (Markieren, Punkt, erster Abgleich) maßgeblich.

### D4: Erlaubte Änderungen
`changesOnlyOwn` wird zu `changesAllowed(doc, before, after, email, personal)`: erlaubt sind Änderungen unter `order` und, nur bei gemeinsamen Workbooks, unter `seen.<email>`. `isValidWorkbookDoc` prüft zusätzlich: `order` fehlt oder ist eine Map aus `ImmutableString`-Werten mit 1–200 Zeichen aus `0-9A-Za-z`.

### D5: Reine Funktionen für die Reihenfolge
`src/domain/songOrder.ts`, ohne React und Browser:
- `ordered(songs, positions)`: Anzeige nach D1.
- `placeAt(list, positions, songId, slot)`: `list` ist die angezeigte Reihenfolge des Ziels ohne den gezogenen Song, `slot` der Platz darin (0 bis Länge). Ergebnis sind die zu schreibenden Positionen:
  - Liegt der Platz im sortierten Anfang (Songs mit Position) oder direkt dahinter, erhält nur der Song eine Position zwischen seinen Nachbarn.
  - Liegt er in den Songs ohne Position, erhalten diese bis vor den Platz der Reihe nach Positionen hinter der letzten vorhandenen, dann der Song. Die Werte hängen nur vom Zustand ab; zwei Geräte, die gleichzeitig denselben unsortierten Bereich ordnen, schreiben für dieselben Songs dieselben Werte.
- `slotAt(rects, x, y)`: Platz aus den Rechtecken der Kacheln in Anzeigereihenfolge; erster Platz vor einer Kachel, deren Zeile den Zeiger enthält und deren Mitte rechts vom Zeiger liegt, oder deren Zeile unter dem Zeiger liegt; sonst ans Ende.

Alternative: allen Songs beim ersten Sortieren Positionen geben. Ergäbe mehr Schreibzugriffe und mehr Konflikte, ohne bessere Ergebnisse.

### D6: Ziele mit Platz
`DropTarget` erhält ein optionales `slot`: `{ kind: 'workbook', id, slot? } | { kind: 'mine', slot? }`. Liegt der Zeiger über einem Kachelbereich (`.tiles` im Ziel), berechnet `targetAt` den Platz mit `slotAt`; ein Eintrag der Seitenleiste hat keinen. `dropEffect` erweitert:

| Herkunft → Ziel | Wirkung |
|---|---|
| mine → mine mit Platz | reorder |
| Workbook X → X mit Platz | reorder |
| mine → Workbook | move |
| Workbook → mine | copy |
| sonst | keine |

Kacheln tragen `data-song-id`. Der Platz zählt die angezeigten Kacheln einschließlich der gezogenen; vor `placeAt` wird die gezogene herausgerechnet. Loslassen auf dem eigenen Platz schreibt nichts.

### D7: Einfügemarke ohne Verschieben der Kacheln
Die Kachel am Platz (oder „+ Song“ am Ende) erhält die Klasse `drop-before`; ein `::before` zeichnet in der Lücke links davon einen senkrechten Balken in `--accent`, absolut positioniert, mit `--z-local-*`. Kein Layoutsprung. Die Hervorhebung des Bereichs (`drop-target`) gilt weiter nur für move und copy.

### D8: Position nach der Aktion
- reorder: `sync.reorder(workbookId, placeAt(...))` sofort.
- move: `useSongTransfer().move` liefert den Erfolg; erst danach setzt der Provider die Position im Ziel-Workbook. Scheitert es, wird nichts geschrieben.
- copy: `copy` liefert die Kopie; die Position gilt unter ihrer neuen ID im Dokument des eigenen Bestands. Die Kopie ist bis zum Hochladen noch ohne Zugehörigkeit; `uploadLocal` behält die ID, die Position bleibt gültig.
- Menü und Symbol schreiben keine Position.

`reorder` (`Sync`): `repo.setPositions(workbookId, entries)` ändert das Dokument, speichert es, benachrichtigt und stößt den Abgleich an, wie `markSeen`.

### D9: Lesen in der Oberfläche
`SongActivity` (`src/sync/songActivity.ts`) erhält `order(workbookId)`; `useActivity` rendert schon bei jeder Änderung eines Workbook-Dokuments neu. Ein eigener Hook brächte nur eine zweite Abo-Logik für dieselben Meldungen. `SongTiles` erhält `positions` statt fest nach Titel zu sortieren; abgemeldet bleiben sie leer, also nach Titel. „Meine Songs“ nimmt die Positionen des eigenen Bestands.

## Risks / Trade-offs

- [Gleichzeitiges erstes Sortieren eines unsortierten Bereichs] → Werte nach D5 deterministisch; die Absicht beider bleibt nicht immer erhalten, die Reihenfolge ist aber überall gleich (Spec beschränkt die Zusage auf sortierte Bereiche).
- [Gleiche Position für zwei Songs, wenn zwei Geräte in dieselbe Lücke ziehen] → Gleichstand nach Song-ID, überall gleich.
- [Positionen wachsen bei wiederholtem Einfügen an derselben Stelle] → wenige Zeichen je Einfügen; die Grenze von 200 Zeichen in der Prüfung wird praktisch nicht erreicht; wird sie überschritten, weist der Server zurück und das Gerät übernimmt seine Fassung.
- [Einträge gelöschter Songs bleiben in `order`] → wenige Bytes je Song, beim Lesen ignoriert.
- [Erstes Sortieren offline vor dem ersten Abgleich des neuen Felds] → ohne `order` keine Wirkung (D2); nach dem nächsten Abgleich möglich.

## Migration Plan

Keine Datenbankänderung. Bestehende Dokumente erhalten `order` beim nächsten Abgleich durch den Server; der eigene Bestand erhält sein Dokument beim ersten Abgleich. Ein älterer Server weist Änderungen an `order` zurück, die Geräte übernehmen dann seine Fassung; Songs bleiben unberührt.
