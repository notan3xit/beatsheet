# Design

## Context

Siehe `proposal.md` (Why) und die Exploration. Ist-Zustand:
- `src/domain`: `Pattern` (Beats mit Unterteilung, Schläge), reine Operationen in `pattern.ts`/`sequencer.ts`.
- `src/state/libraryStore.ts`: flache Pattern-Liste, `selectedId`, Undo/Redo pro geöffnetem Pattern. Die UI-Komponenten `PatternEditor`/`Sequencer` sprechen den Store über `useStore()` an (`update`, `rename`, `resize`, `duplicate`, `remove`, `undo`, `redo`).
- `src/persistence`: IndexedDB `drumstuff` v1 mit Object Store `patterns` (ein Datensatz pro Pattern), Dateiformat `drumstuff.library` v1 (zod), Merge nach Revision.
- `src/notation`: Notationsmodell + VexFlow-Adapter (`currentColor`).
- `src/ui/theme.ts` stellt alle Catppuccin-Farben als `--ctp-<name>` bereit.

## Goals / Non-Goals

**Goals:**
- Musikalische Logik (Groove-Fortlauf, Fill-Überdeckung) und das Layout der linken Seite als **reine Funktionen** mit eigenem Zwischenmodell. Die meisten Szenarien lassen sich so ohne DOM testen, wie beim Notationsmodell.
- Pattern-Editor und Sequencer aus Change 1 unverändert weiterverwenden. Nur der Store dahinter wird songbezogen.
- Ein Song ist ein Dokument: Speichern, Export/Import und später der Sync arbeiten auf Song-Ebene.

**Non-Goals:**
- Undo für Strukturänderungen (Undo bleibt pro Pattern wie bisher)
- Tablet-Layout, Blättern, Offline
- Drag & Drop in der Struktur

## Decisions

### D1: Datenmodell

```ts
type PatternColor = Exclude<AccentName, 'red'>;           // aus @catppuccin/palette
interface Pattern { ...wie bisher; color: PatternColor }

interface Accent { instrument: Instrument; beat: number; position: 0 | 1 | 2 | 3 } // beat 0-basiert, Sechzehntel
interface Bar { id: string; beats: number; grooveId: string | null; fillId: string | null; accents: Accent[] }
interface Block { id: string; bars: Bar[] }
interface Segment { id: string; name: string; blocks: Block[] }
interface Song {
  id: string; title: string;
  patterns: Pattern[]; segments: Segment[];
  createdAt: string; updatedAt: string; revision: number;
}
```

- Ein Fill hängt am Takt, an dessen Ende er endet (`fillId`). Seine Länge ergibt sich aus dem Pattern. So bleibt die Regel „endet an einem Taktende“ strukturell garantiert.
- Akzente nutzen ein festes Sechzehntel-Raster. Triolen-Akzente sind vorerst nicht vorgesehen, das ist eine bewusste Vereinfachung.
- **Farbreihenfolge** `PATTERN_COLORS`: blue, green, peach, mauve, teal, yellow, pink, sapphire, maroon, lavender, sky, flamingo, rosewater (13 Farben, ohne `red`). Vergeben wird die erste Farbe, die im Song noch frei ist. Sind alle vergeben, geht es zyklisch nach der Anzahl der Patterns weiter.

### D2: Auflösung der Struktur, `src/domain/timeline.ts`
`resolveSong(song): ResolvedBar[]` liefert pro Takt in Songreihenfolge:

```ts
interface ResolvedBar {
  barId; segmentId; blockId; index;          // index = laufende Taktnummer im Song
  start: number; beats: number;              // globale Beat-Position
  groove: { patternId; offset: number } | null;   // offset = Startbeat im Groove (0-basiert)
  coveredFrom: number | null;                // ab welchem Beat (im Takt) ein Fill überdeckt
  fills: { patternId; from; to }[];          // Fill-Abschnitte in diesem Takt (Takt-Beats)
  accents: Accent[];
}
```

- **Groove-Fortlauf:** Läuft innerhalb eines Blocks. `offset = (offset_vorher + beats_vorher) mod grooveLänge`, solange derselbe Groove ohne Unterbrechung folgt. Ein Neustart erfolgt bei Blockanfang, Groove-Wechsel oder einem Takt ohne Groove.
- **Fill-Überdeckung:** Für jeden Takt mit Fill wird ab seinem Ende rückwärts über `start` die Fill-Länge abgetragen. Das reicht über Takt-, Block- und Segmentgrenzen und endet spätestens bei Beat 0. Liegen zwei Fills übereinander, gewinnt der spätere. Er überdeckt den früheren, denn „ehrlich zeigen“ heißt hier, dass der zuletzt endende Fill zu sehen ist.

### D3: Layout der linken Seite, `src/songbook/layout.ts`
`layoutStructure(song, resolved): SegmentLayout[]`, rein. Jedes Segment besteht aus Zeilen zu höchstens 4 Takten. Jede Zeile enthält Elemente mit Position und Breite **in Beats**:

```ts
type Item =
  | { kind: 'groove'; x; width; patternId; color; label; startBeat: number | null }  // startBeat nur, wenn Groove länger als der Takt ist
  | { kind: 'empty'; x; width }
  | { kind: 'fill'; x; width; patternId; color; label; mini: boolean; continuesLeft; continuesRight; barlines: number[] }
  | { kind: 'barline'; x }
  | { kind: 'accent'; x; label }    // Kürzel: Cr, Ri, HH, oHH, T1, T2, SD, FT, BD, HP
```

- Ein Fill wird pro Zeile zu einem zusammenhängenden Element mit inneren Taktstrichen (`barlines`) zusammengefasst. Geht er über eine Zeilengrenze, wird er geteilt und bekommt `continuesLeft/Right`.
- `mini = true`, wenn der Fill insgesamt kürzer als der Takt ist, in dem er endet.
- Die Darstellung mit React und CSS rechnet `left`/`width` als `calc(var(--beat) * x)`. `--beat` ergibt sich aus Seitenbreite / 16, also 4 Takte 4/4 pro Zeile. Längere Zeilen dürfen überstehen, getreu „ehrlich zeigen“.

### D4: Mini-Noten
Der VexFlow-Adapter bekommt die Option `{ compact: true }`: kein Schlüssel, Skalierung 0,6, nur ein System, keine Zeilenumbrüche. Gezeigt werden die Noten des Fills über seine volle Länge im Fill-Block. Ist der Fill im Takt abgeschnitten (Songanfang), zeigt der Block trotzdem den ganzen Fill. Zuerst entsteht ein Prototyp, der die Lesbarkeit bei etwa 32 px pro Beat prüft.

**Ergebnis des Prototyps (Task 5.3):** `--beat` = 2.25rem (36 px). Ein 1-Beat-Fill-Block misst etwa 36 × 46 px. Damit die Mini-Darstellung beim Skalieren möglichst groß bleibt, hat sie eigene, knappere Maße: Beatbreite 36, Rand 2, Zeilenhöhe 115 (statt 72/10/210). Bei 1:1 ist die Figur erkennbar (Anzahl und Balkung der Noten, Tonhöhenverlauf), einzelne Notenpositionen nicht. Als Erinnerung reicht das, die vollständigen Noten stehen auf der rechten Seite. Auf Displays mit doppelter Pixeldichte (Tablet) ist sie deutlich klarer. Eine Ausweichlösung (nur Name) ist nicht nötig. Leere Fills zeigen keine Noten, nur den farbigen Block.

### D5: Store, `src/state/notebookStore.ts` ersetzt `libraryStore.ts`
- **Zustand:** `{ songs, openSongId, view: 'list' | 'book' | { pattern: id }, canUndo, canRedo }`.
- Die bisherige Pattern-API (`update`, `rename`, `resize`, `duplicate`, `remove`, `undo`, `redo`, `createPattern`) bleibt erhalten, wirkt aber auf den **geöffneten Song**. `PatternEditor`/`Sequencer` brauchen dadurch kaum Änderungen.
- Neue Song-API: `createSong`, `renameSong`, `deleteSong`, `openSong`, `openPattern`, `backToBook`, `backToList`.
- Neue Struktur-API: `updateStructure(change)` mit reinen Operationen aus `src/domain/structure.ts` (Segment anfügen/duplizieren/verschieben/löschen, Block/Takt einfügen/löschen, Takteigenschaften setzen, Akzente).
- Jede Änderung erhöht die Revision des Songs (`touch`). Pattern-Änderungen erhöhen zusätzlich die des Patterns.
- Wird ein Pattern gelöscht, entfernt dieselbe Operation seine Verweise aus allen Takten (D1, Spec `pattern-library`).

### D6: Persistenz
- **IndexedDB v2**, Object Store `songs` (Schlüssel `id`), ein Datensatz pro Song. Das `upgrade` von v1 liest im selben Versionswechsel alle `patterns`. Sind welche vorhanden, legt es den Song „Importierte Patterns“ an (Farben werden nachträglich vergeben) und löscht danach den Store `patterns`. Die Upgrade-Semantik von IndexedDB garantiert, dass das genau einmal passiert.
- `connectStore` vergleicht Songs statt Patterns (Referenzvergleich, unverändertes Prinzip).
- **Dateiformat v2:** `{ format: 'drumstuff.library', schemaVersion: 2, exportedAt, songs: Song[] }`. Zod prüft zusätzlich die Verweise: `grooveId` muss auf einen Groove, `fillId` auf einen Fill desselben Songs zeigen, Akzent-Beat liegt innerhalb des Takts.
- **v1-Lesepfad:** v1 wird wie bisher validiert und dann in einen neuen Song „Importierte Patterns“ mit neuer Song-ID verpackt, die Farben werden vergeben. Der Merge erfolgt songweise nach Revision und Änderungszeitpunkt, wie bisher bei Patterns.

### D7: UI-Aufbau

```
SongList  --open-->  Songbook (Doppelseite)  --Pattern wählen-->  PatternEditor (bestehend)
                      |-- links: StructurePage (Layout + Auswahl)        <-- "Zurück zum Song"
                      |          + StructureToolbar (Segment hinzufügen)
                      |          + BarInspector (Auswahl: Länge, Groove, Fill, Akzente, Takt +/-)
                      |-- rechts: PatternPage (Patterns in Reihenfolge, Noten / "noch leer")
```

- **Auswahl:** Ein Klick wählt einen Takt, Shift+Klick wählt einen Bereich innerhalb des Songs. Der Inspector wirkt auf alle ausgewählten Takte.
- **Platzhalter:** Die Auswahllisten für Groove/Fill enthalten „Neuer Groove …“ / „Neuer Fill …“ und öffnen eine Inline-Eingabe für Name (und bei Fills die Länge). Der Struktur-Editor bleibt dabei offen.
- Export/Import bleiben in der Kopfzeile und betreffen alle Songs.

### D8: Teststrategie
- **Unit:** `structure.ts` (Operationen), `timeline.ts` (Fortlauf, Überdeckung), `layout.ts` (Breiten, Zeilen, Fill-Elemente, Markierungen), Farbvergabe, Dateiformat v2/v1, Merge.
- **Repository:** Upgrade v1 → v2 mit fake-indexeddb. Dafür wird zuerst eine v1-Datenbank mit `patterns` angelegt, dann `openRepository` aufgerufen.
- **Komponenten:** Song-Liste, Doppelseite (Reihenfolge rechts, „noch leer“, Navigation zum Editor), Inspector (Platzhalter anlegen, Auswahl setzen), Löschen mit Verwendungszahl.
- **Bestehende Tests:** Die Tests aus Change 1 zur globalen Bibliotheksübersicht entfallen bzw. wandern auf die Song-Ebene. Das ist eine fachliche Änderung durch die MODIFIED/REMOVED-Specs.
- **Browser-Check** (headless Edge, CDP) gegen den Produktions-Build: Song anlegen, Struktur mit Platzhaltern, Fill über Taktgrenze, Neuladen, Screenshots Hell/Dunkel.

## Risks / Trade-offs

- [Umfang: größter Change bisher] → Klare Schichtung (Domain → Layout → UI). Jede Gruppe ist für sich testbar, und die App bleibt nach jeder Gruppe lauffähig, weil die Persistenz direkt nach dem Store umgestellt wird.
- [Mini-Noten bei 1 Beat Breite schwer lesbar] → Prototyp in Gruppe 4. Als Ausweichlösung zeigt der Block nur den Namen, dann muss die Spec angepasst werden.
- [v1-Datei zweimal importiert ergibt zwei Songs „Importierte Patterns“] → Akzeptiert. Die Pattern-IDs bleiben gleich, ein späteres „Kopieren zwischen Songs“ kann das bereinigen.
- [IndexedDB-Upgrade schlägt fehl, z. B. bei einem Abbruch] → Das Upgrade läuft transaktional, bei einem Fehler bleibt v1 erhalten. Die App zeigt dann die bestehende Startfehlermeldung.
- [Groove-Fortlauf über Takte ohne Groove] → Ein Neustart ist bewusst gewählt. Ein Takt ohne Groove unterbricht den Fluss.
- [Überlappende Fills] → Der später endende Fill gewinnt (D2). Das wird in der Darstellung sichtbar, aber nicht verhindert.

## Migration Plan

1. Beim ersten Start mit der neuen Version führt das IndexedDB-Upgrade v1 → v2 die Übernahme aus (Spec „Übernahme lokaler Daten aus der Vorversion“).
2. Alte Exportdateien (v1) bleiben importierbar.
3. Rollback: Eine ältere App-Version kann eine v2-Datenbank nicht öffnen (`VersionError`). Vor dem Update empfiehlt sich deshalb ein Export, den die Hinweis-Leiste ohnehin nahelegt.
