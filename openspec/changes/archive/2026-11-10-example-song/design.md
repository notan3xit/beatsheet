# Design

## Context

Siehe proposal.md. „+ Song“ ruft `store.createSong('')` auf und öffnet den Song (`src/ui/SongList.tsx`); die Kachel kommt aus `SongTiles`/`AddSongTile` (`src/ui/SongTile.tsx`). `store.copySong` zeigt, wie ein vollständiger Song mit neuer ID, neuen Zeitstempeln und Revision 1 entsteht. `parseNotebookFile` (`src/persistence/fileFormat.ts`) prüft Exportdateien mit zod und entfernt unbekannte Felder. Popover liegen auf `--z-popover` und schließen bei Klick außerhalb und Escape (Muster: „Mitglieder“, „Zu Workbook …“).

## Goals / Non-Goals

**Goals:**
- Der Beispiel-Song ist nach dem Anlegen ununterscheidbar von einem selbst angelegten Song.
- Der Inhalt bleibt gültig, wenn das Dateiformat wächst.

**Non-Goals:**
- Automatisches Anlegen beim ersten Aufruf, Merkmal „schon begrüßt“, Aktualisieren alter Beispiel-Songs.
- Übersetzung oder mehrere Beispiele.

## Decisions

**D1 Inhalt als Exportdatei.** Der Song liegt als `src/state/exampleSong.json` im Dateiformat (wie eine Exportdatei mit einem Song), wird per `?raw` als Text importiert und mit `parseNotebookFile` gelesen. Ein Test prüft, dass die Datei fehlerfrei gelesen wird und die erwarteten Patterns und Segmente enthält.
Alternative: Song als TypeScript-Objekt. Verworfen, weil die Datei sich mit der App exportieren, bearbeiten und wieder ablegen lässt und denselben Prüfweg wie ein Import nimmt.

**D2 Anlegen wie eine Kopie.** `store.createExampleSong()` liest den Song und übernimmt ihn wie `copySong`: neue Song-ID, aktuelle Zeitstempel, Revision 1, ohne Platzierung in einem Workbook. Pattern-, Segment-, Block- und Takt-IDs bleiben aus der Datei; sie müssen nur innerhalb eines Songs eindeutig sein, wie bei `copySong`. Angemeldet übernimmt der Abgleich den Song wie jeden neuen eigenen Song in den Account.
Alternative: feste Song-ID, damit identische Fassungen beim Anmelden zusammenfallen. Verworfen (siehe Exploration): Ein gelöschter Beispiel-Song käme als „(Kopie)“ zurück.

**D3 Kachel.** `SongTiles` erhält optional eine zweite Anlege-Kachel vor „+ Song“, die `MySongs` nur bei `songs.length === 0` übergibt. Sie sieht aus wie „+ Song“ und ist kein Ziel für die Einfügemarke von `song-order`.

**D4 Erklärung der Workbooks.** Ein Symbolknopf (`icon-button`) mit Fragezeichen im Kreis (`HelpIcon`, Stil wie `InfoIcon`), damit er als Knopf erkennbar ist, mit `aria-label` „Was sind Workbooks?“ und `aria-expanded` steht neben der Überschrift `h2`. Das Popover nutzt die vorhandenen Popover-Klassen und `--z-popover` und schließt wie die übrigen Popover. Text:
> Ein Workbook ist eine Sammlung von Songs, die du mit anderen teilst, etwa mit deiner Band. Alle Mitglieder sehen und bearbeiten dieselben Songs, Änderungen kommen bei allen gleich an. Mitglieder lädst du per E-Mail ein.

**D5 Inhalt des Beispiel-Songs.** „Beispiel-Song“, Tempo 100, Standard-Takt 4/4.

| Pattern | Art | Farbe | Inhalt |
|---|---|---|---|
| Rock-Beat | Groove, 4 Beats | blue | Hi-Hat Achtel, Bassdrum 1, 3, 3+, Snare 2 und 4 |
| Ride-Beat | Groove, 4 Beats | green | Ride Achtel mit Glocke auf den Vierteln, Bassdrum 1, 2+, 3, Snare 2 und 4, Ghost Note auf der Snare vor der 4 |
| Snare-Fill | Fill, 1 Beat | peach | vier Sechzehntel Snare |
| Tom-Fill | Fill, 2 Beats | mauve | Sechzehntel Snare, Tom 1, Tom 2, Standtom |

```
Intro    | RB  RB/sf |                                     1 Block
Strophe  | RB  RB  RB  RB/sf | RB  RB  RB  RB/tf |          2 Blöcke
Refrain  | *RR RR  RR  RR/sf | RR  RR  RR  RR/tf |          2 Blöcke
Outro    | *RB RB/tf  *  |                                 1 Block

RB Rock-Beat, RR Ride-Beat, /sf /tf Fill am Taktende, * Crash-Akzent auf der 1
(letzter Takt: kein Groove, nur Crash und Bassdrum)
```

Die Datei hat die Form eines Exports mit einem Song, UUIDs als IDs und festen Zeitstempeln. Änderungen am Inhalt: Song in der App bearbeiten, exportieren und die Datei ersetzen.

## Risks / Trade-offs

- [Neue Schemaversion verlangt Migration] → Der Test aus D1 schlägt fehl, wenn die Datei nicht mehr gelesen wird; die Datei wird dann neu exportiert.
- [Song wirkt im Verlauf ohne Bearbeitung] → Gewollt, wie bei einer Kopie (`song-library`, „Song kopieren“).
