## Why

Songs stehen in „Meine Songs“ und in Workbooks immer alphabetisch. Eine Band braucht ihre eigene Reihenfolge, etwa die Setlist; die alphabetische Ordnung lässt sich nicht ändern.

## What Changes

- Angemeldet lassen sich die Kacheln in „Meine Songs“ und im gewählten Workbook durch Ziehen innerhalb des Bereichs sortieren; eine Einfügemarke zeigt den Platz, „+ Song“ bleibt zuletzt.
- Die Reihenfolge eines Workbooks gilt für alle Mitglieder, liegt im Workbook-Dokument und wird wie die gesehenen Stände abgeglichen und zusammengeführt. Jedes Mitglied darf sortieren.
- Der eigene Bestand bekommt ebenfalls ein Workbook-Dokument, für die Reihenfolge von „Meine Songs“; gesehene Stände bleiben auf gemeinsame Workbooks beschränkt.
- Songs ohne Position (neu angelegt, verschoben, kopiert über Symbol oder Menü, bestehende Workbooks) stehen am Ende, untereinander alphabetisch.
- Ziehen aus „Meine Songs“ in den Bereich des gewählten Workbooks und Ziehen einer Workbook-Kachel nach „Meine Songs“ legen den Song an der Einfügemarke ab; Ziehen auf einen Eintrag der Seitenleiste legt ihn ans Ende.
- Abgemeldet bleibt „Meine Songs“ alphabetisch. Eine Alternative zum Ziehen (Tastatur, Touch) gehört nicht zu diesem Change.

## Capabilities

### New Capabilities
- `song-order`: Reihenfolge der Songs in „Meine Songs“ und in Workbooks: Anzeige, Sortieren durch Ziehen, Position beim Ablegen, gemeinsame Reihenfolge und ihr Zusammenführen.

### Modified Capabilities
- `song-library`: „Song-Liste“ ordnet die Kacheln nach `song-order` statt nur alphabetisch.
- `workbook-sync`: Das Workbook-Dokument trägt die Reihenfolge und gibt es auch für den eigenen Bestand; der Server lässt Änderungen der Reihenfolge durch jedes Mitglied zu; Ziehen innerhalb des eigenen Bereichs sortiert, Ablegen im Bereich setzt die Position, die Einfügemarke ergänzt die Hervorhebung.

## Impact

- `src/persistence/workbookDoc.ts`: Feld `order` (Positionen je Song), Lesen, Setzen, Prüfen; `changesOnlyOwn` erlaubt `order`.
- `server/songs.ts`, `server/workbooks.ts`: Workbook-Dokument auch für den eigenen Bestand; bestehende Dokumente erhalten `order` beim Server.
- `src/persistence/repository.ts`, `src/sync/sync.ts`: Dokument des eigenen Bestands abgleichen, Positionen setzen; gesehene Stände nur bei gemeinsamen Workbooks.
- `src/ui/SongTile.tsx`, `src/ui/dragSong.tsx`, `src/ui/songTransfer.tsx`, `src/ui/SongList.tsx`, `src/ui/WorkbookCard.tsx`, `src/ui/styles.css`: Reihenfolge, Einfügemarke, Sortieren und Position beim Ablegen.
- Neue Abhängigkeit `fractional-indexing` für Positionen zwischen zwei Nachbarn.
