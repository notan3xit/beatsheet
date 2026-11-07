# Tasks

## 1. Manifest, Tags und Icons

- [x] 1.1 Tests aus den Szenarien erfassen (rot), `src/ui/homeScreen.test.ts`: Manifest startet eigenständig auf `/`; Manifest und `index.html` verweisen auf vorhandene PNGs mit den angegebenen Abmessungen, darunter ein maskierbares; `theme-color` für Hell und Dunkel und die Farben im Manifest entsprechen der Palette nach design.md D4. Keine Prüfung des Wortlauts. Prüfen: `npm test -- homeScreen` rot
- [x] 1.2 `public/manifest.json` und die Tags in `index.html` nach design.md D1, D2 und D4 anlegen. Prüfen: Die Tests zu Manifest und Farben sind grün
- [x] 1.3 `public/icons/icon.svg` und daraus die PNGs nach design.md D3 anlegen. Prüfen: `npm test -- homeScreen` grün und Sichtprüfung der PNGs, auch mit kreisförmiger Maske

## 2. Farbe der Systemleiste

- [x] 2.1 Tests aus den Szenarien von „Farbe der Systemleiste“ erfassen (rot), neben den vorhandenen Tests zu `connectTheme`: Wie System, abweichende Wahl, Wahl ändern, Systemeinstellung ändert sich. Prüfen: Die neuen Tests sind rot
- [x] 2.2 `connectTheme` in `src/ui/theme.ts` nach design.md D4 erweitern. Prüfen: Die neuen und die vorhandenen Tests zu `connectTheme` sind grün

## 3. Gesamtprüfung

- [x] 3.1 Build prüfen. Prüfen: `npm test` und `npm run build` laufen fehlerfrei durch, `dist` enthält `manifest.json` und `icons/` im Wurzelverzeichnis, und `dist/index.html` verweist darauf

## Workflow follow-up

- Veröffentlichen, dabei einen Eintrag für die Versionsliste ergänzen.
- Auf dem iPad zum Home-Bildschirm hinzufügen und prüfen: eigenes Fenster, Icon, Name, Farbe der Statusleiste bei Wahl von „Hell“ und „Dunkel“, DRSKit, Export, Import, Speicher-Hinweis.
- Aus dem Ergebnis entscheiden: Change zum Export, falls er versagt; Umgang mit dem Speicher-Hinweis; Stufe 2 (Start ohne Netz).
- Change archivieren.
