# Design

## Context

- **Struktur:** `resolveSong(song)` in `src/domain/timeline.ts` liefert je Takt die globale Startposition in Beats, den Groove mit Fortlauf-Offset, die Fill-Abschnitte (`from`, `to`, `fillOffset`) und die Akzente. Die Doppelseite nutzt das bereits für die Darstellung.
- **Wiedergabe heute:** `createScheduler` in `src/audio/scheduler.ts` plant mit Lookahead. Bei jedem Schritt liest er `source.pattern()` und `source.tempo()` und rechnet selbst `patternHits`/`patternSteps`. Er spielt immer in Schleife. Der Zustand `{ playing, step }` ändert sich nur, wenn eine neue Rasterposition erreicht wird. `usePlayback` im Pattern-Editor abonniert diesen Zustand, und jede Änderung rendert den ganzen Editor samt VexFlow neu.
- **Doppelseite:** `layoutStructure` ordnet die Takte in Zeilen an. `StructureRow` setzt Takte mit `place(x, width)` in Beat-Einheiten (`--beat`), die Rahmen sind `button.bar-frame[data-bar-id]`. Ein Klick außerhalb von Struktur und Popover hebt die Auswahl auf (`useDismiss`).

## Goals / Non-Goals

**Goals:**
- Scheduler und Stimmen unverändert in ihrer Klangerzeugung. Sie bekommen eine allgemeine Quelle, die Pattern oder Song sein kann.
- Song-Zeitplan als reine Funktion in `domain`, testbar ohne Audio.
- Flüssige Linie ohne Re-Render großer Komponenten pro Frame.

**Non-Goals:**
- Wiederholungszeichen, Sprünge, Vorzähler.
- Optimierung über ein einfaches Zwischenspeichern hinaus; Songs haben selten mehr als einige hundert Takte.

## Decisions

### D1: Allgemeine Quelle für den Scheduler

```ts
interface Timeline<M> {
  length: number;                       // Beats
  hits: PlaybackHit[];                  // at relativ zum Anfang der Quelle
  marks: { at: number; mark: M }[];     // Positionen, die der Zustand melden soll
}
interface PlaybackSource<M = unknown> {
  timeline(): Timeline<M> | null;       // null: Quelle gibt es nicht mehr -> Wiedergabe endet
  tempo(): number;
  loop: boolean;
}
```

- **Pattern-Quelle:** `{ length: beats.length, hits: patternHits(p), marks: patternSteps(p) → mark = { beat, position } }`, `loop: true`. Das Verhalten bleibt wie bisher. Die bestehenden Scheduler-Tests ändern nur, wie sie die Quelle bauen.
- **Einmal-Modus (`loop: false`):** Erreicht der Planungs-Cursor `length`, plant der Scheduler nichts mehr und merkt sich die Audiozeit des Endes. Die Frame-Schleife beendet die Wiedergabe, sobald diese Zeit erreicht ist (Zustand `IDLE`, Stimmen nicht stummschalten, der letzte Schlag klingt aus).
- **Quelle weg:** Liefert `timeline()` `null`, ruft der Scheduler `stop()` auf.
- **Zustand:** `{ playing, mark }` statt `{ playing, step }`; `mark` ist der zuletzt erreichte Eintrag aus `marks`. Für Patterns ist das die Rasterposition wie bisher, für Songs die ID des laufenden Takts. Damit ändert sich der Zustand im Song nur einmal pro Takt.
- **Fortlaufende Position:** `getPosition(): number | null` liefert die Position in Beats ab Quellenanfang zur aktuellen Audiozeit. Der Scheduler merkt sich dafür bei jedem Planungsabschnitt einen Anker `(Audiozeit, Beat, Sekunden pro Beat)` und rechnet vom letzten erreichten Anker linear weiter. Das deckt Tempowechsel und den Sprung an den Schleifenanfang ab. `getPosition` löst **keine** Benachrichtigung aus; wer die Linie zeichnet, fragt selbst pro Frame ab.

`Player` reicht `getPosition` durch; `usePlayback` des Pattern-Editors bleibt bis auf den Typ von `step` → `mark` gleich.

### D2: Song-Zeitplan (`src/domain/playback.ts`)

```ts
interface SongRange { from: string; to: string | 'end' }   // Takt-IDs
songTimeline(song: Song, range: SongRange): Timeline<string> | null
```

- `resolveSong(song)` und daraus die Takte von `from` bis `to` (bzw. bis zum letzten Takt). Fehlt `from` oder `to`, ist das Ergebnis `null` (D1: Wiedergabe endet). `'end'` bleibt dynamisch: Takte, die während „ab hier“ am Songende angefügt werden, spielen mit.
- Für jeden Beat `i` eines Takts gilt: Liegt `i` in einem Fill-Abschnitt, spielt Beat `fillOffset + (i − from)` des Fills, sonst Beat `(offset + i) mod Länge` des Grooves, sonst nichts. Die Schläge eines Beats erzeugt dieselbe Hilfsfunktion wie bei `patternHits` (aus ihr herausgezogen), damit Spielweisen, Pegel und Flams identisch sind.
- Akzente: `at = Taktstart + beat + position / 4`, Pegel 1. Liegt an genau dieser Stelle schon ein Schlag desselben Instruments, entfällt der Akzent, damit er nicht doppelt laut klingt.
- `marks`: je Takt `{ at: Taktstart, mark: barId }`.
- `at` ist relativ zum Bereichsanfang; `length` ist die Summe der Taktlängen im Bereich.
- **Zwischenspeicher:** Der Scheduler ruft `timeline()` alle 25 ms auf. `songTimeline` merkt sich das letzte Ergebnis zu (Song-Objekt, Bereich) und rechnet nur neu, wenn sich die Song-Referenz ändert. Jede Änderung über den Store erzeugt ein neues Song-Objekt, Live-Änderungen werden also erkannt.

### D3: Starten auf der Doppelseite

`useSongPlayback()` in `src/ui/playback.tsx` liefert `{ available, playing, barId, start(range, loop), stop }`. Die Quelle liest den Song über `store.getState()` bei jedem Aufruf. Den React-Stand braucht sie nicht, damit Änderungen sofort greifen.

| Auslöser | Bereich | Schleife |
|---|---|---|
| Kopf „Song abspielen“ | erster Takt bis `'end'` | nein |
| Takt-Popover „Ab hier abspielen“ | erster ausgewählter Takt (Songreihenfolge) bis `'end'` | nein |
| Segment-Popover „Ab hier abspielen“ | erster Takt des Segments bis `'end'` | nein |
| Takt-Popover „In Schleife abspielen“ | erster bis letzter ausgewählter Takt | ja |
| Segment-Popover „In Schleife abspielen“ | erster bis letzter Takt des Segments | ja |

Die IDs werden beim Start ermittelt und stehen dann fest (Anforderung „Bereich beim Start festgehalten“). Die Kopftaste heißt bei laufender Wiedergabe „Stopp“ und sitzt neben `TempoMark`. Die Popover-Aktionen stehen in einer eigenen Gruppe am Ende des Popovers. Die Auswahl bleibt nach dem Start bestehen, das Popover offen.

`Songbook` stoppt beim Unmount (Ansichtswechsel), wie `usePlayback` im Pattern-Editor.

### D4: Wiedergabeposition

- **Takt hervorheben:** `StructureRow` bekommt die ID des laufenden Takts (`mark` aus dem Zustand, ändert sich einmal pro Takt). Der Rahmen erhält die Klasse `playing`. Das Aussehen kommt aus einem neuen Token `--playhead` (schon vorhanden, `--ctp-blue`): dünner Rand und leicht getönte Fläche, abgesetzt von Auswahl (`aria-pressed`) und Ablegeziel.
- **Linie:** Die Komponente `PlayheadLine` steht nur in der Zeile des laufenden Takts. Sie läuft in einer eigenen `requestAnimationFrame`-Schleife, liest `player.getPosition()` und setzt `left` direkt per Ref (`calc(var(--beat) * x)`, mit `x = Takt.x + (Position − Taktstart im Bereich)`). Kein React-Render pro Frame. Die Linie ist `aria-hidden`.
- **Taktanfang für die Linie:** `getPosition()` zählt ab Bereichsanfang, die UI kennt den Bereich nach dem Start aber nicht mehr. `useSongPlayback().start` merkt sich den Bereich deshalb je Player (`WeakMap<Player, SongRange>` in `playback.tsx`); die Linie holt den Anfang ihres Takts aus der Marke im (zwischengespeicherten) `songTimeline` desselben Bereichs. Nachtrag aus der Umsetzung.
- **Mitscrollen:** Wechselt der laufende Takt, ruft `StructurePage` für dessen Rahmen `scrollIntoView({ block: 'nearest', behavior: 'smooth' })` auf. jsdom kennt die Methode nicht; `src/test/setup.ts` ergänzt sie als leere Funktion. `nearest` scrollt nur, wenn der Takt nicht ohnehin sichtbar ist.

## Risks / Trade-offs

- [Neuberechnung des Song-Zeitplans bei jeder Änderung] → Der Zwischenspeicher (D2) rechnet nur bei einem neuen Song-Objekt; `resolveSong` ist linear in der Zahl der Takte.
- [Akzent und Groove-Schlag desselben Instruments zur selben Zeit] → Der Akzent entfällt (D2). Ein Akzent soll hörbar sein, ohne doppelt laut zu klingen.
- [`scrollIntoView` während der Nutzer selbst scrollt] → `nearest` greift nur am Taktwechsel und nur, wenn der Takt unsichtbar ist. Das ist bewusst einfach gehalten.
- [Schleifenbereich über Segmentgrenzen mit Fill von rechts] → Ein Fill, der aus einem Takt außerhalb des Bereichs nach links in den Bereich reicht, spielt mit, weil `resolveSong` die ganze Struktur auflöst. Das ist erwünscht: Der Abschnitt klingt wie im Song.
- [Anzeige über `--playhead` in Hell und Dunkel] → im Browser prüfen.

## Browserprüfung

Vom Nutzer im Browser geprüft (Task 5.2): Song-Wiedergabe, „Ab hier“, Schleife, Live-Änderungen, Linie und Mitscrollen, Stopp beim Öffnen eines Patterns sowie Hell- und Dunkelmodus funktionieren wie beschrieben.
