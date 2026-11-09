# Design

## Context

Ein Song in „Meine Songs“ ohne Zuordnung (`placement`) lädt der Abgleich angemeldet in den eigenen Bestand hoch (`uploadLocal`). Ohne Anmeldung bleibt er lokal. Das Repository legt für einen unbekannten Song ein neues Automerge-Dokument an (`createSongDoc`), mit dem angemeldeten Nutzer als Autor.

`SongDragProvider` (`src/ui/dragSong.tsx`) kennt nur eine Richtung: Kacheln aus „Meine Songs“ auf Elemente mit `data-drop-workbook`. Das Ziel ist eine Workbook-ID, und Loslassen ruft direkt `sync.moveSong` auf. Der Provider existiert nur angemeldet. Workbook-Kacheln sind nicht ziehbar (`draggable` nur in „Meine Songs“).

`ConfirmDialog` bietet bereits Rückfragen mit Titel, eigenem Inhalt und `confirmLabel`. Escape schließt sie.

## Goals / Non-Goals

**Goals:**
- Kopieren, Verschieben per Menü und Verschieben bzw. Kopieren per Ziehen nutzen dieselben Rückfragen.
- Ein späterer Change kann das Sortieren durch Ziehen innerhalb eines Workbooks als weitere Zielart ergänzen, ohne den Ablauf des Ziehens umzubauen.

**Non-Goals:**
- Sortieren und eine gespeicherte Reihenfolge der Kacheln. Die Kacheln bleiben alphabetisch.
- Ziehen auf Touch-Geräten (wie bisher ausgeschlossen); Kopieren geht dort über das Symbol.
- Kopieren über den Server oder mit Übernahme des Verlaufs.

## Decisions

### D1: Kopie im Store, Übertragung über den vorhandenen Abgleich
`NotebookStore.copySong(id)` legt einen neuen Song ohne Zuordnung an: neue ID, Titel `<Titel> (Kopie)`, Tempo, Standard-Takt, Patterns und Segmente des Originals, `createdAt`/`updatedAt` jetzt, Revision 1. Der Song wird nicht geöffnet. Das Repository erzeugt ein neues Dokument, und angemeldet lädt `uploadLocal` die Kopie in den eigenen Bestand. Offline, abgemeldet und bei vollem Speicher gilt damit das Verhalten jedes neuen eigenen Songs.

IDs von Patterns, Segmenten, Blöcken und Takten bleiben erhalten; sie gelten nur innerhalb eines Songs.
- Alternative: Server-Endpunkt „kopieren“. Der Client hat den aktuellen Stand samt nicht übertragener Änderungen bereits, und offline ginge nichts.
- Alternative: Dokument mit `Automerge.clone` übernehmen. Dann käme der Verlauf mit, was die Spec ausschließt.

### D2: Rückfragen als gemeinsame Aktionen
Ein Hook `useSongTransfer()` in `src/ui/songTransfer.tsx` bietet `copy(song)` und `move(song, workbook)`. Beide stellen die Rückfrage über `useConfirm` (Titel, Liste der Folgen, `confirmLabel` „Kopieren“ bzw. „Verschieben“) und führen nur nach Bestätigung aus: `store.copySong` bzw. `sync.moveSong` über `useReportedAction`. Welche Kopier-Rückfrage erscheint, hängt davon ab, ob der Song einem gemeinsamen Workbook zugeordnet ist. Symbol, Menü „Zu Workbook …“ und das Loslassen beim Ziehen rufen nur diese Aktionen auf.

`move` braucht `sync` und gibt es daher nur angemeldet. `copy` geht immer.

### D3: Symbol „Kopieren“
`CopyIcon` in `icons.tsx`; ein Knopf `tile-copy` mit `aria-label`/`title` „Kopieren“ im `tile-action` jeder Kachel. In „Meine Songs“ steht er vor „Zu Workbook …“, in der Workbook-Karte allein. `SongTiles` bekommt dafür in beiden Bereichen eine `action`. Ein Knopf, der nicht `tile-open` ist, startet kein Ziehen, das gilt auch für den neuen.

### D4: Ziele mit Art, Wirkung aus Quelle und Ziel
Das Ziehen merkt sich die Quelle der Kachel (`'mine'` oder Workbook-ID) und ein Ziel als Unterscheidung nach Art:

```ts
type DropTarget = { kind: 'workbook'; id: string } | { kind: 'mine' };
```

Die Trefferprüfung liest `data-drop-workbook` bzw. `data-drop-mine` (am Bereich „Meine Songs“). Eine reine Funktion `dropEffect(source, target)` ergibt `'move' | 'copy' | null`:

| Quelle | Ziel | Wirkung |
|---|---|---|
| Meine Songs | Workbook | `move` |
| Workbook | Meine Songs | `copy` |
| alle übrigen | | `null` |

Nur ein Ziel mit Wirkung gilt als Ziel: Es wird hervorgehoben, und beim Loslassen ruft es `move` oder `copy` aus D2 auf. Ein Ziel ohne Wirkung verhält sich wie Loslassen außerhalb. `useDropTarget` liefert das wirksame Ziel; Seitenleiste, Workbook-Karte und „Meine Songs“ vergleichen damit.

Für das Sortieren ergänzt ein späterer Change eine Zielart (Position zwischen Kacheln eines Workbooks) und eine Zeile in `dropEffect`.
- Alternative: zwei getrennte Provider für beide Richtungen. Doppelter Ablauf (Schwelle, Klick abfangen, Escape) und keine gemeinsame Stelle für eine dritte Wirkung.

### D5: Workbook-Kacheln ziehbar
`WorkbookCard` reicht `draggable` an `SongTiles`. Die Kachel ruft `begin` mit ihrer Quelle auf; `SongTile` bekommt die Quelle über `useSongDragSource(song, source)`.

### D6: Hervorhebung von „Meine Songs“
Die Section „Meine Songs“ trägt als Ziel die Klasse `drop-target` mit denselben Tokens wie `.workbook-main.drop-target` (Rand `--accent`, Fläche `--drop-fill`). Damit gelten die vorhandenen Kontrastpaare; neue Paare aus Schrift und Fläche entstehen nicht.

## Risks / Trade-offs

- [Gleiche Geste, zwei Wirkungen: Ziehen in ein Workbook verschiebt, Ziehen heraus kopiert] → Die Rückfrage nennt die Wirkung jedes Mal, bevor etwas geschieht.
- [Ziehen aus einem Workbook endet über einem Ziel, das man für gültig hält (anderes Workbook), ohne Rückmeldung] → Ungültige Ziele werden nicht hervorgehoben; das Ziehen endet sichtbar ohne Wirkung.
- [Mehrfaches Kopieren erzeugt Titel wie „X (Kopie) (Kopie)“] → Hingenommen, wie beim Kopieren von Patterns.
