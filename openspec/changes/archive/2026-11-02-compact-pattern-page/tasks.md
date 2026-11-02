# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe werden zuerst die Szenarien der Delta-Spec als Tests erfasst. Diese Tests müssen rot sein, bevor implementiert wird. Eine Gruppe ist abgeschlossen, sobald ihre Tests grün sind. Bestehende Tests bleiben unverändert; sie verwenden die zugänglichen Namen „<Name> bearbeiten“, „Neuer Groove“, „Neuer Fill“ und die Überschrift mit dem Patternnamen, die erhalten bleiben (design.md D4, D5).

## 1. Renderer: Darstellungsgröße für Karten

- [x] 1.1 Test erfassen (rot) in `src/notation/render/vexflow.test.ts`, Szenario „Gleicher Maßstab“: Ein 4-Beat- und ein 8-Beat-Groove mit Vierteln auf der Snare werden mit `card: true` gezeichnet; beide SVGs haben eine `viewBox`, und `width` geteilt durch die `viewBox`-Breite ist in beiden gleich (`CARD_SCALE`), mit Schlüssel (`.vf-clef`). Zusätzlich: Bei `maxWidth` kleiner als zwei Takte × `CARD_SCALE` entstehen zwei Notenzeilen (zwei Staves untereinander). Prüfen: `npm test -- vexflow` rot
- [x] 1.2 `card`-Option nach design.md D1 und D2 implementieren: feste Skalierung `CARD_SCALE`, Umbruch in Einheiten, `rowHeight` für Karten, vertikaler Zuschnitt über `getBBox` mit Fallback ohne `getBBox`. Prüfen: `npm test -- vexflow` grün, bestehende Renderer-Tests unverändert grün

## 2. Capability `songbook-view`: Zweispaltige Patternseite

- [x] 2.1 Tests aus den Szenarien erfassen (rot), neue Datei `src/ui/patternPage.test.tsx`: „Kurze Patterns nebeneinander“ (Grooves A, B mit 4 Beats: Karten im Raster `.pattern-grid`, ohne Klasse `wide`) und „Langes Pattern über beide Spalten“ (A mit 8 Beats hat `wide`, f1 mit 2 Beats nicht). Prüfen: Tests rot
- [x] 2.2 Raster in `PatternPage` und CSS nach D3 (`.pattern-grid`, `.pattern-card.wide`, nur Tokens). Prüfen: Tests aus 2.1 grün, `styles.test.ts` grün

## 3. Capability `songbook-view`: Kompakte Pattern-Karten

- [x] 3.1 Tests aus den Szenarien erfassen (rot) in `src/ui/patternPage.test.tsx`: „Kopfzeile“ (Kopfzeile von „Verse-Beat“ zeigt nur „Verse-Beat“ und „4 Beats“, weder „Groove“ noch „Bearbeiten“; genau ein Knopf „Verse-Beat bearbeiten“, dessen sichtbarer Text „Verse-Beat“ ist), „Name öffnet den Editor“ (Klick auf den Namen öffnet den Editor für „Verse-Beat“), „Anlegen-Knöpfe“ (Knöpfe mit sichtbarem Text „+ Groove“/„+ Fill“ und den Namen „Neuer Groove“/„Neuer Fill“), Notation der Karte ohne Rahmenklasse `.notation`, sondern `.notation-card`. Prüfen: Tests rot
- [x] 3.2 `NotationView` um die Variante `card` erweitern (Klasse `.notation-card`, `card: true` an den Renderer); Kopfzeile, Namensknopf und Anlegen-Knöpfe in `PatternPage` nach D4/D5; CSS für Kopfzeile, Namensknopf (Patternfarbe, Unterstreichung beim Überfahren), kleine Knöpfe und Abstände, nur Tokens. Pattern-Editor bleibt bei der normalen Notation. Prüfen: Tests aus 3.1 grün, `npm test` grün
- [x] 3.3 Ziehen am Namen: Test „Ziehen am Namen öffnet den Editor nicht“ in `src/ui/patternPage.test.tsx` (rot), dann den Namensknopf als Griff markieren (`data-drag-handle`, design.md D4). Prüfen: Test grün, Drag-Tests in `structureShortcuts.test.tsx` grün

## 4. Leere Patterns und Abstand (Nachtrag)

- [x] 4.1 Spec nachziehen: „Patternseite“ als MODIFIED mit Szenario „Leerer Platzhalter“ mit neuem Inhalt, Abstand in „Zweispaltige Patternseite“ (erledigt mit diesem Nachtrag). Prüfen: `openspec validate compact-pattern-page --strict`
- [x] 4.2 Tests anpassen bzw. erfassen (rot): `src/ui/songbook.test.tsx` „Leerer Platzhalter“ prüft neu (Karte zeigt „Noten: Verse-Beat“ mit 4 Pausen, kein „noch leer“), „Pattern bearbeiten“ prüft statt „noch leer“, dass sich das Notenbild nach dem Bearbeiten ändert. Prüfen: Tests rot
- [x] 4.3 `PatternPage` rendert auch leere Patterns über `NotationView` (D6), Raster-Zeilenabstand 1rem (D3). Prüfen: `npm test` grün

## 5. Integration

- [x] 5.1 Gesamtlauf: `npm test` und `npm run build` grün
- [x] 5.2 Im Browser (Release-Build) prüfen, hell und dunkel: Ein 4/4-Groove passt bei ca. 1400 px Fensterbreite in eine Spalte (sonst `CARD_SCALE` anpassen), kein Leerraum über und unter den Noten, Crash, offene Hi-Hat und Hi-Hat-Pedal werden nicht abgeschnitten, lange Patterns liegen über beide Spalten und brechen bei Bedarf um, Ziehen einer Karte am Namen startet das Ziehen und öffnet den Editor nicht, Pattern-Editor und Fill-Mini-Darstellung sehen aus wie vorher. Ergebnis und gewählten `CARD_SCALE` in design.md festhalten
- [x] 5.3 `openspec validate compact-pattern-page --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
