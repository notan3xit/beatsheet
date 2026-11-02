# AGENTS.md

## Projekt

`drumstuff`: ein digitales Drum-Notenbuch. Die Song-Struktur und die Drum-Parts (Grooves, Fills) sind getrennt, jedes Pattern wird nur einmal notiert.

## Tech-Stack

- TypeScript (strict), React, Vite
- Notenrendering: VexFlow
- Persistenz: IndexedDB (`idb`), Dateiformat-Validierung mit `zod`
- Tests: Vitest, Testing Library, jsdom, fake-indexeddb
- Farben: Catppuccin, Latte (hell) bzw. Mocha (dunkel) nach Systemeinstellung, Werte aus `@catppuccin/palette` (`src/ui/theme.ts` erzeugt die Variablen `--ctp-<name>`)

**Farbregel:** Im CSS stehen keine Farbliterale (Hex, `rgb()`, benannte Farben). Komponenten verwenden die semantischen Tokens aus `src/ui/styles.css` (`--bg`, `--surface`, `--text`, `--accent`, `--danger` …), und die Tokens verweisen auf `--ctp-*`. `red` ist für Fehler und destruktive Aktionen reserviert (`--danger`). `src/ui/styles.test.ts` prüft das.

Aufbau unter `src/`:
- `domain`: reine Fachlogik. Datenmodell `Song` → `Segment` → `Block` → `Bar`, Patterns gehören zum Song. Dazu `pattern`/`sequencer` (Pattern-Inhalt), `structure` (Struktur-Operationen), `songPatterns` (Patterns im Song, Farben) und `timeline` (Groove-Fortlauf, Fill-Überdeckung).
- `notation`: Notationsmodell und VexFlow-Renderer, inklusive Mini-Darstellung (`compact`)
- `songbook`: Layout der linken Buchseite (`layout.ts`, Positionen in Beats)
- `persistence`: Dateiformat (Schemaversion 2, v1 weiterhin lesbar), Merge pro Song, IndexedDB (ein Datensatz pro Song)
- `state`: `notebookStore` (Songs, Navigation Liste/Doppelseite/Pattern-Editor, Undo im Pattern-Editor)
- `ui`: React-Komponenten

`domain`, `notation/model`, `songbook` und die Format-/Merge-Logik in `persistence` haben keine Abhängigkeit zu React oder Browser-APIs. Änderungen an einem Song laufen immer über reine Funktionen und `store.updateSong`, damit Revision und Speicherung stimmen.

## Umgebung (Windows 10)

- Ein laufender Vite-Dev-/Preview-Server sperrt unter Windows 10 Verzeichnisse im Projekt, etwa `openspec/changes/<change>`. Vor jedem Verschieben oder Umbenennen von Verzeichnissen (z. B. beim Archivieren eines Changes) laufende Vite-Prozesse dieses Projekts **ohne Nachfrage beenden**.
- Schlägt ein Verschieben trotzdem fehl, alle folgenden Schritte (Commit usw.) abbrechen und erst nach erfolgreichem Verschieben fortsetzen.

## Befehle

- `npm install`: Abhängigkeiten installieren
- `npm run dev`: Dev-Server starten
- `npm run build`: Typprüfung und Produktions-Build
- `npm test`: alle Tests einmal ausführen (`npm run test:watch` im Watch-Modus)

## Vor dem Push

- Vor jedem Push MUSS `npm test` vollständig durchlaufen und grün sein. Schlägt ein Test fehl, wird nicht gepusht, auch nicht „nur kurz“.
- Der Hook `.githooks/pre-push` erzwingt das. `npm install` aktiviert ihn über das `prepare`-Skript (`git config core.hooksPath .githooks`); in einem frischen Klon also zuerst `npm install`.
- Den Hook nicht mit `git push --no-verify` umgehen.

## Arbeitsweise: OpenSpec (spec-driven)

Änderungen werden über [OpenSpec](https://github.com/Fission-AI/OpenSpec) geplant und umgesetzt (Schema: `spec-driven`, siehe `openspec/config.yaml`).

- `openspec/specs/` – aktuelle, gültige Specs
- `openspec/changes/` – laufende Changes (Proposal, Design, Delta-Specs, Tasks)
- `openspec/changes/archive/` – abgeschlossene Changes

Ablauf:

1. **Explore** – Idee/Problem durchdenken, Anforderungen klären (`/opsx:explore`)
2. **Propose** – Change mit allen Artefakten anlegen (`/opsx:propose`)
3. **Apply** – Tasks des Changes umsetzen (`/opsx:apply`)
4. **Sync** – Delta-Specs in die Haupt-Specs übernehmen (`/opsx:sync`)
5. **Archive** – fertigen Change archivieren (`/opsx:archive`)

Planungsartefakte nachträglich anpassen: `/opsx:update`.

Regeln:

- Keine größeren Code-Änderungen ohne zugehörigen OpenSpec-Change.
- **Sprache der Artefakte:** Proposal, Design, Specs und Tasks werden auf Deutsch geschrieben. In Specs bleiben die Schlüsselwörter englisch: `MUST`/`SHALL`/`MUST NOT` in Anforderungen, `WHEN`/`THEN`/`AND`/`GIVEN` in Szenarien.
- Jeder Change muss `openspec validate <change> --strict` fehlerfrei bestehen.
- **Test-first:** Zu jedem Change werden zuerst anhand der Szenarien aus den Specs Tests geschrieben, die anfangs fehlschlagen (rot). Erst danach folgt die Implementierung. Sie ist abgeschlossen, sobald alle Tests grün sind.
- `tasks.md` bildet das ab: Pro Capability steht der Task „Tests aus den Szenarien erfassen (rot)“ vor den Implementierungs-Tasks.
- Tests dürfen nur geändert werden, wenn eine fachliche Anpassung (geänderte Anforderung bzw. geändertes Szenario) es erfordert, nie nur, um sie grün zu bekommen. Eine fachliche Änderung wird zuerst in den Specs nachgezogen, danach im Test.
- Bei der Umsetzung die Tasks in `tasks.md` abhaken, sobald sie erledigt sind.
- Weicht die Umsetzung vom Plan ab, zuerst die Artefakte aktualisieren.
