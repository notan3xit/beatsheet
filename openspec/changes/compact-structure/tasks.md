# Tasks

## 1. Erkennung im Layout

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `src/songbook/layout.test.ts`: „Wiederholter Block“, „Block mit anderem Fill“, „Nur der vorige Block zählt“, „Fill aus dem folgenden Block“, „Wiederholtes Segment“, „Gleiches Segment mit anderem Namen“, „Leeres Intro“, „Entsperren“ (Layout mit `locked: false`), „Leerer Takt mit Akzent“, „Teilweise leerer Block“. Prüfen: `npm test -- layout` rot
- [x] 1.2 `layoutStructure(song, { locked })` mit `Row.flat` nach design.md D1 und D2 umsetzen; `motif.ts` bleibt beim Aufruf ohne Optionen. Prüfen: `npm test -- layout` und `npm test -- motif` grün

## 2. Flache Zeilen in der Strukturseite

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `src/ui/songbook.test.tsx`: „Darstellung“ (Balken in flachen Zeilen; Ausblenden der Texte prüft 2.2), „Takt in flacher Zeile auswählen“, „Bereich über flache Zeilen“, „Original ändert sich“ und „Wiederholung entsteht“ (Klasse `flat` wechselt, Auswahl bleibt), „Leeres Intro“ und „Entsperren“ über das Schloss; „Ablegen in flacher Zeile“ in `src/ui/structureShortcuts.test.tsx`, „Wiedergabe“ in `src/ui/songPlayback.test.tsx`. Prüfen: `npm test -- songbook structureShortcuts songPlayback` rot
- [x] 2.2 Tests aus den Szenarien erfassen (rot), `src/ui/styles.test.ts`: „Höhe“ (flache Zeile 0,625rem, Abstände nach design.md D4), „Zeilenmaße“ gilt für volle Zeilen, „Reduzierte Bewegung“ (Übergangsdauer per Token, unter `prefers-reduced-motion` 0). Prüfen: `npm test -- styles` rot
- [x] 2.3 `StructurePage` übergibt `locked` an das Layout, setzt `flat` als Klasse und schlüsselt Zeilen nach Block und Index (design.md D3). Prüfen: `npm test -- songbook` grün
- [x] 2.4 CSS für flache Zeilen und Übergänge nach design.md D3 und D4, mit Einfüge-Knöpfen an flachen Zeilen. Prüfen: `npm test -- styles` grün; `npm test` grün

## 3. Segmentnamen neben der Struktur

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `src/ui/styles.test.ts`: Container-Abfrage ab 16 × 2,25rem plus Zeilennummern und Namensspalte, `--beat` ohne Namensspalte, `--structure-max` um die Namensspalte größer, `--structure-width` unverändert, Name auf höchstens zwei Zeilen; `src/ui/songbook.test.tsx`: „Langer Name“ (Tooltip) und „Segment auswählen“. Prüfen: `npm test -- styles songbook` rot
- [x] 3.2 Namensspalte nach design.md D5 umsetzen. Prüfen: `npm test` grün

- [x] 3.3 Test (rot), `src/ui/styles.test.ts`: „Segmentname gleitet mit“ (Abstand und Innenabstand des Namens mit `--motion-row`); dann Übergang im CSS. Prüfen: `npm test` grün; im Browser rückt der Name beim Entsperren gleitend

- [x] 3.4 Tests (rot): `src/ui/styles.test.ts` „Zeilennummern“ (in flachen Zeilen sichtbar, 0,55rem, Zeilenhöhe der flachen Zeile, mit Übergang), `src/ui/songbook.test.tsx` „Zeilennummern“; dann CSS. Prüfen: `npm test` grün; im Browser stehen die Nummern neben flachen Zeilen

- [x] 3.5 Tests (rot), `src/songbook/layout.test.ts`: „Neues leeres Segment“, „Leere Blöcke hintereinander“, wiederholtes Segment mit leerem Block; dann leere Blöcke in `flatBlocks` von der Wiederholung ausnehmen (design.md D1). Prüfen: `npm test` grün

- [x] 3.6 Tests (rot), `src/songbook/layout.test.ts`: „Früherer Block im selben Segment“, „Block aus einem früheren Segment“; dann Vergleich mit allen früheren Blöcken in `flatBlocks` (design.md D1). Prüfen: `npm test` grün; In Bloom aus `server-data` zeigt den ersten Block des letzten Refrains flach

## 4. Schalter zum Ausklappen

- [x] 4.1 Tests aus den Szenarien erfassen (rot): `src/songbook/layout.test.ts` (ausgeklappt keine flache Zeile), `src/ui/songbook.test.tsx` „Ausklappen“, „Einklappen“, „Gesperrter Song“, „Erneutes Öffnen“, „Lage in der Kopfzeile“, „Pattern-Editor“. Prüfen: `npm test -- layout songbook` rot
- [x] 4.2 Zustand im Store, Layout-Option, Knopf mit Symbol und CSS nach design.md D7. Prüfen: `npm test` grün; `npm run build` fehlerfrei; im Browser Symbol in beiden Zuständen, hell und dunkel

## 5. Gesamtprüfung

- [x] 5.1 Im Browser mit „Toxicity“ und „In Bloom“ aus `server-data` prüfen, mit Screenshots bei 390, 1024 und 1650 px Breite: „Großes Fenster“ (Namen links, 3rem pro Beat), „Smartphone“ (Namen oben), „Tablet quer“ der Doppelseite unverändert nebeneinander, flache Zeilen und Entsperren mit Animation, Auswahl und Ablegen in flachen Zeilen, Hell und Dunkel. Prüfen: `npm test` und `npm run build` laufen fehlerfrei durch; Screenshots zeigen das erwartete Bild

## Workflow follow-up

- Mit artjom das Ergebnis durchsehen, auch auf dem Tablet, dann committen.
- Veröffentlichen, dabei einen Eintrag für die Versionsliste ergänzen.
- Change archivieren.
