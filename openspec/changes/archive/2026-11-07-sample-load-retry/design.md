# Design

## Context

`createSampleLoader` ruft nach der Probe alle übrigen Aufnahmen gleichzeitig ab, ein Fehlschlag ist endgültig. `canPassOnReload` stuft Abruffehler bereits nach Status ein. Motivation: siehe proposal.md.

## Goals / Non-Goals

**Goals:**
- Einzelne vorübergehende Abruffehler bleiben für den Nutzer unsichtbar.

**Non-Goals:**
- Änderungen am Server: Dessen Keep-Alive-Timeout als mögliche Ursache ist unbelegt.
- Wiederholung über den App-Start hinaus. Bleibt alles erfolglos, gilt weiter der Hinweis auf Neuladen.

## Decisions

### D1: Was wiederholt wird

`isTransient(error)` gilt für einen Abruffehler ohne `FetchStatusError`, für `408`, `429` und ab `500`. `canPassOnReload` nutzt es und ergänzt `404`: Neuladen hilft dort einem alten Tab, eine Wiederholung ohne Neuladen dagegen nicht.

Wiederholt wird nur `fetchData`. Eine scheiternde `response.arrayBuffer()` liegt innerhalb von `browserFetch` und zählt damit als Abruffehler.

### D2: Anzahl und Wartezeiten

Drei Versuche, Wartezeit 300 ms vor dem zweiten und 1000 ms vor dem dritten. Das überbrückt einen kurzen Ausfall und verzögert den Hinweis im schlimmsten Fall um gut eine Sekunde. Bis dahin spielt ohnehin der Synth.

`LoaderDeps` erhält das optionale `wait(ms)`, Vorgabe über `setTimeout`, damit Tests ohne echte Wartezeit laufen.

Alternative: Exponentiell mit mehr Versuchen. Verworfen: Der Nutzer wartet nicht auf das Ergebnis, Neuladen bleibt als Ausweg.

### D3: Begrenzung

`MAX_PARALLEL = 4`. Eine kleine Hilfsfunktion arbeitet die Aufnahmen mit dieser Zahl von Arbeitsschritten ab, in der Reihenfolge von `SAMPLE_KEYS`. Ein Platz bleibt während der Wartezeit einer Wiederholung belegt, damit ein gestörter Server nicht zusätzlich belastet wird. Die Reihenfolge der Ergebnisse bleibt erhalten, damit der Grund weiterhin den ersten Fehlschlag nennt.

Vier statt eins, weil die Dateien klein sind und der Abruf sonst spürbar länger dauert. Ob vier genügt, ist nicht belegt; die Wiederholung fängt den Rest ab.

### D4: Grund bleibt unverändert

Ein endgültiger Fehlschlag nennt den Fehler des letzten Versuchs. `failures()` und `reloadMayHelp()` behalten ihre Bedeutung.

## Risks / Trade-offs

- [Die Ursache bleibt unklar, und auch andere Anfragen wie der Song-Abgleich können betroffen sein] → Dieser Change deckt nur die Aufnahmen ab; die Anfrage an den Betreiber des Proxys läuft getrennt.
- [Dauert ein Ausfall länger als die Wartezeiten, bleibt der Fehler] → Hinweis auf Neuladen wie bisher.
- [Tests erwarten bisher genau einen Abruf je Fehlschlag] → Ihre Helfer erhalten ein `wait` ohne Wartezeit, die Erwartungen folgen der geänderten Anforderung.
