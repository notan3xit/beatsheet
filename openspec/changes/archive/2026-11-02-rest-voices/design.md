# Design

## Context

`toNotation` (`src/notation/model.ts`) erzeugt pro Takt und Stimme eine `BeatGroup` je Beat. Ein Beat ohne Schläge einer Stimme wird dabei isoliert zu einer Viertelpause (`qr`), ohne Blick auf den Takt. Der Renderer (`src/notation/render/vexflow.ts`) hängt die Events aller Gruppen einer Stimme zu einer VexFlow-`Voice` mit `numBeats = beatCount` zusammen; VexFlow verlangt, dass die Dauern jeder Stimme den Takt genau füllen. Pausen stehen auf festen Positionen (`REST_KEY`: oben `c/5`, unten `f/4`). Im leeren Pattern zeichnet VexFlow heute nur die Pausen der oberen Stimme sichtbar, mittig im System.

Tests greifen auf `measure.voices.<stimme>[beatIndex]` zu (eine Gruppe pro Beat, z. B. „Kurzer Fill“, Triolen-Tests). Diese Form soll erhalten bleiben.

## Goals / Non-Goals

**Goals:**
- Pausen für leere Beats pro Takt und Stimme bestimmen (siehe Delta-Spec `drum-notation`).
- Modellform „eine Gruppe pro Beat“ beibehalten, damit bestehende Tests und der Renderer weitgehend unverändert bleiben.

**Non-Goals:**
- Pausen innerhalb eines Beats ändern (Lücke vor dem ersten Schlag, punktierte Pausen).
- Pausen am Beatende mit leeren Folgebeats verbinden.

## Decisions

### D1: Zweistufige Berechnung pro Takt und Stimme

1. Wie bisher je Beat die Events bestimmen; ein Beat ohne Schläge liefert zunächst „leer“.
2. Danach pro Takt und Stimme die leeren Beats auflösen:
   - Stimme hat im Takt keinen Schlag:
     - andere Stimme hat Schläge → alle Gruppen `events: []` (keine Pausen).
     - beide Stimmen leer → untere Stimme `events: []`; obere Stimme: 4-Beat-Takt → Gruppe von Beat 1 erhält `{ kind: 'rest', duration: 'w' }`, Beats 2–4 `events: []`; unvollständiger Takt → `qr` je Beat.
   - Stimme hat Schläge im Takt:
     - 4-Beat-Takt: sind Beat 1 und 2 leer, erhält Beat 1 `hr` und Beat 2 `events: []`; ebenso Beat 3 und 4. Übrige leere Beats `qr`.
     - unvollständiger Takt: jeder leere Beat `qr`.

Eine Gruppe mit `events: []` bedeutet „von einer vorigen Pause abgedeckt oder unsichtbar“. `Duration` erweitert sich um `'h'` und `'w'`; Halbe und Ganze kommen nur als Pausen vor.

Alternative: Gruppen über mehrere Beats (eine Gruppe für die Halbe Pause). Verworfen, weil damit der Index „Gruppe = Beat“ bricht, auf den Tests und Triolen-Logik bauen.

### D2: Unsichtbare Stimme im Renderer

Hat eine Stimme in einem Takt nur leere Gruppen, füllt der Renderer sie mit `GhostNote`s (eine Viertel je Beat), damit VexFlow die Stimme als voll ansieht und beide Stimmen gemeinsam formatiert werden können. GhostNotes zeichnen nichts. Eine Stimme mit Halber Pause hat für den abgedeckten Beat keine Events; die Halbe füllt die Ticks bereits, es ist also nichts aufzufüllen.

Der Renderer erkennt die unsichtbare Stimme daran, dass die Summe der Events 0 Ticks ergibt; damit braucht das Modell kein zusätzliches Feld.

### D3: Ganze Pause mittig

Die Ganze Pause eines leeren 4-Beat-Takts wird mit `alignCenter` (VexFlow 5, `Tickable.setCenterAlignment`) in die Taktmitte gesetzt und hängt an der vierten Linie (Schlüssel `d/5` statt `c/5`, im Browser prüfen). Halbe Pausen stehen auf ihrem Beat, auf der Position der jeweiligen Stimme (`REST_KEY`).

### D4: Mini-Darstellung

Die Fill-Mini-Darstellung (`compact`) nutzt dasselbe Modell und profitiert automatisch: Ein Fill nur mit Händen zeigt keine Fußpausen mehr.

## Risks / Trade-offs

- [Ganze und Halbe Pausen an falscher Höhe oder schlecht lesbar in der verkleinerten Kartenansicht] → Prüfung im Browser (hell/dunkel, Karte und Editor), Schlüssel der Pausen bei Bedarf anpassen.
- [VexFlow-Formatter verteilt Platz anders, wenn eine Stimme nur aus GhostNotes besteht] → Breite bleibt durch `beatWidth` pro Beat bestimmt (`contentWidth = max(beatCount * beatWidth, …)`); im Browser vergleichen.
- [Mit `alignCenter` und `card`-Zuschnitt (`getBBox`) verschiebt sich die Höhe] → Ganze Pause liegt innerhalb des Systems, der Zuschnitt bleibt am System orientiert.

## Ergebnis der Browser-Prüfung

Am 2026-11-02 vom Nutzer im Release-Build (pub) geprüft, u. a. anhand einer Patternkarte mit Hi-Hat und Kicks auf „1+“ und „3+“: Fußpausen nur in Takten mit Fußschlägen, Pausen zwischen den Kicks als Viertel- und Achtelpause ohne Beatgrenze zu verdecken (keine punktierte Pause über Beat 3). Freigabe zum Archivieren erteilt.
