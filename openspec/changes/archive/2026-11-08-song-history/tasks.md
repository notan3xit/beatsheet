# Tasks

## 1. Autor einer Änderung

- [x] 1.1 Tests aus den Szenarien erfassen (rot): „Änderung im Workbook“ und „Ohne Anmeldung“ in `src/persistence/songDoc.test.ts` bzw. `repository.test.ts` (Nachricht mit `by`, ohne Anmeldung keine), „Offline nach Neustart“ in `src/sync/account.test.ts` (Adresse aus `localStorage` vor Antwort des Servers, nach Abmelden gelöscht), Weitergabe über `receive` in `repository.test.ts`. Prüfen: `npm test -- songDoc repository account` rot
- [x] 1.2 `applySong` mit optionaler Nachricht, Lesen der Nachricht (ungültiges JSON = ohne Autor), `AccountSession` merkt die Adresse, `connectStore` und `receive` reichen sie weiter (design.md D1, D2). Prüfen: `npm test` grün

## 2. Historie lesen

- [x] 2.1 Tests (rot), `src/persistence/history.test.ts`: kausale Reihenfolge, Heads je Position bei nebenläufigen Changes, Stand je Position, Gegenstand je Change inklusive „Schlag setzen“, „Pattern aus der Struktur anlegen“ (Struktur vor Pattern) und Change ohne Wirkung (Gegenstand des vorigen). Prüfen: `npm test -- history` rot
- [x] 2.2 `persistence/history.ts` mit inkrementellem Nachspielen und Zwischenspeicher je Song; Repository-Zugriff für die Oberfläche (design.md D4). Prüfen: `npm test -- history` grün
- [x] 2.3 Laufzeit mit einem erzeugten Song von 5000 Changes messen und im Test festhalten (Öffnen unter 1 s in Node). Prüfen: `npm test -- history` grün; bei Überschreitung Fingerabdrücke nach design.md Risiken ablegen

## 3. Bearbeitungen und Unterschiede

- [x] 3.1 Tests aus den Szenarien erfassen (rot), `src/domain/history.test.ts`: „Viele Klicks“, „Unterbrechung“, „Neuer Tag“, „Fill anlegen, zuweisen, ausarbeiten“, „Kopie“, „Zusammenfassung“, „Hin und zurück“, Unterschiede eines Patterns (neu, Kopie von, umbenannt, Länge, Farbe, Taktart, Schläge neu/geändert/entfernt), „Unterteilung gewechselt“ (Lage im Beat), Unterschiede der Struktur (Segment neu/entfernt/umbenannt/verschoben, Takte umbelegt) und der Song-Daten. Ohne Prüfung von Texten. Prüfen: `npm test -- domain/history` rot
- [x] 3.2 `domain/history.ts` nach design.md D5. Prüfen: `npm test -- domain/history` grün

## 4. Wiederherstellen

- [x] 4.1 Tests aus den Szenarien erfassen (rot), `src/domain/history.test.ts`: „Gelöschten Groove zurückholen“, Pattern im Ziel nicht vorhanden, „Gelöschter Groove in der Struktur“, Song-Daten, „Ganzer Song“, Revisionen steigen; Folgen für „Änderungen anderer“ und „Nichts zu tun“. Prüfen: `npm test -- domain/history` rot
- [x] 4.2 `restoreTarget` und `restoreConsequences` nach design.md D6. Prüfen: `npm test -- domain/history` grün
- [x] 4.3 Tests (rot), `src/state/notebookStore.test.ts` und `src/persistence/repository.test.ts`: `restoreSong` erzeugt genau einen eigenen Change mit `restore` in der Nachricht, auch direkt nach einer Bearbeitung im selben Entprell-Fenster; „Eintrag im Verlauf“, „Wiederherstellung zurücknehmen“. Prüfen: `npm test -- notebookStore repository` rot
- [x] 4.4 `store.restoreSong` und Behandlung in `connectStore` (design.md D3). Prüfen: `npm test` grün

## 5. Navigation

- [x] 5.1 Tests aus den Szenarien erfassen (rot): `src/state/route.test.ts` bzw. `src/ui/urlSync.test.ts` „Neuladen im Verlauf“, Hash `#/songs/<id>/history`, unbekannter Song, „Link auf den Verlauf am Smartphone“ (`matchMedia` gestubbt); `src/ui/navigation.test.tsx` „Pfad im Verlauf“. Prüfen: `npm test -- route urlSync navigation` rot
- [x] 5.2 Ansicht `history` im Store, Route, Pfad, Doppelseite statt Verlauf unter 40rem (design.md D7). Prüfen: `npm test -- route urlSync navigation` grün

## 6. Bausteine für den Vergleich

- [x] 6.1 Tests (rot): `src/ui/sequencer.test.tsx` Vergleichsstand mit Zellen neu/geändert/entfernt und unveränderten Zeichen für Spielweise und Betonung („Spielweise geändert“); `src/songbook/motif.test.ts` Motiv mit Segmentnamen, ohne Zeilengrenze, je Takt mit ID, Groove und Fill. Prüfen: `npm test -- sequencer motif` rot
- [x] 6.2 Sequencer-Vergleich und Motiv-Funktion nach design.md D8. Prüfen: `npm test -- sequencer motif` grün
- [x] 6.3 Tests (rot), `src/ui/confirm` bzw. bestehende Dialogtests: `useConfirm` mit Titel, Inhalt und Beschriftung; Escape und „Abbrechen“ liefern `false`. Prüfen: `npm test` rot für die neuen Fälle
- [x] 6.4 `useConfirm` erweitern (design.md D8). Prüfen: `npm test` grün

## 7. Verlaufsansicht

- [x] 7.1 Tests aus den Szenarien erfassen (rot), `src/ui/songHistory.test.tsx`: „Verlauf öffnen“ (Lage zwischen „Song löschen“ und „Struktur ausklappen“), „Sperrzustand bleibt“, Liste neueste zuerst mit Tagestrennern, Bearbeitung ohne Nettounterschied gekennzeichnet, „Zwei Personen“, „Eigener Song“, Autor ohne Profil und ohne Autor, „Ältere Bearbeitung wählen“, „Zurückschritt“, „Vor der Bearbeitung“, „Umbenannt“, „Kopie“, „Groove im Refrain“ mit Hinweis ohne Zuordnung, „Takte gekürzt“, „Segment umbenannt“, „Takt überfahren“ und „Takt verlassen“ (Hinweis erscheint bei `pointermove` ohne Timer, Fläche über die volle Taktbreite, `aria-label` je Takt), „Tempo geändert“, „Max ändert gleichzeitig“; in `src/ui/styles.test.ts` „Smartphone“ (Knopf „Verlauf“ unter 40rem ausgeblendet). Prüfen: `npm test -- songHistory styles` rot
- [x] 7.2 Verlaufsansicht mit Liste, Stand, Regler und Schrittknöpfen, Hinweis zum Takt, Knopf auf der Doppelseite (design.md D7, D8). Prüfen: `npm test -- songHistory songbook` grün
- [x] 7.3 Tests aus den Szenarien erfassen (rot), `src/ui/songHistory.test.tsx`: „Groove“, „Aktueller Stand“, „Gesperrt“, Dialog „Änderungen anderer“, „Abbrechen“, „Nichts zu tun“, Bestätigen führt zur neuen Bearbeitung oben. Prüfen: `npm test -- songHistory` rot
- [x] 7.4 Wiederherstellen mit Bestätigungsdialog in der Ansicht. Prüfen: `npm test -- songHistory` grün

## 8. Gestaltung

- [x] 8.1 Tests (rot): neue Paare aus Schrift und Fläche (alter und neuer Wert, Hinweis auf Änderungen anderer, Bearbeitung ohne Nettounterschied, Hinweis zum Takt) in `src/ui/designSystem.test.ts`; in `src/ui/styles.test.ts` Markierungen ohne `red`, Hinweis zum Takt auf `--z-popover`, Rahmen der Markierungen mit 3:1 auf jeder Patternfarbe. Prüfen: `npm test -- designSystem styles` rot
- [x] 8.2 CSS nach design.md D9 mit Tokens aus `src/ui/styles.css`. Prüfen: `npm test` grün; `npm run build` fehlerfrei

## 9. Gesamtprüfung

- [x] 9.1 Im Browser mit „Toxicity“ und „In Bloom“ aus `server-data`, Hell und Dunkel, bei 1024 und 1400 px Breite: Liste, Pattern-, Struktur- und Song-Daten-Vergleich, Regler, sofortiger Hinweis beim Überfahren von Takten, Wiederherstellen mit Dialog; bei 390 px kein Knopf „Verlauf“; zweites Gerät bzw. Tab mit anderem Konto im gemeinsamen Workbook für Autoren und gleichzeitige Änderungen. Prüfen: `npm test` und `npm run build` fehlerfrei; Screenshots zeigen das erwartete Bild

## Workflow follow-up

- Mit artjom das Ergebnis durchsehen, dann committen.
