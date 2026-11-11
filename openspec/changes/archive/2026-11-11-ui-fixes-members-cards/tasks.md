# Tasks

## 1. Kürzel und Einladen (workbooks)

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `src/ui/styles.test.ts` unter „Spec workbooks“: „Überfahren der Kürzel“: keine Regel mit `.avatars:hover` setzt eine Fläche; „Feld und Knopf auf einer Linie“: Feld und Knopf in `.member-invite` haben dieselbe feste Höhe und Schriftgröße. Prüfen: `npm test -- styles` rot
- [x] 1.2 Hover-Regel entfernen (design.md D1), feste Höhe in `.member-invite` (D2). Prüfen: `npm test -- styles workbooks` grün
- [x] 1.3 Test erfassen (rot), `src/ui/styles.test.ts` unter „Spec workbooks › Einladen-Formular steht fest“: „Knopf bleibt stehen“: `.member-invite` und `.member-invite .field` ohne `gap`, `.member-invite .field` als Block. Prüfen: `npm test -- styles` rot
- [x] 1.4 Einladen-Formular ohne `gap` (design.md D2). Prüfen: `npm test -- styles workbooks` grün

## 2. Zuschnitt der Pattern-Karten (songbook-view)

- [x] 2.1 Tests aus den Szenarien erfassen (rot), `src/notation/render/vexflow.test.ts` unter „Spec songbook-view › Kompakte Pattern-Karten“, mit `getBBox` und Canvas-`measureText` als Stubs: „Balken unter dem System“: ein Pfad unterhalb von `totalHeight` liegt vollständig in der `viewBox`; „Triolenklammer oben“: ein `<text>`, dessen Schriftkasten höher reicht als seine Tinte, bestimmt die Oberkante nur über die Tinte, mit `CARD_TRIM_MARGIN`. Prüfen: `npm test -- vexflow` rot
- [x] 2.2 `fitCard` aus Tinte zuschneiden, ohne Begrenzung auf `totalHeight`, erneuter Zuschnitt nach Laden der Notenschrift (design.md D3). Prüfen: `npm test -- vexflow` grün

## 3. Integration

- [x] 3.1 Im Browser prüfen (Skript unter `~/tools/playwright`, hell und dunkel): Karten mit Sechzehntel-Bassdrum unter dem System und mit Sextolen, einzeilig und zweizeilig, ohne Abschneiden und ohne Leerraum oben; Balken einer Zeile ragen nicht in die nächste (sonst `CARD.rowHeight` erhöhen, D4); Kürzel ohne Profil unverändert beim Überfahren; „Einladen“ mit dem Feld bündig und nach drei Sekunden an derselben Stelle, auch nachdem leere Elemente in Label und Formular eingefügt wurden. Prüfen: Messwerte und Screenshots zeigen das erwartete Verhalten
- [x] 3.2 artjom prüft „Einladen“ in seinem Browser. Prüfen: Der Knopf rutscht nach dem Öffnen nicht mehr; sonst Ursache dort suchen und Artefakte anpassen
- [x] 3.3 `openspec validate ui-fixes-members-cards --strict`, `npm run build` und `npm test`. Prüfen: alle fehlerfrei
