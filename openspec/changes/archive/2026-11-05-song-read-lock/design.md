# Design

## Context

Motivation und Umfang: `proposal.md`, Verhalten: `specs/`.

- Der Store hält `openSongId` und `view`. `openSong` läuft nur beim echten Öffnen: `connectUrl` ruft es nur auf, wenn sich der Song ändert, und der Weg zwischen Doppelseite und Pattern-Editor geht über `openPattern` und `backToBook`.
- `createSong` öffnet den Song nicht. Er wird danach in der Song-Liste angeklickt und läuft dann ebenfalls über `openSong`.
- `Songbook` und `PatternEditor` werden abwechselnd montiert, lokaler React-Zustand überlebt den Wechsel also nicht.
- Takt- und Segment-Popover mischen Bearbeiten und Abspielen.
- `button:disabled` setzt die Deckkraft global auf 0,45.

## Goals / Non-Goals

**Goals:**

- Ein einziger Sperrzustand, den jede betroffene Komponente gleich abfragt.
- Vorhandene Bearbeitungswege bleiben unverändert.
- Gesperrt ist ein Knopf wirkungslos, solange er nicht ausdrücklich freigegeben ist.

**Non-Goals:**

- Durchsetzung außerhalb der Oberfläche: Store, Abgleich und Import ändern Songs unabhängig vom Sperrzustand.

## Decisions

### D1: Zustand im Store

`NotebookState` erhält `locked: boolean`, der Store die Methode `setLocked(locked)`. `openSong` setzt `locked` auf `false` für einen Song ohne Segmente und ohne Patterns, sonst auf `true`. Andere Navigation, `applyRemote` und `importSongs` lassen `locked` unverändert.

Der Zustand liegt nicht in Automerge oder IndexedDB und nicht in der Route. Das ergibt ohne weiteren Code die Spec: Jeder Tab hat seinen eigenen Store, und Neuladen beginnt mit `openSong`.

Alternativen:
- React-Kontext in `App`: müsste beim Öffnen eines Songs vom Store erfahren und bildet damit eine zweite Navigationsquelle.
- Merker „in dieser Sitzung neu angelegt“ statt der Regel für leere Songs: braucht zusätzlichen Zustand und ließe einen leeren Song nach dem Neuladen oder im Workbook ohne jede Aktion gesperrt.

### D2: Sperre durch Rendering, kein Riegel im Store

Komponenten lesen `useNotebook().locked` und rendern gesperrt keine Bearbeitungselemente. `updateSong` prüft den Zustand nicht.

Alternative: `updateSong` und `update` lehnen gesperrt ab. Das zwänge alle Store-Tests und Aufrufer zum Entsperren, und ein vergessener Knopf täte stillschweigend nichts. Knöpfe sichert stattdessen D7 ab.

### D3: Komponenten

| Komponente | Gesperrt |
|---|---|
| `SongHeader` | Überschrift und Tempo als Text, ohne „Song löschen“ |
| `EditableHeading` | Prop `readOnly`: Text ohne Knopf und Klick, nach D8 mit gleichem Rahmen |
| `TempoMark` | Doppelseite und Pattern-Editor; Text mit gleichem Namen für Screenreader |
| `StructurePage` | ohne `BarInsertButtons`, Einfügestreifen und „Erstes Segment anlegen“ |
| `StructurePopovers` | Takt-Popover mit Titel und `PlayActions`, Segment-Popover mit `PlayActions` |
| `PatternPage` | ohne `page-actions`, ohne Hinweis zum Anlegen, Karten ohne Ziehquelle; Name des Knopfs „… ansehen“ statt „… bearbeiten“ |
| `PatternEditor` | Name, Länge und Tempo als Text nach D8, ohne `editor-actions` und Tastenkürzel; Name des Bereichs „Pattern ansehen“ |
| `Sequencer` | Prop `readOnly`: Zellen `disabled`, Unterteilung als Text nach D8 |

`useDropTargets` bleibt: Ohne Ziehquelle gibt es keine Ablegeziele.

### D4: Sequencer-Zellen als `disabled`

`disabled` sperrt Maus und Tastatur, und `aria-pressed` und `aria-label` bleiben für Screenreader erhalten. Die CSS-Regel `.step:disabled` hebt die globale Deckkraft auf, und die Hover-Regel gilt nur für `:not(:disabled)`.

Alternative: Eigene Darstellung ohne Knöpfe. Sie verdoppelt das Raster und seine Spielweisen-Stile.

### D5: Schloss

Eigene Komponente `LockToggle` mit SVG-Symbol wie `PlusIcon`, am Ende von `.page-title` und `.editor-header`. Der Name wechselt zwischen „Song entsperren“ und „Song sperren“; `aria-pressed` entfällt, weil der Name den Zustand schon nennt. Das Schloss trägt keine Signalfarbe, weil Warmtöne neben „Löschen“ wie eine Warnung wirken: Gesperrt erscheint nur das Symbol in `--muted`, entsperrt das offene Symbol in `--text` auf der Fläche `--control`, wie ein eingeschalteter Modus.

Offene Eingaben übernimmt das vorhandene `onBlur`, weil der Fokus beim Klick auf das Schloss das Feld verlässt. Eine offene Auswahl hebt `useDismiss` beim Klick außerhalb der Struktur auf.

### D6: Bestehende Tests

`notebookWith` entsperrt nach `openSong`, weil seine Aufrufer das Bearbeiten testen. Tests, die anders öffnen und danach bearbeiten, erhalten `store.setLocked(false)` oder einen Klick auf das Schloss. Erwartungen bleiben unverändert. Die Regel in `AGENTS.md` deckt das ab, denn das Entsperren ist eine fachliche Voraussetzung.

### D7: Riegel und Freigabe für Knöpfe

Lesend freigegebene Knöpfe tragen das Attribut `data-read-safe`, unabhängig vom Sperrzustand. Der Hook `useLockGuard` liefert einen `onClickCapture`-Handler für die Wurzelelemente `main.songbook` und `main.workspace`: Bei gesperrtem Song stoppt er jeden Klick auf einen Knopf ohne Attribut. Enter und Leertaste lösen bei Knöpfen ebenfalls einen Klick aus. Song-Liste, App-Kopfzeile und Bestätigungsdialog liegen außerhalb dieser Wurzeln.

D2 bleibt gültig: Der Riegel ist das Sicherheitsnetz, und Bearbeitungselemente werden gesperrt weiterhin nicht gerendert, damit keine toten Knöpfe erscheinen. `disabled`-Zellen des Sequencers lösen keinen Klick aus und brauchen kein Attribut.

Ein Test prüft in beiden gesperrten Ansichten und bei geöffnetem Popover, dass jeder aktive Knopf `data-read-safe` trägt. Ein vergessener Knopf ist also wirkungslos und lässt den Test scheitern.

Alternativen:
- Sperr-Prüfung in jedem Bearbeitungselement: Wer sie vergisst, hat eine Lücke.
- `<fieldset disabled>` oder `inert`: Beide kennen keine Ausnahmen für einzelne Knöpfe.

### D8: Gleicher Platz für Wert und Bedienelement

Die gemeinsame Klasse `value-control` gibt Text und Auswahlliste Höhe, Innenabstand, Rahmen und Schrift vor, `value-length` die Breite der Länge. Der Text hat einen transparenten Rahmen. Die Auswahlliste der Länge zeigt `beatsLabel` wie die der Unterteilung ihren Text; `aria-label` nennt weiter „Länge (Beats)“.

Das Tempo verwendet in beiden Ansichten `TempoMark`, im Pattern-Editor mit dem Zusatz „(Song-Tempo)“ dahinter. Ein eigenes Zahlenfeld im Pattern-Editor entfällt: Das Tempo ist eine feste Eigenschaft des Songs und braucht dort kein dauerhaft sichtbares Feld. `Transport` enthält nur noch die Abspiel-Taste, weil `TempoMark` aus `playback` importiert und der Einbau in `Transport` eine zyklische Abhängigkeit ergäbe.

Beim Bearbeiten bleibt „♩ =“ stehen, und nur die Zahl wird zum Feld. Zahl und Feld teilen die Klasse `tempo-value` mit fester Breite von `3ch` und Ziffern gleicher Breite (`tabular-nums`), weil das Tempo höchstens dreistellig ist. Das Feld hat keine Pfeil-Knöpfe, da sie die Breite sprengen; die Pfeiltasten funktionieren weiter. Den Unterstrich zeichnet beim Bearbeiten das umgebende `.tempo-mark`, sonst käme eine Rahmenzeile hinzu.

Titel und Tempo behalten gesperrt den transparenten unteren Rahmen ihres Knopfs.

`.editor-header` und `.transport` richten mittig statt an der Grundlinie aus. Der Kopf ist in beiden Zuständen einzeilig und gleich hoch, das Schloss bleibt also an seiner Stelle.

Gleiche Höhe der Kopfzeile: `.songbook` und `.workspace` teilen eine Innenabstand-Regel, und `.page-title` erhält den Abstand zum Pfad, den `.page-header` im Pattern-Editor schon setzt.

Alternative: Überall `<select disabled>` und `<input disabled>`. Das ergibt ohne eigene Maße denselben Platz, verletzt aber die Anforderung „keine Eingabefelder“ und zeigte gesperrt Rahmen und Pfeile.

## Risks / Trade-offs

- [Die Kopfzeile bricht entsperrt um, weil `editor-actions` dazukommen] → Bei schmalen Fenstern rückt das Schloss dann in die nächste Zeile. Das ist in der Spec ausgenommen.

- [Der Riegel greift nur bei Knöpfen] → Ziehen von Pattern-Karten, Strg+Z und der Klick auf die Überschrift sind durch eigene Szenarien abgesichert, Eingabefelder und Auswahllisten zusätzlich durch die Prüfung auf ihr Fehlen in `songLock.test.tsx`.
- [Ein Knopf wird fälschlich freigegeben] → Die Freigabe steht im Code sichtbar am Knopf, und die Spec nennt abschließend, was freigegeben sein darf.
- [Gesperrte, volle Sequencer-Zellen lassen sich mit bearbeitbaren verwechseln] → Das Schloss steht in derselben Ansicht, und der Mauszeiger bleibt durch `button:disabled` auf `default`.
- [Ein Nutzer sperrt einen leeren Song von Hand] → Die Seite zeigt dann keine Aktion, das Schloss bleibt aber sichtbar.
