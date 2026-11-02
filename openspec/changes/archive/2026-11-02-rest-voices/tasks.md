# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe werden zuerst die Szenarien der Delta-Specs als Tests erfasst. Diese Tests müssen rot sein, bevor implementiert wird. Eine Gruppe ist abgeschlossen, sobald ihre Tests grün sind. Bestehende Tests bleiben unverändert, außer denen, deren Szenario sich fachlich ändert: „Leerer Beat für die Füße“ und „Neuer Groove“ in `src/notation/model.test.ts`, „Leerer Platzhalter“ in `src/ui/songbook.test.tsx`.

## 1. Capability `drum-notation`: Pausen im Modell

- [x] 1.1 Tests aus den Szenarien erfassen bzw. anpassen (rot) in `src/notation/model.test.ts`: „Leerer Beat für die Füße“ (Bassdrum auf 1 und 3 → `qr` auf Beat 2 und 4), „Stimme ohne Schläge im Takt“ (alle Gruppen der unteren Stimme ohne Events), „Halbe Pause“ (Beat 1 `hr`, Beat 2 ohne Events), „Taktmitte bleibt sichtbar“ (Beat 2 und 3 `qr`), „Unvollständiger Takt“ (6 Beats, Takt 2: Beat 5 `qr`), „Neuer Groove“ (oben Beat 1 `wr`, sonst ohne Events; unten keine Events), „Leerer kurzer Fill“ (oben `qr`, `qr`; unten keine Events). Prüfen: `npm test -- model` rot
- [x] 1.2 `Duration` um `'h'`/`'w'` erweitern und leere Beats pro Takt und Stimme nach design.md D1 auflösen. Prüfen: `npm test -- model` grün, übrige Modell-Tests unverändert grün

## 2. Renderer

- [x] 2.1 Tests erfassen (rot) in `src/notation/render/vexflow.test.ts`: Hi-Hat-Achtel ohne Füße rendern ohne Fehler und zeichnen nur die 8 Hi-Hat-Noten (keine Pausen-Stavenotes, `.vf-stavenote` = 8); leerer 4-Beat-Groove zeichnet genau eine Pause; leerer 2-Beat-Fill genau zwei; Pattern mit Halber Pause rendert ohne Fehler. Prüfen: `npm test -- vexflow` rot
- [x] 2.2 Renderer nach D2/D3: leere Stimme mit `GhostNote`s auffüllen, Halbe und Ganze Pausen zeichnen, Ganze Pause mittig (`alignCenter`). Prüfen: `npm test -- vexflow` grün, Farbtest grün

## 3. Capability `songbook-view`: leeres Pattern auf der Patternseite

- [x] 3.1 Test „Leerer Platzhalter“ in `src/ui/songbook.test.tsx` an das geänderte Szenario anpassen (rot): Karte zeigt ein System mit genau einer Pause. Prüfen: Test rot
- [x] 3.2 Prüfen, dass der Test nach Gruppe 1 und 2 ohne weitere Änderung grün ist (sonst Ursache beheben). Prüfen: `npm test` grün

## 4. Integration

- [x] 4.1 Gesamtlauf: `npm test` und `npm run build` grün
- [x] 4.2 Im Browser (Release-Build) prüfen, hell und dunkel, in Karte, Editor und Fill-Mini-Darstellung: Hi-Hat-Groove ohne Fußpausen, Ganze Pause mittig und an der vierten Linie hängend, Halbe Pausen an richtiger Höhe in beiden Stimmen, Abstände der Noten unverändert, nichts abgeschnitten. Ergebnis in design.md festhalten
- [x] 4.3 `openspec validate rest-voices --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
