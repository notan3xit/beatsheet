# Design

## Context

Der Scheduler (`src/audio/scheduler.ts`) liest bei jedem Planungsschritt `timeline()` und `tempo()` der Quelle neu; `loop` ist ein fester Wert. Im Einmal-Modus setzt er beim Planen des letzten Schlags `endTime` und plant danach nichts mehr. `usePlayback` (Pattern) und `useSongPlayback` (Song, auch aus den Overlays) in `src/ui/playback.tsx` bauen die Quelle; das Tempo ist dort das Song-Tempo. Geräte-Einstellungen (Theme, Klang) liegen über `createDeviceSetting` im `localStorage`, das aber nur einen Wert aus einer festen Auswahl kennt. Im gesperrten Song wirken nur Knöpfe mit `data-read-safe` (`src/ui/lock.tsx`). Das Mock-up aus der Exploration ist Vorlage für Aussehen und Bedienung.

## Goals / Non-Goals

**Goals:**
- Eine Transport-Komponente für beide Köpfe statt zweier eigener Varianten.
- Übetempo ohne jede Berührung des Song-Dokuments.

**Non-Goals:**
- Tastenkürzel.
- Abgleich des Übetempos zwischen Geräten.
- Neue Anordnung der Kopf-Steuerelemente für kleine Bildschirme über das Ausblenden von −/+ hinaus.
- Aufräumen gespeicherter Übetempi gelöschter Songs.

## Decisions

### D1: Modus im Scheduler umschaltbar
`Scheduler` und `Player` erhalten `setLoop(loop)`, `PlaybackState` erhält `loop`. `setLoop` ändert den Modus der laufenden Quelle und benachrichtigt. Ist im Einmal-Modus das Ende schon geplant (`endTime` gesetzt) und kommt `setLoop(true)` vor Erreichen von `endTime`, setzt der Scheduler das Planen an `endTime` mit Beat 0 fort und verwirft `endTime`. `setLoop(false)` lässt die Planung weiterlaufen; das Ende ergibt sich beim nächsten Erreichen der Bereichslänge.

Alternative: `loop` als Funktion der Quelle wie `tempo()`. Verworfen, weil die Köpfe den Modus anzeigen müssen und ihn dann aus dem Zustand des Players lesen statt aus einer eigenen Quelle.

### D2: Tempo der Wiedergabe
Die Quellen in `usePlayback` und `useSongPlayback` lesen das Tempo über eine gemeinsame Funktion: bei eingeschaltetem „Üben“ das Übetempo des Songs, sonst das Song-Tempo. Weil der Scheduler `tempo()` je Planungsschritt liest, wirken Schalter und Wert ohne Neustart; Positionsanzeigen rechnen in Beats und bleiben unberührt. Die Song-ID steht beim Start fest.

### D3: Reine Regeln des Übetempos
Neues Modul `src/domain/practice.ts` ohne React und Browser-APIs:
- `defaultPracticeTempo(songTempo)`: 75 %, auf 5 gerundet, mindestens `MIN_TEMPO`.
- `practiceTempo(stored, songTempo)`: gespeicherter Wert oder, ohne ihn, die Vorgabe.
- `stepPracticeTempo(current, delta)`: ±5, begrenzt auf `MIN_TEMPO` und `MAX_TEMPO`.
- Eingaben prüft das vorhandene `isValidTempo`.

Das Song-Tempo begrenzt das Übetempo nicht; gespielt wird genau der eingestellte Wert. Solange kein Wert gespeichert ist, folgt die Vorgabe dem aktuellen Song-Tempo.

### D4: Speicher pro Gerät und Schalter pro Sitzung
`src/state/practice.ts`: `createPracticeStore(storage)` mit `tempo(songId)`, `setTempo(songId, bpm)`, `enabled(songId)`, `setEnabled(songId, on)`, `subscribe`. Die Werte liegen als JSON-Objekt Song-ID → BPM unter einem Schlüssel im `localStorage`, mit derselben Fehlertoleranz wie `createDeviceSetting` (unlesbar oder nicht nutzbar: nur für die Sitzung). Der Schalter liegt nur im Speicher des Stores und gilt damit bis zum Neuladen. Bereitgestellt über einen `PracticeContext`; `App` erzeugt den Store wie den Klang mit dem Gerätespeicher, Tests übergeben einen eigenen.

Alternative: ein Schlüssel pro Song. Verworfen: verstreute Schlüssel, kein Vorteil bei den kleinen Datenmengen.

### D5: Komponenten
- `PlayButton` erhält `idle` für den grauen Knopf des nicht laufenden Modus.
- `Transport` nimmt Start-Funktion für einmal und Schleife, Namen beider Knöpfe und den Zustand des Players; der laufende Knopf zeigt Stopp, der andere ist `idle` und ruft `setLoop`. Doppelseite (Bereich: ganzer Song) und Pattern-Editor nutzen ihn; der Kopf der Doppelseite zeigt den Modus jeder Song-Wiedergabe, auch aus den Overlays (D1).
- `PracticeControl`: Schalter (`aria-pressed`), Wert, −/+. Der Wert nutzt dieselbe editierbare BPM-Angabe wie `TempoMark`; dafür wird deren Eingabelogik in eine Komponente mit Wert, Name und Übernahme-Funktion herausgelöst. Alle Knöpfe tragen `data-read-safe` und sind auch im gesperrten Song editierbar.
- Im Pattern-Editor rückt `TempoMark` vor den `Transport`.
- Kopf der Doppelseite mit Auswahl: `Songbook` hält die Auswahl bereits; `SongTransport` erhält sie und startet ohne laufende Wiedergabe mit dem Bereich, den auch `PlayActions` des Popovers nutzt (einmal: erster Takt bis Songende, Schleife: erster bis letzter Takt). Die Namen der Knöpfe richten sich danach.
- Damit Klicks auf Abspiel-Knöpfe und Übetempo die Auswahl nicht aufheben, zählt `useDismiss` der Struktur Elemente mit `data-keeps-selection` (Transport und Übetempo im Kopf der Doppelseite) als innen.
- `useStructureSelection` erhält neben der Auswahl, ob ihr Popover offen ist. `onPlay` der Popover schließt nur das Popover; ein Klick auf einen Takt oder ein Segment der bestehenden Auswahl öffnet es wieder, jede andere Auswahl öffnet es wie bisher. Escape hebt die Auswahl weiter auf, und ein auf die Auswahl gezogenes Pattern gilt weiter für alle ihre Takte, jeweils unabhängig vom Popover.

### D6: Farben und schmale Bildschirme
- Grauer Knopf: Fläche `--control`, Symbol `--muted`.
- Übetempo aus: Rahmen `--border`, Schrift `--muted`. An: Fläche aus `--playhead` und `--bg` mit Anteil als Token, Rahmen `--playhead`, Schrift `--text`.
- Neue Paare aus Schrift und Fläche in die Tabelle von `src/ui/designSystem.test.ts`.
- Graue Markierung einer laufenden Teil-Schleife: Fläche aus `--ghost` mit Anteil als Token, Rahmen `--muted` (`--ghost` verfehlt in Latte 3:1); Rahmen 3:1 zu den Taktflächen, unterscheidbar vom Rahmen des laufenden Takts (`--playhead`) und der Auswahl (`--accent`). Die Struktur liest Bereich und Modus aus dem Player-Zustand bzw. dem beim Start gemerkten Bereich (`activeRanges`).
- −/+ werden unter `40rem` per CSS ausgeblendet, wie die übrigen Anpassungen für schmale Bildschirme; geprüft in `src/ui/styles.test.ts`.

## Risks / Trade-offs

- [Wechsel zu Schleife kurz vor dem Ende eines Durchlaufs] → D1 setzt nahtlos an `endTime` fort; Test im Scheduler für den Wechsel nach dem Planen des letzten Schlags.
- [Gespeicherte Übetempi gelöschter Songs bleiben liegen] → wenige Bytes pro Song, bewusst ohne Aufräumen.
- [Kopf wird breiter] → auf schmalen Bildschirmen entfallen −/+; die Neuordnung für kleine Bildschirme folgt gesondert.
