# Design

## Context

Siehe proposal.md. Änderungen laufen über reine Funktionen und `store.updateSong` bzw. `commitSong`, die Revision und `updatedAt` setzen. `connectStore` schreibt geänderte Songs entprellt über `Repository.write({ put, remove })` in IndexedDB (Version 2, Store `songs`, ein Datensatz pro Song). Version 1 hatte einen Store `patterns`, der beim Upgrade in „Importierte Patterns“ wandert. Der Datei-Import ersetzt Songs nach Revision (`mergeImport`) über `store.importSongs`.

Folge-Changes (Server mit Anmeldung, Workbooks mit Sync) bauen auf diesem Change auf: Sie tauschen Automerge-Sync-Nachrichten pro Song aus, ohne `automerge-repo`.

## Goals / Non-Goals

**Goals:**
- Store, Domain-Funktionen, UI, Dateiformat und ihre Tests bleiben unverändert; Automerge ist ein Detail der Persistenz.
- Jede Änderung landet als minimale Automerge-Änderung im Dokument, damit spätere Merges feingranular sind.
- Normalisierung als reine Funktion in `domain`, unabhängig von Automerge testbar.

**Non-Goals:**
- Merge im Produkt verwenden (geschieht erst mit Sync); hier nur über `mergeSongDocs` in Tests.
- Sync zwischen Tabs, Verlauf in der UI, Kompaktierung.

## Decisions

### D1: Nur der Automerge-Kern, WebAssembly als Base64

`@automerge/automerge` (3.x), Einstieg `@automerge/automerge/slim` mit `initializeBase64Wasm` aus `@automerge/automerge/automerge.wasm.base64`. Eine Funktion `initAutomerge()` in `src/persistence/songDoc.ts` wird in `main.tsx` vor `openRepository()` und in `src/test/setup.ts` einmal erwartet.
Alternative `vite-plugin-wasm` + Top-Level-Await: zusätzliche Plugins für Build und Vitest, separate `.wasm`-Datei im Release; Base64 läuft in Browser, Vitest und dem statischen Release (`~/pub`) ohne Konfiguration, kostet ca. ein Drittel mehr Bytes.

### D2: Dokumente leben im Repository, der Store bleibt Song-basiert

`Repository` behält seine Schnittstelle (`loadAll(): Song[]`, `write({ put: Song[], remove })`). Intern hält es `Map<id, Doc<SongDoc>>`: `loadAll` lädt die Bytes, erzeugt die Dokumente und liefert normalisierte Songs; `write` wendet jeden Song über die Brücke (D4) auf sein Dokument an (unbekannte ID: neues Dokument) und speichert `A.save(doc)`.
Alternative Automerge im Store: Store und viele Tests würden sich ändern, ohne dass die UI davon profitiert. Für den Sync (Folge-Change) braucht der Store später einen Weg, eingehende Songs ohne Revisionserhöhung zu übernehmen; das ist dort zu entscheiden.

### D3: Dokumentform `SongDoc`

Wie `Song`, mit diesen Abweichungen:
- `v: 1` an der Wurzel (Form des Dokuments).
- `Beat.hits`: `{ [instrument]: { [position]: true } }` statt sortierter Arrays; gleichzeitiges Setzen desselben Schlags ergibt einen Schlüssel, nicht zwei Einträge.
- `Bar.accents`: `{ "<instrument>:<beat>:<position>": true }` statt Array, aus demselben Grund.
- `revision` (Song, Pattern): Automerge-`Counter` (D5).
- Zeichenketten (IDs, Titel, Namen, Zeitpunkte) als `ImmutableString`: gleichzeitige Änderungen gelten als Ganzes, kein Zeichen-Merge.
- Feste Container: Jeder Beat hat `hits` mit einem (ggf. leeren) Eintrag für jedes Instrument und `articulations` mit einem für jedes Instrument aus `ARTICULATED`; jeder Takt hat `accents`. Die Brücke legt Container nur mit ihrem Elternobjekt an und löscht sie nie einzeln. Grund: Legen zwei Fassungen unter demselben Schlüssel gleichzeitig ein Objekt an, gewinnt eines ganz und der Inhalt des anderen geht verloren; löscht eine Fassung ein Objekt, gehen Einträge der anderen darin verloren.

`toDocShape(song)` und `fromDocShape(doc)` sind reine Umwandlungen; `fromDocShape` sortiert Positionen aufsteigend und Akzente nach Beat, Position und Instrumentenreihenfolge (die Reihenfolge der Akzente ist fachlich ohne Bedeutung).

### D4: Brücke `applySong(doc, song)`

Vergleicht den **aktuellen Dokumentinhalt** mit `toDocShape(song)` und schreibt in einem `A.change` nur die Unterschiede:
- Maps: fehlende Schlüssel löschen, neue setzen, gleiche rekursiv vergleichen.
- Listen mit `id` (Patterns, Segmente, Blöcke, Takte): nach ID abgleichen; entfernte löschen, neue an ihrer Position einfügen, verschobene löschen und neu einfügen, gleiche rekursiv vergleichen.
- Listen ohne `id` (`Pattern.beats`): nach Index; überzählige am Ende löschen, fehlende anhängen.
- Skalare und Zeichenketten: setzen, wenn verschieden.

Weil gegen den Dokumentinhalt verglichen wird, landen Normalisierungen (D6) mit der nächsten Änderung im Dokument, und ein identischer Song erzeugt keine Änderung.
Alternative Patches aus dem Store mitliefern: verlangt Änderungen an allen reinen Funktionen.

### D5: Revision als Counter

Die Brücke erhöht den Counter um `song.revision - aktueller Wert` (auch negativ möglich, etwa beim Import). Beim Zusammenführen addieren sich die Erhöhungen beider Fassungen (7 + 5 + 1 = 13), daher liegt die Revision über der jeder Fassung (Spec `song-merge`, „Revision nach dem Zusammenführen“). `updatedAt` bleibt ein einfacher Wert; bei Gleichzeitigkeit gilt einer der beiden.

### D6: Normalisierung `normalizeSong(song)` in `src/domain/normalize.ts`

Reine Funktion, deterministisch, gibt bei gültigem Song dieselbe Referenz zurück. Angewendet in `loadAll` und nach `mergeSongDocs`. Regeln, je nur das betroffene Element:
- `grooveId`/`fillId` ohne passendes Pattern dieser Art → `null`.
- Positionen außerhalb des Rasters (`>= subdivision`) → entfernt.
- Geschlossene und offene Hi-Hat an derselben Position → die geschlossene bleibt.
- Spielweise ohne Schlag oder auf nicht artikulierbarem Instrument → entfernt.
- Pattern mit mehr als `MAX_LENGTH` Beats → am Ende gekürzt; mit 0 Beats → ein leerer Beat.
- Akzent mit `beat >= bar.beats` → entfernt.
- Block ohne Takte → entfernt.

Abnahme: `parseNotebookFile(serializeNotebook([normalizeSong(s)]))` gelingt für jedes Ergebnis der Merge-Tests.

### D7: Zusammenführen `mergeSongDocs(a, b)`

`A.merge(A.clone(a), b)`, danach `fromDocShape` + `normalizeSong`. In diesem Change nur von Tests genutzt; Fassungen entstehen dort mit `A.clone` aus einem gemeinsamen Dokument und werden über `applySong` mit den echten Domain-Funktionen (`toggleHit`, `appendSegment` …) geändert.

### D8: IndexedDB Version 3

Neuer Store `documents` (`{ id, bytes }`, Schlüssel `id`). Upgrade:
- von 2: jeden Datensatz aus `songs` (Tempo-Vorgabe wie bisher, ohne Revisionserhöhung) per `A.from(toDocShape(song))` übernehmen, `songs` löschen.
- von 1: Patterns wie bisher zu „Importierte Patterns“, dann als Dokument speichern, `patterns` löschen.
- neu: nur `documents`.

Das Upgrade läuft in einer Versionstransaktion; scheitert es, bleibt die Datenbank in Version 2 und die App zeigt die vorhandene Startfehlermeldung. Automerge muss vor `openDB` initialisiert sein (D1), weil `A.from` synchron im Upgrade läuft.

### D9: Undo unverändert

Der Snapshot-Verlauf des geöffneten Patterns bleibt. Ein Undo schreibt dieses Pattern über die Brücke auf den früheren Stand. Mit späterem Sync würde dabei eine gleichzeitige fremde Änderung an genau diesem Pattern zurückgesetzt; das wird bewusst hingenommen.

## Risks / Trade-offs

- [Bundle wird größer (WebAssembly als Base64)] → Größe von `dist` vor und nach dem Change messen und hier festhalten; bei Bedarf später Wechsel auf separate `.wasm`-Datei.
- [Verschieben (z. B. `moveSegment`) ist Löschen + Einfügen] → Gleichzeitige Änderungen im verschobenen Element gehen beim Merge verloren. Selten; Automerge kennt kein Verschieben in Listen.
- [Gleiche Song-ID, unabhängige Dokumente] → Entsteht, wenn eine Exportdatei auf einem zweiten Gerät importiert wird; ein Merge solcher Dokumente verdoppelt Listen. Betrifft erst den Sync; dort muss der Server ein zweites Dokument mit bekannter ID abweisen.
- [Wachsende Historie] → Songs sind klein, `A.save` komprimiert; Kompaktierung erst bei Bedarf.
- [Fehler in der Migration] → Tests mit `fake-indexeddb` für beide Ausgangsversionen; zusätzlich Prüfung mit echten Daten im Browser (tasks.md).

## Migration Plan

Die Migration läuft automatisch beim ersten Start (D8). Eine ältere App-Version kann eine Datenbank in Version 3 nicht öffnen; Rückweg ist der Export aus der neuen Version und Import in die alte (Dateiformat unverändert).

## Messung Bundle-Größe

`npm run build`, eine JS-Datei in `dist/assets` (2026-11-03):

| | roh | gzip |
|---|---|---|
| vorher | 1.538 kB | 818 kB |
| nachher (Wasm als Base64, D1) | 6.446 kB | 2.470 kB |
| zum Vergleich: `automerge.wasm` allein | 3.644 kB | 1.142 kB |

Das Base64-Wasm macht den Großteil aus; als separate `.wasm`-Datei wären es zusammen etwa 1.960 kB gzip, und das Wasm würde getrennt vom App-Code zwischengespeichert. pub.artjomweyand.de liefert gzip.

Entscheidung: Base64 bleibt vorerst.

## Prüfung im Browser

Release-Build von artjom im Browser mit vorhandenen Daten geprüft (2026-11-03): Songs nach der Übernahme vorhanden, Bearbeiten und Neuladen ohne Beanstandung.
