# Proposal

## Why

Die rechte Buchseite braucht für wenige Patterns sehr viel Platz. Die Noten werden in Originalgröße gezeichnet, 210 px hoch pro Notenzeile, obwohl das System mit Hälsen nur etwa die Hälfte davon nutzt. Dazu kommen ein Rahmen um die Noten, eine Kopfzeile mit „Groove“/„Fill“, Länge und einem Knopf „Bearbeiten“ sowie großzügige Abstände. Die Karten stehen in einer Spalte untereinander. Bei einem Song mit mehreren Grooves und Fills muss man deshalb scrollen, obwohl die Seite nur als Spickzettel neben der Struktur dient.

## What Changes

- **Kleinere Noten in einheitlichem Maßstab:** Die Patternseite zeichnet die Noten verkleinert, mit gleicher Breite pro Beat in allen Karten. Leerraum über und unter dem System wird abgeschnitten. Der Rahmen um die Noten entfällt.
- **Zwei Spalten:** Die Karten stehen in einem zweispaltigen Raster. Patterns mit höchstens 4 Beats belegen eine Spalte, längere beide. Reicht auch die volle Breite nicht, bricht die Notation in der Karte um.
- **Minimale Kopfzeile:** Eine Zeile mit dem Namen in Patternfarbe und der Länge in kleiner, gedämpfter Schrift. Der Name ist selbst der Knopf zum Bearbeiten (zugänglicher Name „<Name> bearbeiten“); der Knopf „Bearbeiten“ und die Angabe „Groove“/„Fill“ entfallen.
- **Kleine Anlegen-Knöpfe:** „Neuer Groove“ und „Neuer Fill“ erscheinen als „+ Groove“ und „+ Fill“, behalten ihre zugänglichen Namen und bleiben ziehbar.
- **Leere Patterns als leeres System:** Statt des Hinweises „noch leer“ erscheint ein leeres System in der Länge des Patterns, mit Viertelpausen (wie in `drum-notation` für Patterns ohne Schläge festgelegt). Ein frisch angelegter Groove sieht damit aus wie ein leerer 4-Beat-Groove.
- Zwischen den Kartenzeilen derselbe Abstand wie zwischen den Segmenten der Struktur (1rem), sonst engere Abstände um Kopfzeile und Seitenaktionen.

Nicht enthalten: Änderungen am Pattern-Editor (er behält die große Notation) und an der Mini-Darstellung in den Fill-Blöcken der Struktur, Trennung der Seite in Abschnitte für Grooves und Fills, einstellbare Notengröße.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `songbook-view`: „Patternseite“ zeigt leere Patterns als leeres System statt „noch leer“. Neue Anforderungen „Zweispaltige Patternseite“ (Raster, Breite nach Patternlänge) und „Kompakte Pattern-Karten“ (einheitlicher, verkleinerter Notenmaßstab ohne Rahmen, einzeilige Kopfzeile, Name öffnet den Editor, „+ Groove“/„+ Fill“). Reihenfolge und Inhalt der „Patternseite“ bleiben sonst unverändert.

## Impact

- `src/notation/render/vexflow.ts`: neue Darstellungsgröße für Karten (feste Skalierung, Zuschnitt auf die tatsächliche Höhe, Umbruch nach verfügbarer Breite)
- `src/ui/NotationView.tsx`: Variante für Karten neben normal und kompakt
- `src/ui/PatternPage.tsx`: Kopfzeile, Raster, breite Karten, Anlegen-Knöpfe
- `src/ui/styles.css`: Raster und Abstände der Patternseite (nur Tokens)
- Tests: neue Tests für Raster, Kopfzeile und Maßstab. Bestehende Tests verwenden die zugänglichen Namen „<Name> bearbeiten“, „Neuer Groove“ und „Neuer Fill“ sowie die Überschrift mit dem Patternnamen; diese bleiben erhalten. „Pattern bearbeiten“ und „Leerer Platzhalter“ in `src/ui/songbook.test.tsx` prüfen den Hinweis „noch leer“ und werden an die geänderte Anforderung angepasst.
