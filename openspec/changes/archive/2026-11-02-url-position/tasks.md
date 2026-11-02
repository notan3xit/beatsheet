# Tasks

Test-first gemäß `AGENTS.md`: In jeder Gruppe zuerst die Szenarien als Tests erfassen (rot), dann implementieren. Bestehende Tests bleiben unverändert.

## 1. Routen

- [x] 1.1 Tests erfassen (rot), neue Datei `src/state/route.test.ts`: `hashOf`/`parseHash` für Liste, Doppelseite, Pattern-Editor (Hin- und Rückweg, IDs mit Sonderzeichen), nicht lesbare Hashes (`''`, `#`, `#/foo`, `#/songs/`) → Liste; `routeOf` aus einem Store-Zustand. Prüfen: `npm test -- route` rot
- [x] 1.2 `src/state/route.ts` nach design.md D2. Prüfen: `npm test -- route` grün

## 2. Capability `navigation`: Verbindung Adresse ↔ App

- [x] 2.1 Tests aus den Szenarien erfassen (rot), neue Datei `src/ui/urlSync.test.ts` mit Store und jsdom-`window`: „Adresse folgt der Navigation“, „Neuladen im Pattern-Editor“ (Start mit Pattern-Hash), „Link auf einen Song“, „Zur Song-Liste“, „Zurück aus dem Pattern-Editor“ und „Vor nach Zurück“ (Hash setzen + `popstate`/`hashchange` auslösen), „Gelöschter Song“, „Gelöschtes Pattern“ (Adresse korrigiert, `history.length` unverändert), „Pattern löschen im Editor“; dazu: Inhaltsänderung erzeugt keinen Verlaufseintrag, Zurück erzeugt keinen neuen Eintrag. Prüfen: Tests rot
- [x] 2.2 `src/ui/urlSync.ts` nach D3/D4 und Aufruf in `src/main.tsx` vor dem ersten Rendern. Prüfen: Tests aus 2.1 grün, `npm test` grün, `npx tsc --noEmit` fehlerfrei

## 3. Integration

- [x] 3.1 Gesamtlauf: `npm test` und `npm run build` grün
- [x] 3.2 Im Browser (Release-Build) prüfen: Neuladen auf Doppelseite und im Pattern-Editor bleibt dort, Zurück/Vor im Browser wechseln die Ansichten, kopierter Link in neuem Tab öffnet dieselbe Ansicht, Adresse mit unbekannter ID landet in der Song-Liste. Ergebnis in design.md festhalten
- [x] 3.3 `openspec validate url-position --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen und den Change mit `/opsx:archive` archivieren.
