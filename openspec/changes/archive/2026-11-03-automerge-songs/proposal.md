# Proposal

## Why

Songs sollen später über einen Server mit anderen geteilt und gleichzeitig bearbeitet werden (Workbooks mit Mitgliedern). Heute gilt beim Zusammenführen der ganze Song mit der höheren Revision; gleichzeitige Änderungen an verschiedenen Stellen eines Songs gingen dabei verloren. Bevor Server und Sync entstehen, muss jeder Song als zusammenführbares Dokument (Automerge) vorliegen.

## What Changes

- Jeder Song wird lokal als Automerge-Dokument gespeichert, ein Datensatz pro Song wie bisher. Die App arbeitet weiter mit dem unveränderten Datenmodell (`Song`) und reinen Funktionen; eine Brücke überträgt jede Änderung als minimale Automerge-Änderung ins Dokument.
- Zwei unabhängig geänderte Fassungen desselben Songs lassen sich zusammenführen: Änderungen an verschiedenen Stellen bleiben beide erhalten, bei gleichzeitigen Änderungen an derselben Stelle gewinnt deterministisch eine.
- Nach dem Zusammenführen wird der Song fachlich normalisiert (z. B. Verweise auf gelöschte Patterns, Spielweisen ohne Schlag), sodass er die Strukturregeln des Dateiformats erfüllt.
- Revisionen bleiben erhalten und sind nach dem Zusammenführen höher als die jeder Ausgangsfassung, damit der Datei-Import nach Revision weiter stimmt.
- Beim ersten Start nach dem Update werden die lokal gespeicherten Songs genau einmal und unverändert in das neue Speicherformat übernommen.
- Unverändert: Bedienung, Export/Import-Dateiformat (Schemaversion 3), Undo im Pattern-Editor.

Nicht enthalten: Server, Anmeldung, Workbooks, Sync zwischen Geräten oder Tabs, Versionsverlauf in der Oberfläche, Zeichen-Merge in Titeln und Namen.

## Capabilities

### New Capabilities
- `song-merge`: Zusammenführen unabhängig geänderter Fassungen eines Songs und fachliche Gültigkeit des Ergebnisses.

### Modified Capabilities
- `library-persistence`: neue Anforderung zur einmaligen Übernahme der lokal gespeicherten Songs in das Dokumentformat.

## Impact

- Neue Abhängigkeit `@automerge/automerge` (WebAssembly, größeres Bundle)
- Neu: `src/persistence/songDoc.ts` (Dokumentform, Brücke, Laden), `src/domain/normalize.ts` (fachliche Normalisierung), Initialisierung von Automerge vor dem Öffnen des Speichers (`src/main.tsx`, `src/test/setup.ts`)
- `src/persistence/repository.ts`: IndexedDB-Version 3 mit Store für Dokumente, Migration aus Version 2 (und 1); Schnittstelle `Repository` bleibt Song-basiert
- Store, Domain-Funktionen, UI und Dateiformat bleiben unverändert
