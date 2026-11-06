# Design

## Context

`Beat` speichert Schläge in `hits` und Spielweisen in `articulations`; `ARTICULATED` listet die Instrumente mit Spielweise, alle mit denselben Werten. `Voices.trigger` kennt nur Instrument, Zeit und Pegel, die Aufnahme ergibt sich aus Instrument und Pegel. Das Automerge-Dokument hält je Beat feste Container in `hits` und in `articulations`, Letztere nur für die Instrumente aus `ARTICULATED`. `bar.accents` bezeichnet Akzente der Song-Struktur und hat mit der Betonung nichts zu tun; die Betonung heißt im Code `emphasis`.

## Goals / Non-Goals

**Goals:**
- Betonung lässt sich mit jeder Spielweise außer Ghost Note kombinieren.
- Bestehende Songs bleiben ohne Migration gültig und unverändert.
- Gleichzeitige erste Betonungen im selben Beat gehen beim Zusammenführen nicht verloren.
- Bestehende Aufnahmen bleiben bitgleich.

**Non-Goals:**
- Betonung pro Notenkopf in den Noten: Sie steht je Spalte, gespeichert und gespielt wird sie pro Instrument.
- Lautstärkestufen und hellere Aufnahmen für betonte Schläge.

## Decisions

### D1: Spielweisen je Instrument

```ts
export const ARTICULATIONS = ['flam', 'drag', 'ghost', 'rim', 'cross', 'bell', 'choke'] as const;
const DRUM = ['flam', 'drag', 'ghost'] as const;
export const ARTICULATIONS_BY_INSTRUMENT: Partial<Record<Instrument, readonly Articulation[]>> = {
  snare: [...DRUM, 'rim', 'cross'], tom1: DRUM, tom2: DRUM, floorTom: DRUM, ride: ['bell'], crash: ['choke'],
};
```

Die Reihenfolge ist zugleich die des Shift-Klicks. `ARTICULATED` entfällt. `cycleArticulation`, `normalize` und `fileFormat` lesen nur diese Tabelle. Alternative: eigene Instrumente wie `hihatOpen`, also neue Sequencer-Zeilen. Verworfen, weil das Raster länger würde und Glocke und Choke keine eigenen Instrumente sind.

### D2: Betonung als eigenes Feld

```ts
interface Beat {
  /** Betonte Positionen je Instrument, sortiert; nur gesetzte Schläge, keine Ghost Notes. */
  emphasis?: Partial<Record<Instrument, number[]>>;
}
```

Ohne Betonung fehlt das Feld, Vergleiche wie `toEqual({ subdivision, hits })` gelten weiter. `toggleEmphasis` setzt auf leerer Zelle einen betonten normalen Schlag, ändert auf einer Ghost Note nichts und entfernt die Gegen-Hi-Hat samt Betonung. Ein gemeinsamer Helfer räumt beim Entfernen eines Schlags Spielweise und Betonung ab; das gilt auch für die Gegen-Hi-Hat in `toggleHit`. `changeSubdivision` überträgt die Betonung wie die Spielweise. `normalizeBeat` verwirft Betonungen ohne Schlag und auf Ghost Notes sowie Spielweisen, die das Instrument nicht zulässt. Damit gilt der Vorrang der Ghost Note auch nach dem Zusammenführen.

Alternative: kombinierte Werte wie `flam-emphasis`. Verworfen, weil sich die Liste verdoppelt.

### D3: Flache Schlüssel im Dokument

Neue Container in vorhandenen Dokumenten wären beim ersten Schreiben ein Konflikt: Legen zwei Geräte `emphasis` oder `articulations.ride` gleichzeitig an, gewinnt eine Karte, und die Einträge der anderen gehen verloren. Eine Migration beim Laden hätte dasselbe Problem. Außerdem erzeugte jeder neue Container eine Änderung an einem unveränderten Song.

Deshalb kommen die neuen Einträge ohne neuen Container aus:
- Betonung: Schlüssel `emphasis:<instrument>:<position>` mit Wert `true` direkt im Beat.
- Spielweisen von Ride und Crash: Schlüssel `<instrument>:<position>` direkt in `articulations`.
- Snare und Toms bleiben in ihren vorhandenen Containern.

`beatFromDoc` liest beide Formen. `syncMap` braucht keine Änderung, weil es Schlüssel einzeln abgleicht.

### D4: Schemaversion 4

`SCHEMA_VERSION = 4`, `beatSchema` erhält `emphasis` und prüft Spielweisen gegen die Tabelle aus D1. Der Importweg bleibt: Die Struktur entscheidet, ältere Dateien passen ohne Umwandlung. Die Szenarien zur neueren Version nennen deshalb Version 5.

### D5: Klangvariante und Vorschläge in der Wiedergabe

```ts
type Technique = 'rim' | 'cross' | 'bell' | 'choke';
interface PlaybackHit { technique?: Technique; graces?: readonly number[] /* Sekunden vor dem Schlag */ }
// Voices.trigger(instrument, time, gain, technique?)
```

- `graces` ersetzt `graceBefore`: Flam `[0.03]`, Drag `[0.08, 0.04]`, unabhängig vom Tempo. Vorschläge erklingen fest mit `GRACE_GAIN` (0,4), nicht relativ zum Hauptschlag; sonst fiele ein betonter Flam über die Schwelle `SOFT_BELOW` und spielte die laute Aufnahme.
- `EMPHASIS_GAIN = 1.6` wirkt auf den Hauptschlag. Akzente der Song-Struktur bleiben bei Pegel 1.
- `START_DELAY` steigt auf 0,1 s und `LOOKAHEAD` auf 0,12 s, damit die 0,08 s des Drags auch beim ersten Schlag und im laufenden Planungstakt in der Zukunft liegen.
- `createSampleVoices` wählt über `technique` die Aufnahme. Ihr Ausgang erhält wie der Synth einen Kompressor (Schwelle −2 dB, Verhältnis 20), weil Pegel über 1 sonst übersteuern können.
- Choke: Hüllkurve ab `time + 0.12` mit Zeitkonstante 0,015 s auf null, bei Aufnahmen und Synth.
- Synth: eigene Rezepte in `voices.ts`. Rim Shot: Snare lauter mit zusätzlichem hellem Rauschen. Cross-Stick: kurzes helles Klicken. Glocke: höhere Teiltöne, kurzes Abklingen. Sie müssen nur unterscheidbar sein.

### D6: Aufnahmen

`SAMPLE_KEYS` wird um `snare-rim`, `snare-cross` und `ride-bell` ergänzt, je als `.webm` und `.m4a`. `scripts/drs-samples.mjs` erzeugt sie mit dem Pegelfaktor des Sets, der weiterhin nur aus den bestehenden Instrumenten berechnet wird.

| Aufnahme | Quelle | Bearbeitung |
|---|---|---|
| `snare-rim` | `Snare` Stufe 49 und `Snare_rim` Stufe 10 (× 3), Mikrofone `Snare_top`, `Snare_bottom`, `OHL`, `OHR`, `AmbL`, `AmbR`, jede Spur für sich nach Stereo (`-ac 2`) und aufsummiert | `volume=4,equalizer=f=900:t=q:w=1.5:g=6,equalizer=f=3500:t=q:w=1.2:g=8,asoftclip=type=tanh`, Schnitt wie im Skript, höchstens 1,5 s, normiert auf Effektivwert 0,12 über die ersten 200 ms |
| `snare-cross` | `Snare_rim` Stufe 10, Mischung des Skripts | Faktor 1,8 auf den Pegelfaktor, höchstens 1,5 s |
| `ride-bell` | `Ride_tip_bell` Stufe 7, Mikrofone `Ride`, `OHL`, `OHR`, `AmbL`, `AmbR`, Mischung des Skripts | Faktor 0,8 auf den Pegelfaktor, höchstens 3 s |

Die Werte entsprechen der abgestimmten Hörprobe (`~/pub/schlag-demo`), einschließlich des dort beim Abspielen angewandten Faktors, der hier in die Datei wandert. Die abweichende Mischung des Rim Shots bleibt, weil sie zum Klang gehört, der ausgewählt wurde. Prüfwerte über die ersten 200 ms mit `volumedetect` (Opus):

| Aufnahme | mittlerer Pegel | Spitze |
|---|---|---|
| `snare-rim` | etwa −18 dB | etwa −7 dB |
| `snare-cross` | etwa −32 dB | etwa −10 dB |

Alternative: echte Rim Shots aus CC0-Kits. In der Hörprobe verworfen, weil die bearbeitete Fassung besser zur normalen Snare passt.

### D7: Notation

`NoteKey` erhält `emphasis?: true`. Die Notenköpfe bestimmt `vexKey`: `rim` → `/sf`, `cross` → `/x2`, `bell` → `/d2`.

Drag: `GraceNoteGroup` aus zwei Sechzehntel-Vorschlägen mit Balken und Bogen, ohne Schrägstrich. Liegen Flam und Drag am selben Hals, trägt der erste Vorschlag nur die Drag-Köpfe, der zweite auch die Flam-Köpfe.

Betonung und Choke zeichnet ein eigener Durchgang, nicht VexFlows `Articulation`. Diese setzt ihr Zeichen an die Halsspitze, ohne die spätere Balkenlage zu kennen, und kollidiert dadurch mit Balken (in der Hörprobe sichtbar). Ein Aufruf von `beam.postFormat` vor dem Zeichnen ließ dort Hälse über den Balken hinausragen und ist deshalb keine Lösung.

- Der Durchgang läuft je Notenzeile, nachdem alle Stimmen und Balken gezeichnet sind, und liest dann die endgültigen Halsenden.
- Höhe des `>`: oberhalb des höchsten Halsendes der Zeile, mindestens über dem System, plus Abstand für `o` und Triolenklammern, falls in der Zeile vorhanden.
- Spalten werden über den `TickContext` erkannt, den beide Stimmen teilen; so entsteht je Spalte genau ein `>`.
- Choke: Punkt mittig unmittelbar über dem Crash-Notenkopf. Der Hals liegt rechts daneben, Balken liegen weit darüber.
- Beide liegen in SVG-Gruppen mit den Klassen `vf-emphasis` und `vf-choke`; das macht sie in Tests zählbar.

Ragt das `>` der ersten Zeile über den oberen Rand, wächst das Bild über seine `viewBox` nach oben; die Patternkarte schneidet ohnehin auf das Notenbild zu. Spätere Zeilen und die Mini-Darstellung mit fester Höhe begrenzen die Höhe stattdessen.

### D8: Sequencer

`onClick` prüft zuerst `ctrlKey || metaKey`, dann `shiftKey`. Die Zelle erhält `data-articulation` mit den neuen Werten und `data-emphasis`; das CSS zeigt die Spielweise als kleines Zeichen und die Betonung als `>` in einer Ecke, nur mit Tokens. Der zugängliche Name wird um „, betont“ ergänzt.

### D9: Kurzschrift

`shorthand.ts` braucht keine Änderung: `flamChar` gilt nur für `flam`, die übrigen Spielweisen fallen auf den Buchstaben des Instruments zurück, und Ride fehlt in der Liste. Tests sichern das ab.

## Risks / Trade-offs

- [Ältere Versionen weisen Dateien mit neuen Spielweisen als beschädigt ab] → Bewusst akzeptiert; ihre Prüfung lässt sich nachträglich nicht ändern.
- [Ein noch geöffneter Tab der Vorversion löscht beim nächsten Schreiben Betonungen und Ride-/Crash-Spielweisen aus dem Dokument] → Betrifft nur das Fenster bis zum Neuladen und fällt unter das akzeptierte Tab-Risiko; im Deploy-Hinweis nennen.
- [Durchgestrichener Notenkopf ist klein schlecht lesbar] → In Karte und Mini-Darstellung im Browser prüfen; falls nötig, den Strich kräftiger zeichnen, ohne die Entscheidung zu ändern.
- [Sechs Shift-Klick-Stufen auf der Snare sind lang] → Bewusst akzeptiert; eine Leiste lässt sich später ergänzen.
- [Kompressor am Ausgang verändert laute Stellen] → Hohe Schwelle, greift nur bei Spitzen.
- [Mehrdeutiges `>` bei mehreren Instrumenten in einer Spalte] → Bewusst akzeptiert, Sequencer und Wiedergabe bleiben genau.

## Migration Plan

Keine Datenmigration: Fehlende Felder bedeuten „normal, unbetont“. Rückweg: Die Vorversion zeigt und spielt neue Snare- und Tom-Spielweisen wie normale Schläge, verwirft aber beim Schreiben Betonungen und Ride-/Crash-Spielweisen.

Nach der Abnahme wird die Hörprobe `~/pub/schlag-demo` auf Bestätigung des Nutzers gelöscht; sie gehört nicht zum Repository.
