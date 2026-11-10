# Tasks

## 1. Auswahl je Beat (songbook-view)

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `src/songbook/layout.test.ts` unter „Spec songbook-view › Akzent-Markierungen“: „Crash auf der Eins“ und „Verschiedene Beats“ mit `place: 'top'`; „Hand und Fuß auf demselben Schlag“ ergibt „Cr“ oben und „BD“ unten an derselben Stelle; „Mehrere Hand-Akzente in einem Beat“ ergibt nur „Cr“ an Position 3; „Mehrere Fuß-Akzente in einem Beat“ ergibt nur „HP“ unten. Prüfen: `npm test -- layout` rot
- [x] 1.2 Auswahl und `place` in `layoutRow` (design.md D1, D2). Prüfen: `npm test -- layout` grün

## 2. Darstellung (songbook-view)

- [x] 2.1 Tests erfassen (rot), `src/ui/songbook.test.tsx`: Takt mit Crash und Bassdrum auf derselben Position zeigt „Cr“ als obere und „BD“ als untere Markierung, die Zeile trägt `has-foot-accent`; Szenario „Verdeckte Akzente bleiben erhalten“: das Takt-Popover listet Snare und Crash. Prüfen: `npm test -- songbook` rot
- [x] 2.2 `.accent.bottom` und `has-foot-accent` in `StructurePage.tsx` und `styles.css`, flache Zeilen blenden untere Markierungen aus (design.md D3). Prüfen: `npm test -- songbook styles` grün

## 3. Integration

- [x] 3.1 Im Browser prüfen (Skript unter `~/tools/playwright`, hell und dunkel): Schlusstakt des Beispiel-Songs zeigt „Cr“ oben und „BD“ unten, ohne Überlagerung mit der nächsten Zeile oder Fills; flache Zeilen ohne Markierungen. Prüfen: Screenshots zeigen das erwartete Verhalten
- [x] 3.2 `openspec validate accent-markers --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei
