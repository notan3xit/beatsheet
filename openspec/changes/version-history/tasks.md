# Tasks

## 1. Neuerungen und Abgleich

- [x] 1.1 Test „Version des Pakets“ aus dem Szenario erfassen (rot): `src/ui/changelog.test.ts` vergleicht `CHANGELOG[0].version` mit `package.json`, ohne Texte zu prüfen; der Testlauf schlägt fehl, weil die Liste fehlt
- [x] 1.2 `src/ui/changelog.ts` mit den Einträgen aus design.md D7 anlegen; der Test aus 1.1 ist grün

## 2. Dialog „Was ist neu“

- [x] 2.1 Tests aus den Szenarien erfassen (rot): „Reihenfolge der Versionen“, „Schließen“ und „Escape“ mit eigener Testliste in `src/ui/changelogDialog.test.tsx`; der Testlauf schlägt fehl, weil die Komponente fehlt
- [x] 2.2 `src/ui/ChangelogDialog.tsx` und Stil `.changelog-dialog` in `src/ui/styles.css` nur mit Tokens umsetzen, nur die Liste rollt; die Tests aus 2.1 und `src/ui/styles.test.ts` sind grün
- [x] 2.3 Höhe des Dialogs auf `32rem` begrenzen: zuerst ein roter Test in `src/ui/styles.test.ts`, danach grün; im Browser bei 1500 × 1000 höchstens 32rem hoch und die Liste rollt mit dem Mausrad

## 3. Eintrag im Menü

- [x] 3.1 Tests aus den Szenarien erfassen (rot): „Eintrag Version“ und „Dialog öffnen“ in `src/ui/appMenu.test.tsx`, „Menü abgemeldet“ und „Menü angemeldet“ um den Eintrag ergänzen, Nummer aus `CHANGELOG[0].version`; der Testlauf schlägt in genau diesen Fällen fehl
- [x] 3.2 Info-Symbol in `src/ui/icons.tsx` und Eintrag samt Dialog in `src/ui/AppMenu.tsx` ergänzen; die Tests aus 3.1 und die übrigen Tests der Datei sind grün

## 4. Gesamtprüfung

- [x] 4.1 Im Headless-Browser prüfen, hell und dunkel: Screenshots zeigen den Eintrag ganz unten im Menü und den Dialog mit rollender Liste auch bei kleinem Fenster
- [x] 4.2 `npm test` und `npm run build` laufen fehlerfrei durch

## Workflow follow-up

- Delta-Specs in die Haupt-Specs übernehmen und den Change archivieren (`/opsx:archive`).
- Beim nächsten Release 0.6.0 mit eigenem Eintrag veröffentlichen.
