# Tasks

Test-first gemäß `AGENTS.md`: zuerst die Tests auf die neuen Werte umstellen bzw. ergänzen (rot), dann umbenennen.

## 1. Vorbereitung

- [x] 1.1 Mit artjom: Bibliothek unter https://pub.artjomweyand.de/drumstuff/ exportiert, Watch-Build `drumstuff-release --watch` beendet. Prüfen: Exportdatei liegt bei artjom vor; `pgrep -af "vite build"` findet keinen Prozess mehr

## 2. Capability `library-persistence` und Umbenennung im Projekt

- [x] 2.1 Tests erfassen (rot):
  - `src/persistence/fileFormat.test.ts`: Dateiname `beatsheet-2026-11-01.json`, Formatkennung `beatsheet.library` im Export, neuer Test „Alter Export“ (Datei mit `drumstuff.library` und zwei Songs, IDs unverändert)
  - `server/auth.test.ts` und `server/mail.test.ts`: Cookie `beatsheet_session`, `from_name` `beatsheet`, Betreff mit „beatsheet“
  - Namen der Testdatenbanken auf `beatsheet-test-…`
  - Importtests mit `drumstuff.library` bleiben unverändert (design.md D3)

  Prüfen: `npm test -- fileFormat auth mail` rot
- [x] 2.2 Werte nach design.md D1 in `index.html`, `src/ui/App.tsx`, `src/main.tsx`, `src/persistence/repository.ts`, `src/persistence/fileFormat.ts`, `server/app.ts`, `server/auth.ts`, `server/mail.ts`, `server/main.ts`, `vite.config.ts`, `package.json` (danach `npm install`, damit `package-lock.json` folgt), `AGENTS.md`. Prüfen:
  - `npm test` grün, `npm run build` gelingt
  - `git grep -i drumstuff -- . ':!openspec/changes/archive'` findet nur die Importtests mit alter Kennung, den Test „Alter Export“ und die Artefakte dieses Changes
- [x] 2.3 `openspec/changes/workbook-sync/design.md` D11: Absendername `beatsheet`. Prüfen: `openspec validate workbook-sync --strict` fehlerfrei

## 3. Außerhalb des Projekts (proposal.md, Reihenfolge dort)

- [x] 3.1 `~/.local/bin/beatsheet-release` anlegen (Quellpfad bleibt bis zum Umbenennen des Ordners der alte, Ziel `~/pub/beatsheet`), `drumstuff-release` entfernen, artjom startet den Watch-Build neu. Prüfen: `curl -sI https://pub.artjomweyand.de/beatsheet/` liefert 200, die Seite zeigt „Beatsheet“
- [x] 3.2 artjom importiert die Exportdatei unter https://pub.artjomweyand.de/beatsheet/ und bestätigt die Songs. Danach löscht er `~/pub/drumstuff` und die IndexedDB `drumstuff`. Prüfen: `curl -sI https://pub.artjomweyand.de/drumstuff/` liefert 404
- [x] 3.3 `~/drumstuff-server-data` löschen. Prüfen: Verzeichnis fehlt
- [x] 3.4 Commit und Push auf `main`, artjom benennt das GitHub-Repository in `beatsheet` um, `origin` auf `github.com/notan3xit/beatsheet` setzen. Prüfen: `git remote -v` zeigt die neue Adresse, `git fetch` gelingt

## 4. Abschluss

- [x] 4.1 `openspec validate rename --strict` fehlerfrei

## Workflow follow-up

- Delta-Specs mit `/opsx:sync` übernehmen, Change mit `/opsx:archive` archivieren, committen und pushen.
- Danach als letzter Schritt (beendet die Sitzung von Claude Code): Projektverzeichnis in `~/Documents/Projects/beatsheet` umbenennen, Quellpfad in `beatsheet-release` anpassen, Notizen nach `~/.claude/projects/-home-artjom-Documents-Projects-beatsheet/memory/` kopieren und die Release-Notiz auf die neuen Namen anpassen. Prüfen: `beatsheet-release` baut aus dem neuen Ordner; eine neue Sitzung im neuen Ordner sieht die Notizen. Den Windows-Klon passt artjom selbst an (Remote, Verzeichnis).
