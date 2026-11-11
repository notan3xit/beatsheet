# Design

## Context

Der Server identifiziert Konten intern über die Adresse: `sessionEmail` liefert sie zur Sitzung, Workbooks, Mitglieder und Profile hängen an ihr. `users.id` ist eine zufällige UUID, die bisher nur `sessions` referenziert. Der Client kennt nur die Adresse (`AccountSession.getEmail`, im `localStorage` gemerkt) und schreibt sie als `by` in jede Change-Message (`repository.ts`, `author`). Die Workbook-Antwort liefert `members` (Adressen) und `profiles` je Adresse; Verlauf und Kachel lösen den Autor darüber auf, ohne Profil zeigen sie die Adresse. Gesehene Stände stehen unter `seen[<adresse>]` im Workbook-Dokument, der Server prüft das mit `changesAllowed`.

## Goals / Non-Goals

**Goals:**
- Neue Changes und gesehene Stände enthalten keine Adresse.
- Eine spätere Account-Löschung muss nur Zeilen in SQLite löschen, damit Autoren unauflösbar werden.

**Non-Goals:**
- Bestehende Historien und `seen`-Einträge umschreiben oder entfernen.
- Workbooks, Mitglieder und Profile auf dem Server von der Adresse auf die ID umstellen.
- Übernahme alter `seen`-Einträge auf die ID.

## Decisions

### D1: Kennung ist `users.id`
Die vorhandene zufällige UUID bezeichnet das Konto in Dokumenten. Sie entsteht beim ersten Anmelden und ändert sich nicht.
- Alternative Hash der Adresse: Wer eine Adresse vermutet, kann sie durch Hashen bestätigen; nach einer Löschung bliebe der Bezug herstellbar.
- Alternative eigene Spalte für ein Pseudonym: gleiche Eigenschaften wie `users.id`, ohne Nutzen.

### D2: Kennung zur Sitzung
`POST /api/auth/verify` und `GET /api/auth/session` antworten mit `{ email, account }`. Der Server ermittelt zur Sitzung beides (`sessionAccount` statt `sessionEmail`); `WorkbookRequest` erhält zusätzlich `account`. Der Client merkt sich beides im `localStorage` unter dem bisherigen Schlüssel als JSON. Ein gespeicherter Wert aus einer älteren Version (nur die Adresse) gilt als angemeldet ohne Kennung, bis `refresh` die Kennung vom Server holt; Änderungen in dieser Zeit tragen keinen Autor.

### D3: Mitgliederliste
Die Workbook-Antwort liefert die Mitglieder als eine Liste, Besitzer zuerst: `members: [{ email, account?, profile? }]`. `account` steht bei Mitgliedern mit Konto, `profile` bei gespeichertem Profil; die Felder `profiles` und die Adressliste entfallen. Die Liste ist eine gewöhnliche Antwort aus SQLite, der Client legt sie nur als Cache ab; Entfernen und Löschen wirken mit dem nächsten Abruf.

Der Client löst einen Autor lokal auf: Mitglied mit `account === by`, sonst mit `email === by`; gefunden erscheint `profile?.name ?? email`, sonst ist der Autor unbekannt. Ehemalige Mitglieder sind damit unbekannt, ob ausgetreten, entfernt oder später gelöscht; wer wieder eingeladen wird, erscheint wieder mit Namen, weil seine Kennung bleibt.
- Alternative zusätzliches Feld `accounts` neben `members` und `profiles`: drei Felder über dieselben Personen. Ältere Apps weist der Server als veraltet ab, die alte Form muss nicht erhalten bleiben.
- Alternative ehemalige Mitglieder merken (Spalte `left_at` in `members` oder eigene Tabelle): verworfen, ehemalige Mitglieder behalten keinen Namen; jede Abfrage von `members` müsste sie zudem ausfiltern.
- Alternative eigener Endpunkt, der Kennungen auflöst: ein Endpunkt mehr, nur nötig, wenn auch Nichtmitglieder aufgelöst werden sollen.

### D4: Autor lesen
`readChangeMessage` bleibt unverändert und liefert `by` als Text, Kennung oder Adresse. Die Unterscheidung trifft erst die Auflösung (D3).

### D5: Eigenes Konto
Überall, wo heute die eigene Adresse mit Autoren verglichen wird (`isNew`, `restoreConsequences`), gelten die eigene Kennung und die eigene Adresse als „ich“. `repository` erhält als `author` die Kennung.

### D6: Gesehene Stände
`seenOf`, `markSeen` und `changesAllowed` erhalten die Kennung statt der Adresse; die Form `seen[<schlüssel>]` bleibt, `isValidWorkbookDoc` prüft den Schlüssel weiterhin nicht. Fehlt der Eintrag unter der Kennung, greift der bestehende Beginn ohne Markierungen (`applyWorkbookReply`). Einträge unter Adressen bleiben stehen und werden nicht gelesen.

## Risks / Trade-offs

- [Ehemalige Mitglieder werden „Unbekannt“, auch mit Adresse in älteren Changes] → Bewusst (D3); dieselbe Anzeige gilt nach einer späteren Account-Löschung.
- [Am Umstieg trennt der Verlauf eine Bearbeitung derselben Person in eine mit Adresse und eine mit Kennung] → Einmalig; beide erscheinen unter demselben Namen.
- [Noch nicht angesehene Änderungen anderer verlieren beim Umstieg ihren Punkt] → Einmalig, durch den Beginn ohne Markierungen.
- [Erster Start nach dem Update ohne Server: Änderungen ohne Autor] → Bis zum ersten Kontakt mit dem Server; danach ist die Kennung gemerkt.
- [Adressen bleiben in alten Changes und `seen`-Einträgen gespeichert] → Bewusst; ein Umbau der Historien ist nicht Teil dieses Changes.

## Migration Plan

Server und App gehen gemeinsam in einer neuen Version live. Ältere Apps weist der Server als veraltet ab, sie schreiben keine Adressen mehr in den Bestand des Servers. Keine Änderung am Datenbankschema. Rückweg: Eine ältere Version zeigt Kennungen als Autor statt Namen, sonst bleibt sie funktionsfähig.
