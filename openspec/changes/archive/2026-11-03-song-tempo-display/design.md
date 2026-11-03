# Design

## Context

Das Tempo ist ein Pflichtfeld am Song (`Song.tempo`, 30–300, Vorgabe 120) und wird über `store.updateSong((s) => setTempo(s, bpm))` geändert; `setTempo` gibt bei ungültigem oder gleichem Wert dieselbe Referenz zurück, dann entsteht keine Revision. Eingestellt wird es bisher nur in `TempoField` (`src/ui/playback.tsx`) im Kopf des Pattern-Editors. Der Kopf der Doppelseite (`SongHeader` in `src/ui/Songbook.tsx`) zeigt Breadcrumbs, den Titel als `EditableHeading` (Klick → Eingabefeld, Enter/Verlassen übernimmt, Escape verwirft) und „Song löschen“. Die Regel „Leseansicht ohne Bedienelemente“ betrifft nur die linke Seite, nicht diesen Kopf.

## Goals / Non-Goals

**Goals:**
- Tempo auf Song-Ebene sichtbar und dort bearbeitbar, mit demselben Bedienmuster wie der Titel daneben.
- Eine Übernahme-Logik für beide Stellen, damit Ablehnung und Anzeige des gespeicherten Werts identisch sind.

**Non-Goals:**
- `EditableHeading` verallgemeinern: Sie ist eine `h2` für Text; die Tempoangabe ist kein Titel und braucht ein Zahlenfeld. Die gemeinsame Logik (Klick → Feld, Enter/Verlassen/Escape) ist kurz genug, um sie in der neuen Komponente nachzubilden.

## Decisions

### D1: Hook `useSongTempo()`

In `src/ui/playback.tsx` neben `TempoField`: liefert `{ tempo, title, commit(bpm): number }` für den geöffneten Song. `commit` ruft `store.updateSong((s) => setTempo(s, bpm))` und gibt das danach gespeicherte Tempo zurück. `Transport` nutzt ihn statt der bisherigen eigenen `commitTempo`-Funktion; die neue Tempoangabe ebenso.

### D2: Komponente `TempoMark` (`src/ui/TempoMark.tsx`)

- **Anzeige:** `<button className="tempo-mark">♩ = 120</button>` mit zugänglichem Namen „Song-Tempo: 120 BPM“ (`aria-label`), weil Screenreader „♩“ uneinheitlich oder gar nicht vorlesen. `title` „Zum Ändern klicken“ wie bei der Überschrift.
- **Bearbeiten:** Klick → `<input type="number" aria-label="Song-Tempo (BPM)" min max step=1>` mit dem aktuellen Wert, fokussiert und markiert. Enter und Verlassen übernehmen über `commit` (leere Eingabe zählt als ungültig), Escape verwirft (Flag wie in `EditableHeading`, weil Escape über `blur` endet).
- **Ort:** in `.page-title` von `SongHeader` direkt nach dem Titel, vor „Song löschen“ (das per `margin-left: auto` rechts bleibt).
- **Aussehen:** Schrift wie Fließtext, Farbe `--muted`, gestrichelte Unterstreichung bei Hover wie `.heading-edit`; keine neuen Farbtokens.

### D3: Kennzeichnung im Pattern-Editor

`TempoField` bekommt die Beschriftung „Song-Tempo (BPM)“ und einen Hinweis `<span className="hint" id=…>gilt für alle Patterns von „<Titel>“</span>`, der über `aria-describedby` am Feld hängt. Die `id` kommt aus `useId()`. Der Hinweis steht unter Beschriftung und Feld, außerhalb des `<label>` (sonst würde er Teil des zugänglichen Namens), in einem gemeinsamen Spalten-Container `.tempo-field`; so wird die Kopfzeile des Editors nicht breiter.

## Risks / Trade-offs

- [„♩“ fehlt in einer Schrift] → Das Zeichen (U+2669) ist in den gängigen Systemschriften enthalten; im schlimmsten Fall greift die Ersatzschrift des Browsers. Der zugängliche Name hängt nicht davon ab.
- [Zwei Stellen zum Ändern desselben Werts] → gewollt; beide lesen denselben Song-Wert und aktualisieren sich gegenseitig über den Store, die Beschriftung macht die Zugehörigkeit klar.

## Prüfung im Browser

Release-Build von artjom im Browser geprüft (2026-11-03): Tempoangabe auf der Doppelseite, Bearbeiten per Klick/Enter/Escape, Beschriftung und Hinweis im Pattern-Editor ohne Beanstandung.
