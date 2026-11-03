# Design

## Context

Siehe proposal.md. Der Name steht im Projekt an wenigen Stellen: Titel, Paketname, `AGENTS.md`, Umgebungsvariable des Proxys, IndexedDB-Name und Typ `DrumstuffDB`, Formatkennung, Exportdateiname, Cookie, SQLite-Datei, Mailtexte, Startmeldung. In den Haupt-Specs steht er nicht, nur die Endung `.drumbook.json` (`library-persistence`). Außerhalb des Projekts hängen Release-Skript, `~/pub`, das Datenverzeichnis des Testservers, GitHub, der Windows-Klon und die Notizen von Claude Code daran.

## Goals / Non-Goals

**Goals:**
- Nach dem Change kommt „drumstuff“ im Projekt nur noch in archivierten Changes und in Tests für alte Exporte vor.
- Alte Exporte bleiben importierbar.

**Non-Goals:**
- Übernahme der alten IndexedDB (Export und Import genügen, siehe proposal.md).
- Änderungen an archivierten Changes.

## Decisions

### D1: Neue Werte

| Stelle | Neu |
|---|---|
| Titel (`index.html`, App-Kopf, Fehlermeldung beim Start) | „Beatsheet“ |
| `package.json` `name` | `beatsheet` |
| IndexedDB, Typ | `beatsheet`, `BeatsheetDB` |
| Formatkennung | `beatsheet.library` |
| Exportdatei | `beatsheet-<JJJJ-MM-TT>.json` |
| Cookie | `beatsheet_session` |
| SQLite-Datei | `beatsheet.sqlite` |
| Mail `from_name`, Betreff, Text | `beatsheet` |
| Proxy-Variable | `BEATSHEET_API` |

Die Exportdatei endet auf `.json`, ohne eigene Zwischenendung. Der Import erkennt Dateien an ihrem Inhalt, und der Auswahldialog filtert ohnehin nach `.json`. Eine Zwischenendung wie `.beatsheet.json` würde den Namen nur verdoppeln.

### D2: Kein Übernahmepfad für die alte Datenbank

Die neue Datenbank beginnt bei Version 3 ohne Altdaten. Der vorhandene Upgrade-Code für die Versionen 1 und 2 bleibt unverändert: Er greift unter dem neuen Namen nie, ist aber durch Tests abgedeckt und schadet nicht. Ihn zu entfernen, gehört nicht zu diesem Change.

Alternative: Beim ersten Start die Datenbank `drumstuff` lesen und übernehmen. Das kostet Code, der nach einer einmaligen Übernahme tot ist. Die Bibliothek eines einzelnen Nutzers lässt sich mit Export und Import ebenso übertragen.

### D3: Tests

- Erwartungen an Werte, die die App schreibt, bekommen die neuen Werte: Formatkennung im Export, Dateiname, Cookie, Absender, Betreff.
- Importtests, die Dateien mit `drumstuff.library` einlesen, bleiben unverändert. Sie belegen zusammen mit dem neuen Test zu „Exporte unter dem früheren Namen“, dass alte Dateien importierbar sind.
- Namen von Testdatenbanken (`drumstuff-test-…`) werden zu `beatsheet-test-…`.

### D4: Reihenfolge außerhalb des Projekts

Die Schritte stehen in proposal.md. Zwei davon sind riskant:
- **Export vor dem ersten Start der neuen Version:** Ohne ihn sind die Songs nur noch in der verwaisten alten Datenbank. Der Watch-Build veröffentlicht jede Änderung sofort unter `~/pub/drumstuff`. Er muss deshalb vor der Umsetzung angehalten werden, sonst bekommt die alte Adresse die umbenannte App mit leerer Bibliothek.
- **Umbenennen des Projektverzeichnisses:** Das beendet die Sitzung von Claude Code. Es kommt deshalb zuletzt, nach Commit und Push.

## Risks / Trade-offs

- [Export vergessen] → Die Daten bleiben in der IndexedDB `drumstuff` des Browsers, bis sie gelöscht wird. Eine Version vor diesem Change kann sie wieder lesen und exportieren. Gelöscht wird die alte Datenbank deshalb erst nach erfolgreichem Import.
- [Lesezeichen und Links auf `/drumstuff/` führen ins Leere (404)] → Es gibt nur einen Nutzer. Einen Verweis braucht es nicht.
- [Sitzung endet wegen des neuen Cookie-Namens] → einmal neu anmelden, es gibt nur Testkonten.

## Migration Plan

Siehe proposal.md, „Außerhalb des Projektordners“. Rückweg: Commit zurücknehmen. Die alte Datenbank und `~/pub/drumstuff` bleiben bis zum erfolgreichen Import erhalten.
