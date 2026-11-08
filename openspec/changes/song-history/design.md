# Design

## Context

Jeder Song ist ein Automerge-Dokument (`songDoc.ts`), das `A.save` mit seiner vollständigen Historie speichert, lokal wie auf dem Server. `connectStore` schreibt Änderungen des Stores entprellt (300 ms) über `repository.write` → `applySong` → `A.change(doc, d => syncMap(d, ziel))`; ein Automerge-Change fasst also die Bearbeitungen eines Entprell-Fensters zusammen. Changes tragen Zeit (Sekunden, Geräteuhr) und Actor, aber keine Nachricht; der Actor ist je Laden zufällig und taugt nicht als Person. Der Anmeldestatus (`AccountSession`) hält die Adresse nur im Speicher und kennt sie nach einem Start ohne Netz nicht.

Das Mock-up (https://pub.artjomweyand.de/beatsheet-verlauf/) legt Verhalten und Aufbau fest, nicht die Gestaltung; Farben, Flächen und Schrift folgen `design-system`.

## Goals / Non-Goals

**Goals:**
- Historie aus dem vorhandenen Dokument lesen, ohne Server- oder Formatänderung.
- Gruppierung, Nettounterschiede und Wiederherstellen als reine, testbare Funktionen.
- Vorhandene Bausteine wiederverwenden: Sequencer (lesend), Motiv-Logik, Bestätigungsdialog, Schloss, Kürzel der Mitglieder.

**Non-Goals:**
- Verlauf im Pattern-Editor oder gefiltert nach Pattern.
- Autoren für Changes vor dieser Version.
- Verdichten oder Kürzen der Historie.

## Decisions

### D1: Autor und Wiederherstellung in der Change-Nachricht
`applySong` bekommt eine optionale Nachricht und schreibt sie per `A.change(doc, { message }, …)`. Format: JSON `{"by":"<adresse>"}`, bei Wiederherstellungen zusätzlich `"restore":<Unixzeit des Zielstands>`. Ohne Anmeldung keine Nachricht. Beim Lesen gilt eine Nachricht, die kein solches JSON ist, als ohne Autor; unbekannte Felder werden ignoriert, damit das Format wachsen kann.
- Alternative Actor-ID je Person: Zwei Tabs mit derselben Actor-ID erzeugen widersprüchliche Changes gleicher Nummer und beschädigen das Dokument.
- Alternative Protokoll auf dem Server: belastbarer, aber neue Tabelle und API; im Workbook sind die Mitglieder einander bekannt, der selbst erklärte Autor genügt.

### D2: Adresse der Sitzung lokal merken
`AccountSession` legt die Adresse beim Anmelden bzw. bei erfolgreichem `refresh` in `localStorage` ab und liest sie beim Start, bevor der Server antwortet; beim Abmelden wird sie gelöscht. Damit tragen auch Offline-Änderungen nach einem Neustart den Autor. `connectStore` erhält einen Getter für die Adresse und reicht sie an `repository.write` und `receive` weiter (auch `receive` schreibt lokale Änderungen per `applySong`).

### D3: Wiederherstellung als eigener Change
Eine Wiederherstellung darf nicht mit Klicks im selben Entprell-Fenster verschmelzen, sonst trüge sie deren Änderungen oder verlöre ihre Markierung. Der Store bekommt `restoreSong(ziel, zielzeit)`: Er übernimmt den Song wie `updateSong` und meldet eine Notiz für diesen Song; `connectStore` schreibt beim Eintreffen einer Notiz zuerst ausstehende Änderungen und dann die Wiederherstellung sofort als eigenen Change mit `restore` in der Nachricht.

### D4: Historie lesen (`persistence/history.ts`)
Das Repository liefert je Song die Changes in kausaler Reihenfolge (`A.getAllChanges` + `A.decodeChange`): Hash, Zeit, Autor, Wiederherstellungsziel. Für jede Position der Reihenfolge gelten als Heads die Hashes dieser Position und davor, von denen kein anderer davor abhängt; der Stand dort ist `songOf(A.view(doc, heads))`. Der Gegenstand jedes Changes ergibt sich aus dem Vergleich der Stände vor und nach ihm (Song-Daten, Struktur, je Pattern über einen Fingerabdruck ohne `revision`/`updatedAt`). Die Berechnung läuft einmal beim Öffnen des Verlaufs durch inkrementelles Nachspielen der Changes und wird bis zur nächsten Änderung des Songs zwischengespeichert; Stände werden nur für Gruppengrenzen und die Reglerposition materialisiert.
- Alternative `A.diff`-Pfade statt Vergleich: billiger, aber Pfade nennen Listenindizes statt Pattern-IDs, und Verschieben erscheint als Löschen plus Einfügen.

### D5: Bearbeitungen und Unterschiede als reine Funktionen (`domain/history.ts`)
Eingabe: Schritte mit Zeit, Autor, Gegenstand und Zugriff auf Stände. Ausgabe: Bearbeitungen nach `song-history` (Lauf aus Autor, Gegenstand, Kalendertag in Ortszeit; leere Neuanlage über Unterbrechungen; ohne Nettounterschied) und je Bearbeitung ein strukturierter Unterschied (`pattern-added`, `copy-of`, `renamed`, `hits` mit neu/geändert/entfernt nach Lage im Beat …). Texte entstehen erst in der Oberfläche. Die Lage eines Schlags ist Beat plus Position × 24 / Unterteilung, damit Raster-Wechsel keine Schläge verschieben.

### D6: Wiederherstellen als Zielsong
`restoreTarget(aktuell, ziel, umfang)` baut den neuen Song, keine Operationen; `syncMap` leitet die minimalen Automerge-Operationen ab wie bei jeder Bearbeitung.
- Pattern: Zustand aus dem Ziel, `revision` = aktuelle + 1; gelöscht → mit derselben ID angehängt, ohne Taktzuordnungen; im Ziel nicht vorhanden → `removePattern` (entfernt auch Zuordnungen).
- Struktur: Segmente aus dem Ziel; Patterns, auf die sie verweist und die fehlen, aus dem Ziel anhängen.
- Song-Daten: Titel, Tempo, Standard-Takt aus dem Ziel. Ganzer Song: Ziel mit fortgeschriebenen Revisionen.
- Ergebnis immer durch `normalizeSong`.
`restoreConsequences(aktuell, ziel, umfang, schritteDanach)` liefert für den Dialog nur Kategorien (zurückgesetzt, wieder angelegt, gelöscht, Song-Daten alt/neu) und die Autoren betroffener späterer Änderungen außer dem eigenen.

### D7: Ansicht und Navigation
Neue Ansicht `{ kind: 'history' }` im Store, Route `#/songs/<id>/history`, Pfad „Songs / Titel“. Links die Liste, rechts der Stand der gewählten Bearbeitung. Unter 40rem Fensterbreite, der Grenze, ab der die App schon ihr Smartphone-Layout zeigt, gibt es den Verlauf nicht: Der Knopf ist per CSS ausgeblendet, und `connectUrl` öffnet für eine Verlaufsadresse die Doppelseite, wenn `matchMedia('(max-width: 40rem)')` zutrifft. Ein schmales Layout des Verlaufs entfällt damit. Sperrzustand wie bei Doppelseite und Pattern-Editor; das Schloss sitzt oben wie dort. Gewählte Bearbeitung und Reglerposition hängen am Hash ihrer letzten Änderung bzw. am Schritt-Hash, damit eintreffende Änderungen die Auswahl nicht verschieben.

### D8: Wiederverwendete Bausteine
- Sequencer mit `readOnly` und einem optionalen Vergleichsstand, aus dem er je Zelle `added`/`changed`/`removed` ableitet; entfernte Schläge erscheinen als leere Zelle mit Markierung. Spielweisen und Betonungen bleiben die vorhandenen Zeichen.
- Motiv: neue reine Funktion in `songbook` für Segmente mit Namen, ohne Zeilengrenze und je Takt ein Element mit Takt-ID; `songMotif` der Kachel bleibt.
- Hinweis zum Takt: eigener Hinweis statt `title`, weil der Browser `title` erst nach rund einer Sekunde zeigt und man beim Vergleichen Takt für Takt überfährt. Je Takt ein unsichtbares Element über die volle Taktbreite und etwas höher als der Strich trägt Taktnummer, Groove und Fill; ein einziges Hinweis-Element je Motiv folgt dem Zeiger (`pointermove`), erscheint ohne Verzögerung und verschwindet bei `pointerleave`. Der Hinweis nimmt keine Zeigerereignisse an, bleibt im Fenster und liegt auf `--z-popover`. Der Takt nennt denselben Text als `aria-label`.
  - Alternative `title`: kein eigener Code, aber die Verzögerung ist nicht steuerbar.
- Dialog: `useConfirm` akzeptiert neben einem Text eine Form mit Titel, Inhalt und Beschriftung der Bestätigung; Darstellung über die vorhandenen Klassen `backdrop`, `dialog`, `dialog-actions` und `--z-modal`.
- Personen: `MemberAvatar` mit Profil aus dem Workbook.

### D9: Gestaltung nach `design-system`
- Markierungen im Sequencer unterscheiden sich in der Form (neu: durchgezogener Ring, geändert: zweiter, abgesetzter Ring, entfernt: gestrichelter Rahmen der leeren Zelle). Farben aus semantischen Tokens ohne `red`, Rahmen mit 3:1 zur Seitenfläche auf jeder Patternfarbe.
- Alt/neu: alter Wert gedämpft und durchgestrichen, neuer in Fließtext auf einer getönten Fläche aus `--success`; beide Paare kommen in die Tabelle von `designSystem.test.ts`.
- Hinweis auf Änderungen anderer: getönte Fläche aus `--warning` mit Fließtext, ebenfalls in der Tabelle.
- Hinweis zum Takt: Fließtext auf `--surface` mit Rahmen in `--border`, wie die Popover der App; das Paar steht bereits in der Tabelle oder kommt hinzu.
- Motiv: Unverändertes in `--border`, Geändertes in der Patternfarbe wie auf der Kachel.
- Bearbeitung ohne Nettounterschied: gedämpfter Text.

## Risks / Trade-offs

- [Lange Historien machen das Öffnen langsam] → Gegenstand je Change einmal berechnen und je Song zwischenspeichern; Messung mit einem Song von mehreren tausend Changes als Task; bei Bedarf Fingerabdrücke in IndexedDB ablegen.
- [Uhren der Geräte gehen falsch] → Zeiten sind nur Anzeige; die Reihenfolge folgt der Kausalität.
- [Selbst erklärter Autor ist fälschbar] → bewusst akzeptiert (D1); nur Mitglieder schreiben in ein Workbook.
- [Wiederherstellung trifft gleichzeitige Änderungen] → Automerge führt schlüsselweise zusammen; der Dialog warnt vor Änderungen anderer seit dem Zielstand.
- [Dokument wächst] → Nachrichten sind kurz und wiederholen sich; die Server-Grenze von 2 MB je Übertragung bleibt unberührt.

## Migration Plan

Keine Migration: Bestehende Changes bleiben ohne Autor, das Dateiformat und der Server bleiben unverändert. Ältere App-Versionen ignorieren die Nachricht.
