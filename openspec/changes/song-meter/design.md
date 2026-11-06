# Design

## Context

Ein Beat ist überall eine Viertel: `Bar.beats` und `Pattern.beats.length` sind Anzahlen, Wiedergabe und Tempo rechnen in Vierteln. Nur `toNotation` setzt mit `BEATS_PER_MEASURE` feste Taktstriche und leitet daraus Halbe und Ganze Pausen ab. Der Takt als Zahl von Beats reicht deshalb als Modell. Automerge-Dokumente und Dateien bestehender Songs enthalten keine Taktart.

## Goals / Non-Goals

**Goals:**
- Bestehende Songs laden und sehen unverändert aus und erzeugen keine Änderung im Dokument.
- Die Einstellungen verschieben in keinem Zustand die Kopfzeile.

**Non-Goals:**
- Taktart einzelner Takte der Struktur: `Bar.beats` bleibt, wie es ist.
- Whole-Bar-Pausen in anderen Taktarten als 4/4.
- Taktart im Kopf des Notenbilds.

## Decisions

### D1: Taktart als Beat-Zahl in zwei optionalen Feldern

`Song.meter?: number` und `Pattern.meter?: number`, erlaubte Werte in `METERS = [3, 4, 5, 6, 7]`, Vorgabe `DEFAULT_METER = 4`. Reine Funktionen in `domain` lesen und setzen die Werte:

```text
songMeter(song)              song.meter ?? DEFAULT_METER
patternMeter(pattern, song)  pattern.meter ?? songMeter(song)
meterLabel(meter)            "<meter>/4"
```

- Fehlendes Feld am Pattern heißt „folgt dem Song“, ein gesetzter Wert ist eine eigene Taktart, auch wenn er dem Song gleicht.
- Alternative: Paar aus Zähler und Nenner. Verworfen, weil kein Nenner außer 4 vorkommt und ein Nenner Notenwerte und Tempo betreffen würde.
- Alternative: `Song.meter` als Pflichtfeld wie `tempo`. Verworfen: Das bräuchte Vorgaben in Dateiformat, Dokument und Repository und würde alte Dokumente beim nächsten Abgleich ändern.

### D2: 4/4 steht im Song-Dokument nicht

`toDocShape` schreibt `meter` am Song nur, wenn der Wert nicht `DEFAULT_METER` ist, und am Pattern nur, wenn er gesetzt ist. `fromDocShape` übernimmt nur vorhandene Felder.

- Fehlt das Feld oder steht 4 darin, ist der Song derselbe: `sameSong` bleibt wahr, und `applySong` erzeugt für einen alten Song keine Änderung.
- `syncMap` entfernt den Schlüssel beim Zurückstellen von selbst.
- Das Dateiformat bekommt `meter` als optionale Vereinigung aus `METERS` an `songSchema` und `patternSchema`, ohne neue Schemaversion.

### D3: Taktstriche über einen Parameter

`toNotation(pattern, meter = DEFAULT_METER)` ersetzt `BEATS_PER_MEASURE`; die Schleife schneidet Takte zu `meter` Beats.

- Halbe und Ganze Pausen gelten nur bei `meter === 4` und einem vollen Takt. Ein 4-Beat-Pattern in 5/4 ist damit unvollständig und zeigt Viertelpausen.
- `NotationView` bekommt die Taktart als Prop `meter`; `PatternEditor` und `PatternCard` übergeben `patternMeter(pattern, song)`.
- Der Parameter hält `notation/model` frei von Song-Wissen, und bestehende Aufrufe ohne Taktart gelten weiter als 4/4.
- Der Renderer braucht keine Änderung: `Measure.beatCount` steuert schon Voice und Breite.

### D4: Vorgaben beim Anlegen im Song, nicht in `createPattern`

`addPattern` setzt für einen Groove ohne Länge `songMeter(song)`; `addPlaceholder` gibt seine Länge nicht mehr fest vor. `createPattern` kennt keinen Song und behält seine Vorgabe. `insertSegmentAfter`, `appendSegment` und `appendBlockLike` ohne Vorbild nehmen `songMeter(song)`. Der Store legt Patterns bereits über `addPattern` an und braucht dafür nichts Neues.

### D5: Standard-Takt als Auswahl, die wie Text aussieht

Neue Komponente `MeterMark` im Kopf der Doppelseite, direkt hinter `TempoMark`, mit gedämpftem Symbol vor dem Wert.

```text
Gesperrt:    Songtitel  J = 117  [S] 4/4   (Text)
Entsperrt:   Songtitel  J = 117  [S] 4/4   (Auswahl ohne Rahmen und Pfeil)
```

- Natives `select` mit `appearance: none`, in Schrift, Maßen und Hover wie die Tempoangabe; gesperrt ein `span` gleicher Breite.
- Änderung über `store.updateSong` und reines `setSongMeter`; ungültig oder unverändert liefert denselben Song.
- Alternative: Klick verwandelt die Angabe in ein Feld wie beim Tempo. Verworfen: Die Werte sind eine kurze feste Liste, und ein zweiter Zustand brächte nichts.

### D6: Eigene Taktart als Umschalter neben dem Wert

Neue Komponente `PatternMeter` im `PatternEditor` zwischen Länge und Typ. Zwei feste Plätze:

```text
                     Symbol               Wert
Entsperrt, folgt     Knopf mit Fläche     4/4   gedämpfter Text
Entsperrt, eigen     Knopf, gefüllt       7/4   Auswahl
Gesperrt, folgt      Symbol, grau         4/4   gedämpfter Text
Gesperrt, eigen      Symbol, grau         7/4   ungedämpfter Text
```

- Der Umschalter ist ein kleiner Knopf mit Symbol und `aria-pressed`, Name und Tooltip „Eigene Taktart“. Er hat die Fläche der übrigen Knöpfe, damit er als bedienbar erkennbar ist; eingeschaltet ist er gefüllt wie eine gesetzte Zelle im Sequencer. Gesperrt steht dasselbe Symbol ohne Bedienung; bei eigener Taktart ist es ein `img` mit diesem Namen.
- Das Symbol steht immer, damit die Leseansicht keine Lücke bekommt. Der Wert hat wie `.value-length` eine feste Breite.
- Einschalten setzt `pattern.meter` auf die aktuelle Song-Taktart, das Notenbild ändert sich dadurch nicht. Ausschalten entfernt das Feld.
- Änderung über `store.update` und reines `setPatternMeter`. Das macht sie zu einem Schritt im Verlauf des Patterns, und Revision und Rückgängig stimmen.
- Alternative: Dropdown mit dynamischem Eintrag „Wie Song (4/4)“. Verworfen: Die Auswahl wäre in jedem Pattern sichtbar, und ein wechselnder Eintrag wäre schwerer zu lesen.
- Alternative: Umschalter mit Text. Verworfen: Das zeigt in jedem Pattern dauerhaft zusätzlichen Text.

### D7: Abweichung auf der Patternkarte

`.pattern-meta` zeigt `7 Beats · 7/4`, wenn `pattern.meter` gesetzt ist und von `songMeter(song)` abweicht, sonst wie bisher nur die Länge. Das gilt für Grooves und Fills gleichermaßen, weil beide dieselbe Karte nutzen.

### D8: Regelwidrige Werte beim Normalisieren verwerfen

`normalizeSong` entfernt `meter` an Song und Pattern, wenn der Wert nicht in `METERS` liegt. Dokumente kommen auch vom Server und sind nicht über das Dateiformat geprüft; ein Wert wie 0 würde in `toNotation` nicht enden. Ein gültiger Song bleibt dieselbe Referenz.

## Risks / Trade-offs

- [Ein Tab mit der alten Version entfernt beim nächsten Speichern `meter`, weil `syncMap` unbekannte Schlüssel löscht] → Betrifft nur die Zeit bis zum Neuladen nach dem Update; im schlimmsten Fall fällt der Song auf 4/4 zurück. Keine Schläge gehen verloren.
- [Song auf 3/4 umstellen zeigt vorhandene 4-Beat-Grooves als 3+1] → Gewollt und ohne Datenverlust: Die Änderung lässt sich zurückstellen, und einzelne Patterns bekommen eine eigene Taktart.
- [Ein 7-Beat-Takt bricht nicht um und kann breiter als die Fläche sein] → Der Pattern-Editor scrollt schon waagerecht (`.notation`), Karten schrumpfen zu breite Takte.
- [Leere Takte in 3/4, 5/4, 6/4 und 7/4 zeigen Viertelpausen statt einer Ganzen] → Bewusst einfach; lesbar und musikalisch korrekt, nur nicht die übliche Schreibweise.
- [Der Standard-Takt lässt sich im Pattern-Editor nicht ändern] → Gewollt, der Editor zeigt dort den Wert und bietet die Abweichung an. Die Einstellung für alle Patterns bleibt an einer Stelle.
