# Design

## Context

Der Pattern-Editor (`src/ui/PatternEditor.tsx`) zeigt Sequencer und Notenvorschau des geöffneten Patterns; jede Änderung läuft über `store.update` bzw. `store.updateSong`, die bei unverändertem Ergebnis (gleiche Referenz) keine Revision erzeugen. Ein Pattern besteht aus `beats: Beat[]`, jeder Beat hat eine eigene Unterteilung (2, 4, 3, 6) und 0-basierte Positionen je Instrument, dazu optionale Spielweisen (Flam, Ghost) für Snare und Toms. Ein Tempo gibt es bisher nirgends. Im Projekt gibt es weder Audio-Code noch eine Audio-Abhängigkeit; jsdom kennt kein `AudioContext`. Motivation siehe proposal.md.

## Goals / Non-Goals

**Goals:**
- Sample-genaue Wiedergabe über die Audio-Uhr, unabhängig von Render- und Timer-Jitter.
- Zeitplan, Tempo-Regeln und Abspiel-Logik ohne Browser-APIs testbar; Web Audio nur hinter einer kleinen Schnittstelle.
- Live-Änderungen ohne Neustart: Der Abspieler liest Pattern und Tempo bei jedem Planungsschritt neu.

**Non-Goals:**
- Audio-Bibliothek (Tone.js o. ä.): Zehn synthetisierte Stimmen und ein Lookahead-Scheduler sind überschaubar.
- Wiedergabe der Song-Struktur; der Abspieler ist aber so geschnitten, dass er später eine andere Ereignisquelle bekommen kann.
- Klangtreue wie mit Samples; Ziel ist Unterscheidbarkeit (Drumcomputer-Charakter).

## Decisions

### D1: Tempo als Pflichtfeld am Song

`Song.tempo: number` (ganzzahlig, 30–300). `DEFAULT_TEMPO = 120`, `MIN_TEMPO`, `MAX_TEMPO` in `types.ts`. `setTempo(song, bpm): Song` in `src/domain/playback.ts` gibt bei ungültigem oder gleichem Wert dieselbe Referenz zurück; damit greift die bestehende Regel in `commitSong` (keine Revision ohne Änderung). Die UI ruft `store.updateSong((s) => setTempo(s, bpm))`.

Ergänzt wird das Tempo an allen Eingängen: `createSong`, `songFromV1Patterns`, Import ohne Tempo (`tempo: 120`) und `repository.loadAll` (fehlendes Feld → 120, ohne Revision, ohne Rückschreiben; geschrieben wird erst bei der nächsten echten Änderung).

Alternative: `tempo?: number` mit Vorgabe beim Lesen. Verworfen: Jede Lesestelle bräuchte die Vorgabe, und der Export müsste entweder das Feld weglassen (Spec verlangt es) oder beim Rundlauf ein anderes Objekt liefern. Pflichtfeld + Normalisierung an den Eingängen hält das Modell eindeutig.

Das Tempo ist kein Teil der Undo-Historie des Pattern-Editors (diese gilt dem Pattern-Inhalt).

### D2: Additive Formaterweiterung ohne neue Schemaversion

`tempo` kommt als optionales Feld ins Song-Schema (`z.number().int().min(30).max(300).optional()`), beim Parsen wird ein fehlendes Tempo mit 120 ergänzt. `SCHEMA_VERSION` bleibt 3; das Schema für v2/v3 ist dasselbe. Der Export schreibt das Tempo immer.

Zusätzlich verlieren alle Objekt-Schemata `.strict()`: zod entfernt unbekannte Schlüssel dann stillschweigend (`z.object` strippt standardmäßig). Inhaltliche Prüfungen (Wertebereiche, Positionen im Raster, Spielweise ohne Schlag, Hi-Hat-Ausschluss, Pattern-Verweise) bleiben unverändert streng.

**Regel ab jetzt** (wird in `AGENTS.md` festgehalten): Ein neues Feld, das eine ältere Version gefahrlos übergehen kann, wird optional mit Vorgabe eingeführt, ohne neue Schemaversion. Die Schemaversion steigt nur, wenn eine ältere Version die Datei sonst falsch verstünde (Bedeutung eines Felds ändert sich, Pflichtfeld entfällt, Struktur wird umgebaut).

Alternativen:
- Schemaversion 4 mit striktem Schema (erster Entwurf): Jede Erweiterung macht neue Exporte für alle älteren Versionen unlesbar, auch wenn sie das Feld einfach ignorieren könnten.
- Unbekannte Felder aufbewahren und beim Export wieder ausgeben (`passthrough`): bewahrt Daten neuerer Versionen beim Rundlauf durch eine ältere, erzeugt aber ungeprüfte Inhalte im lokalen Speicher und im Merge. Verworfen; siehe Risiken.

### D3: Zeitplan als reine Funktion (`src/domain/playback.ts`)

```ts
interface PlaybackHit {
  at: number;            // Beats ab Pattern-Anfang: b + position / subdivision
  instrument: Instrument;
  gain: number;          // normal 1, Ghost GHOST_GAIN (0.3)
  step: { beat: number; position: number };
  graceBefore?: number;  // Flam: Vorschlag FLAM_GRACE_SECONDS (0.03 s) vorher, Lautstärke FLAM_GRACE_GAIN (0.4)
}
patternHits(pattern): PlaybackHit[]                 // sortiert nach at
patternSteps(pattern): { at; beat; position }[]     // alle Rasterpositionen, für die Wiedergabeposition
```

Der Flam-Abstand ist in Sekunden fest, nicht in Beats: Ein Flam klingt bei jedem Tempo gleich eng. Das Abstoppen der offenen Hi-Hat ist keine Ereignisregel, sondern Sache der Stimmen (D5).

### D4: Abspieler mit Lookahead (`src/audio/scheduler.ts`)

Klassisches Muster „Uhr der Audio-Hardware + JS-Timer zum Vorausplanen“:

- Ein Timer (25 ms) plant alle Ereignisse bis `now + LOOKAHEAD` (0,1 s) über `voice.trigger(instrument, time, gain)`.
- Zustand: `cursorTime` (Audiozeit, bis zu der geplant ist) und `cursorBeat` (Beat-Position im Durchlauf dazu). Je Tick werden Pattern und Tempo **neu gelesen** (`source.pattern()`, `source.tempo()`), das Intervall `[cursorBeat, cursorBeat + Δt·tempo/60)` gegen `patternHits` geprüft, mit Umbruch am Pattern-Ende (Länge = `beats.length`). Damit sind Änderungen am Pattern und am Tempo ab dem nächsten noch nicht geplanten Ereignis wirksam.
- Ist das Pattern gekürzt worden und `cursorBeat >= length`, bleibt der Rest des wegfallenden Beats stumm und Beat 1 beginnt auf dem nächsten Grundschlag (`cursorBeat` wird negativ, z. B. 3,4 → −0,6). So bleibt der Puls erhalten (Spec: „setzt ohne Unterbrechung mit Beat 1 fort“); ein sofortiger Sprung mitten im Beat würde das Raster verschieben.
- `stop()` ruft `voices.silence()`: Bereits an die Audio-Uhr übergebene Schläge (bis 0,1 s) werden vom Ausgang getrennt, damit nach dem Stopp nichts mehr erklingt.
- Für die Wiedergabeposition werden geplante Schritte (`patternSteps`) mit Audiozeit in eine Warteschlange gelegt; eine `requestAnimationFrame`-Schleife meldet den jeweils letzten Schritt mit `time <= now` an Abonnenten.
- Uhr, Timer und Frame-Schleife werden injiziert (`clock: () => number`, `setInterval`/`clearInterval`, `requestFrame`), damit Tests mit einer künstlichen Uhr deterministisch laufen.

Alternative: jeden Schlag per `setTimeout` auslösen. Verworfen: Timer-Jitter von 10–50 ms ist bei Sechzehnteln hörbar.

### D5: Synthetisierte Stimmen (`src/audio/voices.ts`)

Je Instrument eine Rezeptur aus Web-Audio-Knoten, Parameter in einer Tabelle (damit Unterscheidbarkeit testbar ist):

| Instrument | Klang |
|---|---|
| Bassdrum | Sinus mit Tonhöhenabfall ~150 → 50 Hz, ~0,4 s |
| Snare | Rauschen (Bandpass ~1,8 kHz) + Dreieck ~185 Hz, ~0,2 s |
| Tom 1 / Tom 2 / Standtom | Sinus mit kurzem Abfall, Grundton ~220 / ~165 / ~110 Hz |
| Hi-Hat geschlossen | Rauschen Hochpass ~7 kHz, ~0,05 s |
| Hi-Hat offen | wie geschlossen, ~0,5 s |
| Hi-Hat-Pedal | Rauschen Hochpass ~6 kHz, leiser, ~0,04 s |
| Ride | Rechteck-Gemisch (metallisch) + Rauschen Bandpass ~5 kHz, ~1 s |
| Crash | Rauschen Hochpass ~4 kHz, ~1,5 s |

Rauschen kommt aus einem einmal erzeugten `AudioBuffer`. Alle Stimmen laufen über einen gemeinsamen Ausgangspegel gegen Übersteuerung. **Abstoppen:** Die Stimme merkt sich den Gain-Knoten der zuletzt ausgelösten offenen Hi-Hat; `trigger('hihat' | 'hihatPedal', t)` setzt dessen Gain ab `t` in ~10 ms auf 0.

### D6: Player-Schnittstelle und Einbindung in die UI

```ts
interface Player {
  readonly available: boolean;
  start(source: { pattern(): Pattern; tempo(): number }): void;
  stop(): void;
  subscribe(listener: (state: { playing: boolean; step: { beat: number; position: number } | null }) => void): () => void;
}
```

- `createWebAudioPlayer()` in `src/audio/player.ts` erzeugt den `AudioContext` erst beim ersten `start` (Autoplay-Regeln: nur nach Nutzeraktion) und ruft `resume()`. Ohne `window.AudioContext` ist `available = false`.
- `App` bekommt eine optionale Prop `player` (Vorgabe: `createWebAudioPlayer()`), über einen `PlayerContext` bereitgestellt. Tests übergeben einen nachgebildeten Player bzw. betreiben den Scheduler mit einer künstlichen Uhr und aufzeichnenden Stimmen.
- Hook `usePlayback(pattern, tempo)` hält Pattern und Tempo in Refs, damit `source.pattern()`/`tempo()` immer den aktuellen Stand liefern; beim Unmount und beim Wechsel der Pattern-ID ruft er `stop()`.
- Neue Komponente `Transport` im Kopf des Pattern-Editors: Taste („Abspielen“/„Stopp“; der Name zeigt den Zustand, daher kein zusätzliches `aria-pressed`) und Tempo-Feld (Zahl, übernimmt bei Verlassen/Enter wie `CommitField`, zeigt danach den tatsächlich gespeicherten Wert). Ist der Player nicht verfügbar: Taste deaktiviert, Hinweistext daneben.
- `Sequencer` bekommt `playhead?: { beat; position } | null`; die Zellen dieser Spalte erhalten die Klasse `playing`. Neues Token `--playhead` in `styles.css` (verweist auf ein `--ctp-*`, nicht `red`); die Farbregel in `styles.test.ts` bleibt erfüllt.

### D7: Verzeichnis `src/audio`

Neues Modul neben `notation`; einzige Stelle mit Web-Audio-APIs. `domain` bleibt frei von Browser-APIs. `AGENTS.md` (Aufbau unter `src/`) wird um `audio` ergänzt.

## Risks / Trade-offs

- [Änderungen innerhalb der nächsten 0,1 s sind schon geplant und erklingen noch im alten Stand] → Lookahead klein halten (0,1 s); ein bereits geplanter Schlag wird nicht zurückgenommen. Für die Spec-Szenarien (Änderung vor Erreichen der Stelle) ausreichend.
- [Hintergrund-Tabs drosseln Timer auf ≥1 s] → Wiedergabe kann im Hintergrund stocken; bewusst hingenommen, das Pattern wird im Vordergrund bearbeitet.
- [Synthese klingt künstlich] → bewusste Wahl (Proposal); die Stimmen sind austauschbar, Samples wären später eine andere `voices`-Implementierung.
- [Klang ist automatisch nur eingeschränkt prüfbar] → Tests prüfen Zeitpunkte, Pegel, Tonhöhenreihenfolge und Abstoppen über einen aufzeichnenden Fake-`AudioContext`; der Höreindruck wird manuell im Browser geprüft und hier festgehalten.
- [Die heute ausgelieferte Version ist noch strikt und weist Exporte mit `tempo` als „beschädigt“ ab] → einmalig, betrifft nur den Import neuer Dateien in die alte Version; derzeit gibt es keine gespeicherten Daten. Ab dieser Version gilt D2.
- [Eine ältere Version verwirft beim Import Felder, die sie nicht kennt; exportiert sie den Song danach erneut, fehlen sie] → bewusst hingenommen (D2, Alternative `passthrough`). Bei gleicher Revision bleibt die neuere Fassung erhalten; nur eine in der alten Version weiterbearbeitete Fassung verliert das Feld.
- [Tippfehler in Feldnamen einer Importdatei werden nicht mehr gemeldet] → Dateien werden von der App erzeugt, nicht von Hand; Pflichtfelder fehlen dann weiterhin auffällig.

## Migration Plan

Keine IndexedDB-Migration: Songs ohne Tempo werden beim Laden ergänzt (D1). Rücksprung auf die Vorversion: lokal gespeicherte Songs mit `tempo` werden von der alten Version weiterhin geladen (IndexedDB wird nicht gegen das Schema geprüft); Exporte der neuen Version kann sie wegen ihres strikten Schemas nicht importieren (einmalig, siehe Risiken).

## Prüfung im Browser

Release-Build von artjom im Browser geprüft (2026-11-03): Wiedergabe, Klänge, Änderungen während der Wiedergabe und Wiedergabeposition ohne Beanstandung.
