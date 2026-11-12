# Proposal

## Why

Beim Üben zum Track fehlen zwei Hilfen, die Drummer gewohnt sind: ein Takt Vorlauf nach dem Start, um sich einzufinden, und ein Metronom, das den Puls hörbar macht, auch dort, wo das Pattern ihn nicht deutlich spielt.

## What Changes

- Neu in der Übe-Box nach dem Übetempo: ein Knopf „Metronom“ und ein Knopf „Einzählen“, jeweils nur mit Symbol (Metronom; Punkte mit Taktstrich) und Tooltip.
- Beide schalten für sich, unabhängig voneinander und vom Übetempo, gelten je Song bis zum Neuladen wie dessen Schalter und sind auch im gesperrten Song bedienbar. Auf dem Smartphone bleiben sie sichtbar.
- Metronom: ein Klick auf jedem Beat, der erste Beat jedes Takts betont; an- und ausschalten wirkt ohne Neustart ab dem nächsten Beat.
- Einzählen: Vor jedem Start der Wiedergabe läuft ein Takt nur mit Metronom-Klicks, dann beginnt die Wiedergabe. Vor jedem weiteren Schleifendurchlauf wird nicht erneut eingezählt.
- Beides läuft im Tempo der Wiedergabe, also im Übetempo, wenn „Tempo“ an ist, sonst im Song-Tempo.
- Der Klick ist ein eigener Klang, kein Drum-Instrument, gleich bei „DRSKit“ und „Synth“, und neben den Schlägen deutlich hörbar.
- Der Schalter „Üben“ heißt „Tempo“, passend zu „Metronom“ und „Einzählen“; dass die Box dem Üben dient, ergibt sich aus ihrem Inhalt.
- Hervorgehoben bei eingeschaltetem „Tempo“ ist nur noch der Teil aus Schalter und Übetempo; die neuen Knöpfe zeigen ihren eigenen Zustand.

## Capabilities

### New Capabilities
- `practice-click`: Einzählen und Metronom: Knöpfe, Gültigkeit, Länge des Einzählens, Betonung, Klang und Verhalten während der Wiedergabe.

### Modified Capabilities
- `practice-tempo`: Der Schalter heißt „Tempo“; die Hervorhebung gilt für Schalter und Übetempo, nicht mehr für die ganze Steuerung.
- `song-playback`, `songbook-view`, `playback-controls`: Szenarien nennen den Schalter „Tempo“.

## Impact

- `src/audio/scheduler.ts`, `player.ts`: Einzählen vor Beat 0, Klicks des Metronoms, eigene Klick-Stimme.
- `src/domain/playback.ts`: Taktanfänge eines Zeitplans für die Betonung.
- `src/state/practice.ts`: zwei weitere Schalter je Song.
- `src/ui/playback.tsx`, `PracticeControl.tsx`, `icons.tsx`, `styles.css`: Quellen mit Metronom und Einzählen, zwei Knöpfe mit neuen Symbolen.
- Song-Dokument, Dateiformat, Server und Abgleich bleiben unverändert.
