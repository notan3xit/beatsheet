# Design

## Context

Greenfield: Im Repo gibt es bisher nur das OpenSpec-Setup. Motivation siehe `proposal.md` (Why). Vorgaben aus der Exploration:

- Eingabe am Computer, Lesen später auf dem Tablet (Change `add-song-structure`). Daraus folgt eine Web-App mit einer Codebasis.
- Local-first. Ein generischer Sync-Server kommt später und soll ohne Umbau des Datenmodells möglich sein.
- Test-first gemäß `AGENTS.md`: Jedes Szenario aus den Specs wird zuerst als fehlschlagender Test erfasst.

## Goals / Non-Goals

**Goals:**
- Fachlogik (Pattern-Operationen, Unterteilungswechsel, Notationsableitung, Import-Merge) als reine Funktionen ohne UI- und Browser-Abhängigkeit. So lassen sich fast alle Szenarien schnell als Unit-Tests abbilden.
- Ein Dateiformat, das unverändert auch das Sync-Format sein kann.
- Rendering-Bibliothek austauschbar hinter einer schmalen Schnittstelle.

**Non-Goals:**
- PWA/Offline-Installation, Service Worker (kommt mit dem Tablet-Reader)
- Responsives Layout für Tablet/Telefon. Der Editor zielt auf Desktop-Browser (Chrome, Firefox, Safari aktuell).
- Pixelgenaue Prüfung der Notengrafik

## Decisions

### D1: Tech-Stack: TypeScript, Vite, React
- **TypeScript** für ein typsicheres Datenmodell, das Change 2 und der Sync wiederverwenden
- **Vite** als Build-Tool und Dev-Server, **Vitest** als Test-Runner (gleiche Konfiguration, schnell)
- **React** als UI-Framework: größtes Ökosystem, gute Testbarkeit mit Testing Library
- Alternativen: Svelte/Solid (schlanker, aber kleineres Ökosystem) und Vanilla TS (für Sequencer plus Editor-Zustand zu viel Handarbeit). Die Wahl ist eine Annahme und vor dem Apply leicht änderbar, weil die Fachlogik framework-frei bleibt (D3).

### D2: Datenmodell

```ts
type Instrument =
  | 'crash' | 'ride' | 'hihat' | 'hihatOpen' | 'tom1' | 'tom2'
  | 'snare' | 'floorTom' | 'kick' | 'hihatPedal';

type Subdivision = 2 | 3 | 4 | 6;

interface Beat {
  subdivision: Subdivision;
  hits: Partial<Record<Instrument, number[]>>; // 0-basierte Positionen, sortiert, eindeutig
}

interface Pattern {
  id: string;            // UUID v4, unveränderlich
  kind: 'groove' | 'fill';
  name: string;
  beats: Beat[];         // Länge in Beats = beats.length (1..16)
  createdAt: string;     // ISO 8601
  updatedAt: string;
  revision: number;      // startet bei 1
}
```

- Die Länge wird nicht separat gespeichert, sondern aus `beats.length` abgeleitet. Damit gibt es keine Inkonsistenz.
- Die Schläge liegen pro Beat und Instrument als Positionsliste vor statt als vollständige boolesche Matrix: kompakt im JSON und leicht zu diffen.
- Alternative wäre eine absolute Zeitachse mit Ticks (z. B. 48 PPQ). Wegen des Unterteilungswechsels wäre das zwar mächtiger, aber das Prinzip „Raster pro Beat“ würde verwischen. Verworfen.

### D3: Schichtung

```
src/
  domain/        reine Funktionen: Pattern anlegen/ändern, Länge, Duplizieren,
                 Unterteilungswechsel, Hi-Hat-Exklusivität, Benennung
  notation/      model.ts: Pattern -> NotationModel (reine Funktion, testbar)
                 render/vexflow.ts: NotationModel -> SVG (dünner Adapter)
  persistence/   fileFormat.ts (Schema + Validierung), merge.ts (Import-Regeln),
                 repository.ts (IndexedDB)
  state/         Store (Bibliothek, offenes Pattern, Undo/Redo)
  ui/            React-Komponenten (Übersicht, Sequencer, Notenvorschau, Dialoge)
```

`domain`, `notation/model` und `persistence/{fileFormat,merge}` importieren weder React noch Browser-APIs.

### D4: Unterteilungswechsel über zeitliche Lage
Position `p` bei Unterteilung `a` liegt bei `p/a` des Beats. Im neuen Raster `b` ergibt sich `q = p·b/a`. Ist `q` ganzzahlig, bleibt der Schlag erhalten, sonst geht er verloren. Die Domain-Funktion liefert das neue Beat **und** die Liste der verlorenen Schläge. Die UI fragt nur dann nach, wenn diese Liste nicht leer ist. Dasselbe Muster gilt beim Kürzen eines Patterns (Funktion liefert „würde Schläge entfernen: ja/nein“).

### D5: Notation über ein Zwischenmodell
`model.ts` erzeugt pro Takt und Stimme (oben: Hände, unten: Füße) eine Folge von Events `{ kind: 'note' | 'rest', duration, keys[], tuplet?, beamGroup }`. Regeln:
- Dauer eines Events = Abstand bis zum nächsten Event derselben Stimme im selben Beat bzw. bis zum Beat-Ende. Die Dauer wird auf den größten Standardnotenwert abgebildet (bei Sechzehntel-Raster auch punktierte Achtel). Ein Rest, der sich nicht als Standardwert darstellen lässt, wird mit Pausen aufgefüllt.
- Lücken vor dem ersten Schlag werden zu Pausen. Leere Beats werden zu Viertelpausen.
- `beamGroup` = Beat-Index, damit Balken nie über Beatgrenzen gehen.
- Triolen-Beats bekommen `tuplet: 3 | 6`.
- Die Abbildung Instrument → Systemposition und Notenkopf ist eine Tabelle gemäß Spec `drum-notation`.

Die Szenarien der Spec werden gegen dieses Modell getestet. Der VexFlow-Adapter wird nur per Smoke-Test geprüft (rendert ohne Fehler, erzeugt SVG) und beim Review visuell kontrolliert.

### D6: Rendering mit VexFlow
VexFlow beherrscht Percussion-Schlüssel, x-Notenköpfe, mehrere Stimmen, Tuplets und Beams und rendert SVG.
- Alternativen: abcjs (Drum-Notation nur über Umwege und weniger Kontrolle über das Layout) und eigenes SVG-Rendering (volle Kontrolle, aber sehr aufwendig). Eigenes SVG bleibt eine Option für die Mini-Fills in Change 2, das Zwischenmodell aus D5 ist dafür bereits die Grundlage.

### D7: Persistenz: IndexedDB über `idb`, ein Datensatz pro Pattern
- Object Store `patterns`, Schlüssel `id`. Jede Pattern-Änderung schreibt genau dieses Pattern. Das passt zum späteren Sync auf Dokumentebene.
- Geschrieben wird mit kurzer Entprellung (~300 ms) und Sofort-Flush bei `visibilitychange`/`pagehide`, damit Sequencer-Klicks nicht jeweils eine Transaktion auslösen.
- `navigator.storage.persist()` wird beim ersten Start aufgerufen. Das Ergebnis steuert den Hinweis aus der Spec.
- Tests nutzen `fake-indexeddb`.
- Alternativen: localStorage (synchron, kleines Limit, nur Strings) und Dexie (komfortabler, aber für einen Store überdimensioniert).

### D8: Dateiformat und Validierung

```json
{
  "format": "drumstuff.library",
  "schemaVersion": 1,
  "exportedAt": "2026-11-01T12:00:00.000Z",
  "patterns": [ /* Pattern wie D2 */ ]
}
```

- Validierung mit **zod**. Das Schema ist die einzige Wahrheit für Import, Export und den späteren Sync. Strukturregeln: Länge 1–16, Unterteilung aus {2,3,4,6}, Positionen ganzzahlig und `< subdivision`, keine gleichzeitige geschlossene und offene Hi-Hat an einer Position, Name nicht leer.
- Bei `schemaVersion > 1` wird mit eigener Meldung abgewiesen. Ab einer späteren Version 2 wird es Migrationsfunktionen `vN -> vN+1` geben.
- Der Import ist atomar: erst die ganze Datei validieren, dann den Merge berechnen (`merge.ts`, rein), dann in einer einzigen IndexedDB-Transaktion schreiben.

### D9: Undo/Redo
Pro geöffnetem Pattern gibt es einen Verlauf unveränderlicher Pattern-Snapshots (max. 50). Weil die Pattern-Operationen rein sind und neue Objekte liefern, sind Snapshots billig. Auch ein Undo ist eine Änderung: Revision und `updatedAt` steigen, damit der Sync sie später korrekt sieht.

### D10: Teststrategie
- **Unit (Vitest):** `domain`, `notation/model`, `persistence/fileFormat`, `persistence/merge`. Hier liegt der Großteil der Szenarien.
- **Komponenten (Vitest + Testing Library, jsdom):** Szenarien mit UI-Verhalten (Bestätigungsdialoge, Übersicht, Vorschau aktualisiert sich, Undo-Buttons)
- **Repository (Vitest + fake-indexeddb):** Speichern und Neuladen, erster Start, atomarer Import
- Testnamen verweisen auf das Szenario (`Spec pattern-sequencer › Sechzehntel nach Triole mit Verlust`), damit jedes Szenario nachweislich abgedeckt ist.

## Risks / Trade-offs

- [VexFlow-Feinheiten bei Percussion: Hilfslinien für Crash/Hi-Hat-Pedal, Kollisionen zwischen zwei Stimmen, Platzierung der Tuplet-Ziffern] → Früher Spike direkt nach dem Setup. Wenn VexFlow nicht reicht, wird nur der Adapter ersetzt (D5/D6).
- [VexFlow misst Text über Canvas, jsdom kann das nicht] → Notation fachlich nur über das Zwischenmodell testen, den Adapter nur im Browser bzw. per Smoke-Test mit Canvas-Stub
- [Safari kann lokale Daten löschen] → `persist()` anfordern, Hinweis anzeigen, Export als Sicherung (Spec `library-persistence`)
- [Revision-basierter Merge ist kein echtes Konfliktlösen. Parallele Änderungen auf zwei Geräten: die höhere Revision gewinnt, die andere geht verloren] → Für einen einzelnen Nutzer akzeptabel. Ein späterer Sync kann auf Basis von `revision` + `updatedAt` Konflikte erkennen und melden.
- [Entprelltes Schreiben: Absturz innerhalb von ~300 ms verliert die letzte Änderung] → Flush bei `pagehide`/`visibilitychange`. Das Restrisiko ist akzeptiert.
- [React ist eine Annahme ohne ausdrückliche Vorgabe] → Fachlogik bleibt framework-frei. Ein Wechsel vor dem Apply betrifft nur `ui/` und `state/`.

### Ergebnisse des VexFlow-Spikes (Task 2.1)

VexFlow 5 rendert alle geforderten Elemente korrekt. Hinweise für den Adapter:
- `StaveNote` mit `clef: 'percussion'` und explizitem `stemDirection` (1 = Hände, −1 = Füße), kein Auto-Stem
- Tonhöhen für die Systempositionen (Percussion-Schlüssel wie Violinschlüssel): Hi-Hat-Pedal `c/4`, Bassdrum `f/4`, Standtom `a/4`, Snare `c/5`, Tom 2 `d/5`, Tom 1 `e/5`, Ride `f/5`, Hi-Hat `g/5`, Crash `a/5`. x-Notenkopf über das Suffix `/x2`.
- Offene Hi-Hat: `Annotation('o')` mit `VerticalJustify.TOP`
- Triolen: `Tuplet(notes, { numNotes: 3|6, notesOccupied: 2|4 })`, für die untere Stimme `location: -1`
- Balken: ein `Beam` pro Stimme und Beat, und nur, wenn die Gruppe mindestens zwei balkbare Noten enthält
- Akkorde mit Sekundabstand (Crash + Hi-Hat) zeigt VexFlow mit versetztem Notenkopf. Das ist üblich und wird akzeptiert.
- Zwei Stimmen: `Formatter.joinVoices`. Pausen der unteren Stimme bekommen eine tiefe Position (`f/4`), damit sie nicht mit der oberen Stimme kollidieren.
- VexFlow bindet die Fonts Bravura/Academico im Standard-Entry ein, das Bundle wird dadurch merklich größer (~1 MB). Für jetzt akzeptiert. Später ließe sich Lazy-Loading der Notenkomponente einbauen.

## Migration Plan

Keine. Erstes Release, keine Bestandsdaten.
