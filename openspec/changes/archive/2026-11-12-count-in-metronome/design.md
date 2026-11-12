# Design

## Context

Der Scheduler (`src/audio/scheduler.ts`) plant in Schritten von 25 ms bis 0,12 s voraus und liest dabei `timeline()` und `tempo()` der Quelle neu; die Planung beginnt bei Beat 0. Ein Beat ist immer eine Viertel (`song-meter`), Takte haben ganze Beat-Zahlen. Die Song-Timeline setzt ihre Marken auf die Taktanfänge; die Pattern-Timeline kennt keine Taktart. `Voices` sind Drum-Stimmen (Synth, Aufnahmen, Umschalter), getrennt nach `Instrument`. `PracticeStore` hält das Übetempo je Song im Gerätespeicher und den Schalter des Übetempos je Song bis zum Neuladen. Die Übe-Box (`PracticeControl`) wird als Ganzes hervorgehoben, wenn der Schalter an ist. Symbole und Aussehen sind im Mock-up aus der Exploration abgestimmt (Runde 6: Metronom „M5“, Einzählen „L“).

## Goals / Non-Goals

**Goals:**
- Klicks mit derselben Audio-Uhr und Planung wie die Schläge, damit sie genau auf dem Beat liegen.
- Einzählen ohne Sonderfall in Anzeige und Position: Die Quelle beginnt erst nach dem Einzählen.

**Non-Goals:**
- Eigene Lautstärke oder Klangwahl für den Klick.
- Unterteilte Klicks (Achtel, Triolen) und andere Betonungsmuster.
- Sichtbares Zählen während des Einzählens.

## Decisions

### D1: Taktanfänge im Zeitplan
`Timeline` erhält `downbeats: number[]`, die Beat-Positionen der Taktanfänge ab Quellenanfang. `songTimeline` setzt sie auf die Anfänge der Takte des Bereichs (dieselben Stellen wie die Marken). `patternTimeline(pattern, meter)` erhält die wirksame Taktart und setzt `0, meter, 2·meter …` unterhalb der Länge. Die Länge des Einzählens ergibt sich daraus: im Song der Abstand vom ersten zum zweiten Taktanfang bzw. die Länge, im Pattern die Taktart.

Alternative: Betonung im Scheduler aus den Marken ableiten. Verworfen, weil Pattern-Marken Rasterpositionen sind und der Scheduler die Bedeutung der Marken nicht kennt.

### D2: Quelle mit Metronom und Einzählen
`PlaybackSource` erhält `metronome(): boolean`, je Planungsschritt gelesen wie `tempo()`, und `countIn: number`, die Beats des Einzählens, beim Start fest (0: kein Einzählen). `usePlayback` und `useSongPlayback` lesen beides aus dem `PracticeStore` für die beim Start feste Song-ID; die Länge des Einzählens berechnen sie beim Start aus Timeline bzw. `patternMeter`.

### D3: Einzählen und Klicks im Scheduler
- Beim Start beginnt `cursorBeat` bei `-countIn`. Im negativen Bereich plant der Scheduler nur Klicks auf den ganzen Beats, den bei `-countIn` betont, unabhängig von `metronome()`. Schläge und Marken liegen erst ab Beat 0; Planung, Tempo-Wechsel und Anker laufen unverändert über die Grenze. `getPosition` begrenzt schon auf 0, die Marke bleibt bis Beat 0 `null`, und `playing` ist ab dem Start `true`.
- Ab Beat 0 plant er bei `metronome()` einen Klick auf jedem ganzen Beat im Planungsfenster, betont, wenn er in `downbeats` liegt. Ein Merker hält fest, ob das Metronom klickt: Liefert `metronome()` `false`, endet es sofort; wird es `true`, beginnt es erst am nächsten Taktanfang (auch dem Anfang des nächsten Schleifendurchlaufs). Beim Start klickt es ab Beat 0, der immer ein Taktanfang ist.
- Am Ende einer Schleife geht es mit Beat 0 weiter, nicht mit `-countIn`; `setLoop` bleibt unverändert.

Alternative: Einzählen als eigene Timeline vor dem Bereich. Verworfen, weil Marken, Position und Länge des Bereichs sich dann verschöben und die Schleife den Vorlauf herausrechnen müsste.

### D4: Eigene Klick-Stimme
Neues Interface `Click { click(time, accented): void; silence(): void }`, das der Scheduler neben `Voices` erhält. `createClick(ctx)` in `src/audio/click.ts` erzeugt einen kurzen Sinuston, betont höher und lauter (1760 Hz, Pegel 0,8; unbetont 1320 Hz, 0,6), mit 20 ms Zeitkonstante beim Abklingen. Gemessen in den ersten 100 ms liegt die Energie des unbetonten Klicks damit etwa bei der von Snare und Kick des DRSKit; ein kürzerer, leiserer Klick ging neben den Schlägen unter. Er läuft über einen eigenen Ausgang wie bei den Aufnahmen, damit `silence()` geplante Klicks beim Stopp verstummen lässt. `player.ts` erzeugt ihn neben den Stimmen, unabhängig von der Klangwahl.

Alternative: Klick als weiteres `Instrument`. Verworfen: `Instrument` gehört zum Datenmodell und Dateiformat, und der Klick hängt nicht an der Klangwahl.

### D5: Schalter im Store
`PracticeStore` erhält `metronome(songId)`, `setMetronome(songId, on)`, `countIn(songId)`, `setCountIn(songId, on)`, gehalten wie `enabled` nur im Speicher des Stores, mit derselben Benachrichtigung.

### D6: Knöpfe und Aussehen
- Der Schalter des Übetempos heißt „Tempo“ (sichtbarer Text und zugänglicher Name), damit die Box aus „Tempo“, „Metronom“ und „Einzählen“ besteht; die Box trägt keine eigene Überschrift.
- `PracticeControl`: Der Teil aus Schalter, −/+ und Übetempo erhält die bisherige Hervorhebung (`.practice-tempo`, an: Fläche aus `--playhead`, Schrift `--text`); der Rahmen der Box bleibt `--border`. Danach zwei Knöpfe mit `aria-pressed`, `aria-label`, `title` und `data-read-safe`. Gedrückt: dieselbe Fläche wie „Tempo“ an, Symbol `--text`; sonst Symbol `--muted`.
- `MetronomeIcon` und `CountInIcon` in `src/ui/icons.tsx` mit den Pfaden aus dem Mock-up: Metronom im Strich-Stil (offenes Gehäuse, rechte Seite auf einer Achse mit Lücke, Zeiger von der Mitte unten mit Kugel), Einzählen gefüllt (großer und drei kleine Punkte, kantiger Taktstrich wie `MeterIcon`, Raster 16×15).
- Die Regel für schmale Bildschirme blendet weiter nur −/+ aus.
- Es entstehen keine neuen Paare aus Schrift und Fläche; die Tabelle in `designSystem.test.ts` deckt `--text` auf der Fläche von „Tempo“ und `--muted` auf `--bg` bereits ab.

## Risks / Trade-offs

- [Umschalten des Metronoms wirkt erst nach dem bereits geplanten Fenster] → höchstens 0,12 s, kürzer als ein Beat bis 500 BPM; Ausschalten „ab dem nächsten Beat“ bleibt erfüllt.
- [Kopf auf dem Smartphone wird zwei Knöpfe breiter] → im Browser bei schmaler Breite prüfen.
- [Einzählen im Pattern-Editor nach der Taktart, auch bei kürzeren Fills] → bewusst: ein Takt bleibt ein Takt, wie zuvor festgelegt.
