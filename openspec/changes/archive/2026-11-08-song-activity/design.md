# Design

## Context

Jeder Song ist ein Automerge-Dokument; jeder Change trägt Zeit (Sekunden, Geräteuhr) und, angemeldet, den Autor als JSON-Nachricht `{"by": …}` (`songDoc.ts`, `readChangeMessage`). Workbooks sind dagegen Zeilen in SQLite und werden über REST verwaltet. Inhalte reisen über `POST /api/workbooks/<id>/sync` (`server/songs.ts`, `syncSongs`): je Song `base` (letzter gemeinsamer Stand) und `changes`, zurück die Changes anderer und die neuen Heads. Der Server prüft das Ergebnis mit `isValid` als Song und meldet Änderungen über das Ereignis `workbook` an alle Mitglieder. Der Client hält je Song `serverHeads` in IndexedDB (`repository.ts`, Version 4).

## Goals / Non-Goals

**Goals:**
- Gesehene Stände als Automerge-Daten, über den bestehenden Abgleich, ohne neue Endpunkte.
- Song-Dokumente, Verlauf und `applySong` bleiben unberührt.
- Letzte Änderung und Neues als reine, testbare Funktionen über Song-Dokument und gesehenen Stand.

**Non-Goals:**
- Song-Liste eines Workbooks im Workbook-Dokument.
- Anzeigen, was andere gesehen haben.
- Aufräumen von Einträgen gelöschter Songs.

## Decisions

### D1: Form des Workbook-Dokuments
`{ v: 1, seen: { "<adresse>": { "<songId>": "<hash>,<hash>" } } }`, Heads sortiert und als `ImmutableString` verbunden. Jedes Mitglied schreibt nur unter seiner Adresse, Mitglieder geraten also nicht in Konflikt; zwei eigene Geräte überschreiben einander je Song (letzter Schreiber), schlimmstenfalls erscheint ein Punkt bis zum nächsten Öffnen wieder.
- Alternative Heads als Automerge-Liste: Gleichzeitige Schreiber würden Listen verschränken statt ersetzen.
- Alternative Einträge im Song-Dokument: jedes Ansehen ein Song-Change; Verlauf, letzte Änderung, Neues und `applySong` müssten sie ausnehmen.

### D2: Ablage auf dem Server
Tabelle `workbook_docs (workbook_id PRIMARY KEY, doc BLOB NOT NULL)`. Der Server legt das Dokument beim ersten Abgleich an, der einen Teil `workbook` mitbringt, als einziger Schreiber dieses Anfangs; so entstehen keine unverwandten Fassungen, und bestehende Workbooks brauchen keine Migration. Für den eigenen Bestand ignoriert er den Teil. Löschen eines Workbooks löscht das Dokument mit. Die Größe zählt wie Songs zur Belegung des Besitzers (`quota.check`).
- Alternative Zeile in `songs` mit reservierter ID: berührt Zählung, Liste, Verschieben, Löschen und die Löschsperre.
- Alternative Anlegen beim Anlegen des Workbooks: braucht trotzdem einen Weg für bestehende Workbooks.

### D3: Abgleich
Anfrage: optional `workbook: { base, changes? }`; ein Client ohne Dokument sendet `base: []` und erhält das ganze Dokument als Changes seit `[]`. Antwort: `workbook: { status: 'ok', changes?, heads }` oder, bei unbekannter `base` bzw. abgelehnter Fassung, `{ status: 'unrelated' | 'invalid', doc }`; der Client übernimmt dann `doc` und verliert seine nicht übertragenen Einträge. Prüfung: Form des ganzen Dokuments (D1) und `A.diff(merged, serverHeads, mergedHeads)`, dessen Pfade alle mit `['seen', <adresse des Anfragenden>]` beginnen; dazu die Grenze von 2 MB. Ändert sich das Dokument, folgt das Ereignis `workbook` wie bei Songs. Ältere Clients senden den Teil nicht; ein älterer Server ignoriert ihn.

### D4: Ablage im Client
IndexedDB Version 5 mit Store `workbookDocs` `{ id, bytes, serverHeads }`. Das Repository lädt sie mit den Songs und bietet: gesehenen Stand lesen, eigenen Eintrag setzen, ausgehende Changes, Antwort übernehmen, Fassung des Servers übernehmen. `forgetWorkbookSongs` und der Verlust eines Workbooks entfernen sie. `syncWorkbook` sendet den Teil nur für gemeinsame Workbooks und wendet die Antwort zusammen mit den Songs an.

### D5: Letzte Änderung
Aus den Heads des Song-Dokuments: `A.inspectChange` je Head, die mit der größten Zeit, Autor aus ihrer Nachricht. Zwischengespeichert je Song bis zur nächsten Änderung der Heads, wie die Historie. Changes ohne sichtbare Wirkung zählen mit; den Verlauf je Kachel zu lesen wäre zu teuer.

### D6: Neues (`persistence/activity.ts`, rein)
`isNew(doc, seen, me)`:
- Kein Eintrag: neu, wenn ein Change aus `A.getChangesMetaSince(doc, [])` einen Autor ≠ `me` trägt.
- Ein Head von `seen` ist dem Dokument unbekannt (`A.hasHeads`): nicht neu; sicher Neues lässt sich ohne dessen Vorgänger nicht bestimmen, und der Stand trifft mit dem nächsten Abgleich ein.
- Sonst neu, wenn `A.getChangesMetaSince(doc, seen)` einen Change mit Autor ≠ `me` enthält und `sameSong(songOf(A.view(doc, seen)), songOf(doc))` falsch ist.

Changes ohne Autor zählen als fremd. Zwischengespeichert je Song nach Heads und gesehenem Stand.

### D7: Gesehen schreiben
Der Abgleich (`sync.ts`) beobachtet den Store und setzt beim Öffnen eines Songs in einem gemeinsamen Workbook den eigenen Eintrag auf die aktuellen Heads und danach entprellt (1 s) bei jeder Änderung des Songs, solange er offen ist; nur wenn der Song nach D6 Neues enthält oder noch keinen Eintrag hat, sodass eigene Bearbeitungen das Workbook-Dokument nicht wachsen lassen. Ohne Anmeldung oder Adresse wird nichts geschrieben.

### D8: Beginn ohne Markierungen
Nach dem Anwenden einer Abgleich-Antwort: Hat das Dokument keinen Eintrag für die eigene Adresse, setzt der Client einen mit den aktuellen Heads aller Songs des Workbooks, die er kennt. Danach existiert der Eintrag, der Schritt läuft also einmal je Konto und Workbook.
- Alternative auf dem Server: kennt die Songs auch, müsste aber Changes im Namen des Nutzers schreiben.

### D9: Oberfläche
- Kachel: zweite Metazeile mit Zeit und, im gemeinsamen Workbook, Autor (Name aus `profiles`, sonst Adresse); Punkt als Symbol in Akzentfarbe mit zugänglichem Namen „neu“.
- Seitenleiste: derselbe Punkt am Eintrag, wenn eine Kachel des Workbooks einen trägt.
- Relative Zeit als reine Funktion `formatRelative(time, now)` in `historyText.ts`; die Startseite rendert jede Minute neu.
- Farben nach `design-system`; neue Paare aus Schrift und Fläche kommen in `designSystem.test.ts`.

## Risks / Trade-offs

- [Workbook-Dokument wächst mit jedem Ansehen] → geschrieben wird nur bei geänderten Heads; ein Eintrag sind rund 100 Bytes je Ansehen mit Neuem.
- [Uhren der Geräte gehen falsch] → betrifft nur die Zeitangabe; Neues hängt an Heads (D6), Zukunftszeiten erscheinen als „gerade eben“.
- [Letzte Änderung ohne sichtbare Wirkung, etwa ein Schlag hin und zurück] → Zeit erscheint trotzdem neu; hingenommen (D5).
- [Ein `invalid` oder `unrelated` verwirft eigene nicht übertragene Einträge] → schlimmstenfalls erscheinen Punkte wieder bis zum nächsten Öffnen.
- [Lesebestätigungen für Mitglieder] → bewusst akzeptiert, nicht angezeigt.

## Migration Plan

Server: `CREATE TABLE IF NOT EXISTS`, Dokumente entstehen beim ersten Abgleich. Client: IndexedDB-Upgrade 4 → 5 legt den Store an. D8 verhindert eine Flut von Punkten beim ersten Start. Rückweg: Ein älterer Client oder Server ignoriert den Teil `workbook`; die Tabelle bleibt ungenutzt.
