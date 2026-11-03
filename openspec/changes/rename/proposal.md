# Proposal

## Why

Das Projekt heißt künftig **beatsheet**. Der Name soll überall gelten, auch in technischen Kennungen. Jetzt ist der Wechsel billig: Es gibt noch keine geteilten Daten, und alte Exporte bleiben importierbar, weil der Import die Formatkennung ignoriert (`library-persistence`, „Formatkennung und Schemaversion beim Import“).

## What Changes

Im Projekt:
- App-Titel im Kopf und im Browser-Tab: „Beatsheet“.
- Paketname `beatsheet`. `AGENTS.md` nennt den neuen Namen, die Umgebungsvariable für das Proxy-Ziel heißt `BEATSHEET_API`.
- **BREAKING** Lokaler Speicher: Die IndexedDB heißt `beatsheet`. Nach dem Update startet die App mit leerer Bibliothek. Die bisherigen Songs übernimmt der Nutzer per Export aus der alten Version und Import in die neue. Es gibt keine automatische Übernahme.
- Export: Formatkennung `beatsheet.library`, Dateiname `beatsheet-<Datum>.json`. Exporte mit der alten Kennung bleiben importierbar.
- Server: Sitzungs-Cookie `beatsheet_session` (bestehende Sitzungen enden, einmal neu anmelden), Datenbankdatei `beatsheet.sqlite`, Absendername und Betreff der Mails mit „beatsheet“, Startmeldung.
- Der laufende Change `workbook-sync` übernimmt den neuen Namen für die Einladungsmail.

Außerhalb des Projektordners, in dieser Reihenfolge:
1. **Vorher:** Bibliothek aus der benutzten App exportieren (https://pub.artjomweyand.de/drumstuff/). Es gibt keine Backups, ohne Export bleiben die Songs nur in der verwaisten alten Datenbank. Den laufenden Watch-Build (`drumstuff-release --watch`) beenden, damit er die umbenannte App nicht unter der alten Adresse veröffentlicht.
2. **Release:** Skript `~/.local/bin/drumstuff-release` wird zu `beatsheet-release`, mit Quellpfad und Ziel `~/pub/beatsheet`. Den Watch-Build mit dem neuen Skript neu starten.
3. **Import:** Die exportierte Datei unter https://pub.artjomweyand.de/beatsheet/ importieren und prüfen. Erst danach `~/pub/drumstuff` und die alte IndexedDB `drumstuff` im Browser löschen (Entwicklertools → Anwendung → IndexedDB).
4. **Server-Testdaten:** `~/drumstuff-server-data` enthält nur Testdaten und wird gelöscht.
5. **GitHub:** Repository `notan3xit/drumstuff` in `beatsheet` umbenennen (GitHub leitet die alte Adresse weiter), `origin` auf die neue Adresse setzen. Auf dem Windows-Rechner ebenso: Remote ändern, Verzeichnis umbenennen.
6. **Projektverzeichnis:** `~/Documents/Projects/drumstuff` → `~/Documents/Projects/beatsheet`. Das beendet die laufende Claude-Code-Sitzung in diesem Ordner. Die Notizen von Claude Code liegen unter `~/.claude/projects/-home-artjom-Documents-Projects-drumstuff/` und ziehen nach `…-beatsheet/` um. Die Notiz zum Release wird auf die neuen Namen angepasst.

Nicht enthalten: archivierte Changes (bleiben unverändert), automatische Übernahme der alten Bibliothek.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `library-persistence`: Name der Exportdatei; Exporte unter dem früheren Namen bleiben importierbar.

## Impact

- `index.html`, `src/ui/App.tsx`, `src/main.tsx` (Fehlermeldung), `src/persistence/repository.ts` (Datenbankname, Typname), `src/persistence/fileFormat.ts` (Formatkennung, Dateiname)
- `server/app.ts`, `server/auth.ts`, `server/mail.ts`, `server/main.ts`
- `package.json`, `package-lock.json`, `vite.config.ts`, `AGENTS.md`
- Tests mit den neuen Werten. Importtests mit der alten Kennung bleiben als Nachweis, dass alte Exporte importierbar sind.
- `openspec/changes/workbook-sync/design.md` (D11)
- Außerhalb: `~/.local/bin`, `~/pub`, `~/drumstuff-server-data`, GitHub, `~/.claude/projects`, Windows-Klon
