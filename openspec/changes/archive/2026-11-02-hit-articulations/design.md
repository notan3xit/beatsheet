# Design

## Context

Ein Beat speichert Schläge als Positionslisten je Instrument (`Beat.hits`, `src/domain/types.ts`). Auf dieser Form bauen Sequencer-Logik (`toggleHit`, `changeSubdivision` in `src/domain/sequencer.ts`), Notationsmodell (`beatGroup` in `src/notation/model.ts`), Dateiformat (`beatSchema` in `src/persistence/fileFormat.ts`, `.strict()`) und rund 39 Test-Assertions auf. Die Sequencer-Zelle ist ein Knopf mit `aria-pressed` und dem zugänglichen Namen „<Instrument>, Beat n, Position m“ (`src/ui/Sequencer.tsx`). VexFlow 5 bietet `GraceNote`/`GraceNoteGroup` (mit `slash`) und `Parenthesis` (Modifier pro Notenkopf-Index).

## Goals / Non-Goals

**Goals:**
- Spielweise pro Schlag, allgemein genug für spätere Spielweisen, ohne die Form von `hits` zu ändern.
- Bestehende Tests und Daten bleiben gültig: ein Beat ohne Spielweisen sieht aus wie bisher.

**Non-Goals:**
- Eingabe ohne Tastatur (Touch), Kontextmenü.
- Spielweisen für Becken, Bassdrum, Hi-Hat-Pedal.

## Decisions

### D1: Datenmodell `articulations` neben `hits`

```ts
export const ARTICULATIONS = ['flam', 'ghost'] as const;
export type Articulation = (typeof ARTICULATIONS)[number];
export const ARTICULATED: readonly Instrument[] = ['snare', 'tom1', 'tom2', 'floorTom'];

interface Beat {
  subdivision: Subdivision;
  hits: Partial<Record<Instrument, number[]>>;
  /** Spielweise je Instrument und Position (Schlüssel = Position); fehlend = normal. */
  articulations?: Partial<Record<Instrument, Record<number, Articulation>>>;
}
```

Invarianten: Eine Spielweise gibt es nur für eine Position, die in `hits` desselben Instruments steht, und nur für Instrumente aus `ARTICULATED`. Leere Einträge werden entfernt; ein Beat ohne Spielweisen hat kein Feld `articulations`. Damit sind bestehende Beats und alle Vergleiche wie `toEqual({ subdivision, hits })` weiter gültig.

Alternative B (Schlag als Objekt `{ p, a }` in `hits`): verworfen, weil sie die Form jedes Lesers und Tests ändert, ohne fachlichen Gewinn gegenüber D1 (mit dem Nutzer abgestimmt).

### D2: Domänenfunktionen

- `toggleHit`: entfernt beim Ausschalten auch die Spielweise der Position (Invariante); beim Einschalten bleibt der Schlag normal. Das Entfernen der Gegen-Hi-Hat berührt keine Spielweisen (Hi-Hat hat keine).
- Neu `cycleArticulation(pattern, beat, instrument, position)`: für Instrumente außerhalb `ARTICULATED` unverändert zurück; leere Position → Schlag mit `flam`; sonst normal → `flam` → `ghost` → normal.
- `changeSubdivision`: überträgt die Spielweise mit der umgerechneten Position; verlorene Schläge verlieren ihre Spielweise. `LostHit` bleibt unverändert (die Rückfrage zählt Schläge).
- Ein kleiner Helfer `articulationAt(beat, instrument, position)` für UI und Notation.

### D3: Sequencer-Zelle

`onClick` prüft `event.shiftKey`: mit Shift `cycleArticulation`, sonst `toggleHit`. Die Zelle erhält `data-articulation="flam|ghost"`; CSS zeigt einen Flam als kleinen Vorschlagstrich links oben in der aktiven Zelle und eine Ghost Note als gedämpfte Füllung mit Klammer-Rand (nur Tokens). Der zugängliche Name bekommt nur bei Spielweise einen Zusatz („…, Position 1, Flam“ bzw. „…, Ghost Note“); ohne Spielweise bleibt er wie bisher, damit bestehende Tests gelten. Die Shift-Auswahl von Text im Browser wird für das Raster mit `user-select: none` unterbunden. Undo funktioniert automatisch, weil beide Wege über `store.update` laufen.

### D4: Notationsmodell und Renderer

- `NoteKey` erhält `articulation?: Articulation`, gesetzt in `beatGroup` aus `articulations`. Notenwerte, Pausen und Balken bleiben unberührt.
- Renderer `noteFor`:
  - Ghost: für jeden Key-Index mit `ghost` ein `Parenthesis` links und rechts (`note.addModifier(new Parenthesis(LEFT|RIGHT), index)`), nicht `buildAndAttach`, das alle Köpfe einklammert.
  - Flam: aus allen Keys mit `flam` eine `GraceNote` (`duration: '8'`, `slash: true`, gleiche Keys, Hals nach oben), als `GraceNoteGroup` an die Note gehängt (`addModifier(group, 0)`), mit Bogen (`showSlur`), damit Vorschlag und Hauptnote auf den ersten Blick zusammengehören. VexFlow zeichnet den Bogen bei Hals nach oben unter den Notenköpfen. (Ursprünglich ohne Bogen geplant; nach Browser-Prüfung auf Wunsch des Nutzers geändert.)
  - VexFlow setzt den Vorschlag an den linken Rand des reservierten Platzes, Abstand der Kopfpositionen 24 Einheiten. Nach `formatToStave` wird `spacingFromNextModifier` jeder `GraceNoteGroup` um `GRACE_NUDGE` (8) erhöht; das rückt den Vorschlag dicht an die Hauptnote, wie bei einem Flam üblich. Der reservierte Platz bleibt und hält Abstand zur vorigen Note. (Nachtrag nach Browser-Prüfung)
- Mini-Darstellung und Karten nutzen dieselbe Funktion und zeigen Flams und Ghost Notes ebenfalls.

### D5: Dateiformat Schemaversion 3

`SCHEMA_VERSION = 3`. `beatSchema` erhält `articulations` optional: `partialRecord(enum(ARTICULATED), record(string-Ziffern, enum(ARTICULATIONS)))`, Prüfung der Invarianten im bestehenden `superRefine` (Position im Raster, Position in `hits`). Eine Datei der Version 2 hat dieselbe Form ohne `articulations` und wird mit demselben Schema gelesen (`schemaVersion: z.union([2, 3])`). Version 1 bleibt wie bisher. IndexedDB braucht keine Migration: gespeicherte Songs ohne `articulations` sind gültig.

Die JSON-Schlüssel der Positionen sind Strings („2“). Beim Lesen werden sie als Zahlen behandelt (`Number(key)`); der Domänentyp `Record<number, Articulation>` ist in JavaScript ohnehin stringbasiert, sodass Export → Import verlustfrei bleibt.

## Risks / Trade-offs

- [Vorschläge und Klammern verbreitern Takte und können in den verkleinerten Karten eng werden] → Formatter berücksichtigt Modifier bei der Mindestbreite (`preCalculateMinTotalWidth`); im Browser in Karte, Editor und Mini-Darstellung prüfen.
- [Shift-Klick ist auf Touch-Geräten nicht verfügbar] → bewusst außerhalb des Umfangs (Proposal); später z. B. langes Drücken.
- [Ältere App-Versionen lehnen Dateien der Version 3 als „neuere Version“ ab, auch ohne Spielweisen] → gewollt, eindeutige Meldung statt „beschädigt“.
- [Invariante kann durch künftige Domänenfunktionen verletzt werden] → zentraler Helfer zum Setzen/Entfernen von Positionen, der Spielweisen mitpflegt; Formatvalidierung fängt Verstöße beim Import ab.

## Ergebnis der Browser-Prüfung

Am 2026-11-02 vom Nutzer im Release-Build (pub) geprüft: Shift-Klick und Anzeige in der Zelle, Flam-Vorschlag und Ghost-Klammern in Editor, Karte und Fill-Mini-Darstellung, Export und Import mit Flams passen. Auf Wunsch rückt der Vorschlag dichter an die Hauptnote (`GRACE_NUDGE = 8`) und ist mit ihr durch einen Bogen unter den Köpfen verbunden; den Bogen hat der Nutzer mit dem Auftrag zum Archivieren freigegeben.
