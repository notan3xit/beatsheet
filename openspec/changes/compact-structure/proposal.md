# Proposal

## Why

Die Struktur eines Songs passt oft nicht auf eine Bildschirmseite. Wiederholte Blöcke und Segmente stehen in voller Höhe da, obwohl sie nur zeigen, was darüber schon steht, und jede Segmentüberschrift kostet eine eigene Zeile. Am Schlagzeug soll der ganze Song auf einen Blick lesbar sein.

## What Changes

- Ein Block, der genauso aussieht wie ein früherer Block des Songs, erscheint als flache Zeilen, ein wiederholtes Segment damit ganz: dieselben Takte an derselben Stelle in ihren Farben, ohne Beschriftung, Kurzschrift und Akzente. Der Name eines Segments spielt für den Vergleich keine Rolle.
- Ist der Song gesperrt, erscheint auch ein Block flach, dessen Takte alle leer sind (kein Groove, kein Fill, kein Akzent). Leere Blöcke gelten nie als Wiederholung; entsperrt bleiben sie voll, damit man sie füllen kann.
- Jeder Takt einer flachen Zeile bleibt auswählbar und Ziel beim Ziehen; Bearbeiten, Popover und Wiedergabe funktionieren wie in vollen Zeilen.
- Die Darstellung folgt allein aus Inhalt und Sperrzustand. Ändert eine Bearbeitung oder das Schloss, was flach ist, fahren die Zeilen animiert auf oder zu, die Auswahl bleibt bestehen.
- Ein Schalter links neben dem Schloss klappt die Struktur aus, sodass keine Zeile flach ist; beim Öffnen eines Songs ist sie eingeklappt.
- Die Segmentnamen stehen links neben den Zeilen, solange daneben eine Zeile von 16 Beats mit 2,25rem pro Beat Platz hat, sonst wie bisher darüber. Die Höchstbreite der Strukturseite wächst um die Namensspalte.

## Capabilities

### New Capabilities

### Modified Capabilities
- `songbook-view`: neue Anforderungen zu flachen Zeilen (Wiederholungen, leere Blöcke, Übergänge) und zur Lage der Segmentnamen; „Maßstabsgetreue Struktur“ und „Kompakte Zeilen“ werden darauf abgestimmt

## Impact

- `src/songbook/layout.ts` (Erkennung, Kennzeichnung flacher Zeilen), `src/ui/StructurePage.tsx`, `src/ui/styles.css`
- Tests: `src/songbook/layout.test.ts`, `src/ui/songbook.test.tsx`, `src/ui/styles.test.ts`
- Keine Änderung an Datenmodell, Dateiformat, Server, Sync oder Wiedergabe; das Motiv der Song-Kacheln bleibt unverändert
