# Design

## Context

Die Ansicht hängt an `view.kind` im `notebookStore` (`list`, `book`, `pattern`); `store.backToList()` und `store.backToBook()` existieren bereits. Songtitel und Patternname werden über `CommitField` bearbeitet (übernimmt beim Verlassen/Enter und zeigt danach den tatsächlich gespeicherten Wert). Die Song-Liste ist eine `<ul>` aus Knöpfen mit `border-bottom`.

## Goals / Non-Goals

**Goals:**
- Eine gemeinsame Kopfzeile für Doppelseite und Pattern-Editor: Pfad oben, Überschrift darunter.
- Bearbeiten der Überschrift an Ort und Stelle mit klaren Regeln für Übernehmen und Verwerfen.
- Tabellarische Song-Liste ohne Änderung an Domäne oder Store.

**Non-Goals:**
- Browser-Verlauf/URLs (Zurück-Taste des Browsers), Tastenkürzel für die Navigation.
- Umbenennen von Segmenten (bleibt im Popover mit `CommitField`).

## Decisions

### D1: `Breadcrumbs`

`<nav aria-label="Pfad"><ol>` mit je einem Knopf pro Ebene: „Songs“ (`store.backToList()`) und im Pattern-Editor zusätzlich der Songtitel (`store.backToBook()`). Die Trenner `›` kommen per CSS (`li::after`), nicht als Text, damit Screenreader nur die Ziele lesen. Die Knöpfe sind flach (Link-Optik, Farbe `--muted`, beim Überfahren `--text`). Das aktuelle Blatt steht nicht im Pfad, sondern als Überschrift darunter.

Alternative: alles in einer Zeile mit dem aktuellen Blatt als letztem Glied. Verworfen, mit dem Nutzer abgestimmt (zweizeilig liest sich klarer).

### D2: `EditableHeading`

Komponente mit `label`, `value`, `onCommit(draft) => gespeicherter Wert` (wie `CommitField`):

- Ruhezustand: `<h2><button class="heading-edit" title="Zum Umbenennen klicken">{value}</button></h2>`. Die Überschrift ist damit auch per Tastatur erreichbar; ihr zugänglicher Name ist der Titel.
- Bearbeiten: `<h2><input aria-label={label} value={draft} autoFocus /></h2>`, Text vorausgewählt.
- Enter → `blur()`; `onBlur` → `onCommit(draft)`, zurück in den Ruhezustand. Escape → Flag „verwerfen“ setzen, Entwurf verwerfen, Ruhezustand; der nachfolgende Blur übernimmt nichts.
- Ein abgelehnter (leerer) Name: `onCommit` liefert den gespeicherten alten Namen; die Überschrift zeigt ihn.

Die Schrift von Überschrift und Feld ist gleich (gleiche Größe, Feld ohne Rahmen bis auf eine Unterlinie), damit beim Umschalten nichts springt.

### D3: Kopfzeilen

- Doppelseite (`SongHeader`): Zeile 1 `Breadcrumbs` [Songs], Zeile 2 `EditableHeading` (label „Songtitel“) und rechts „Song löschen“.
- Pattern-Editor: Zeile 1 `Breadcrumbs` [Songs, Songtitel], Zeile 2 `EditableHeading` (label „Name“), daneben Typ-Kennzeichnung, Länge und die Aktionen wie bisher. Der Knopf „Zurück zum Song“ entfällt. Die Zeile richtet sich an der Schriftlinie aus (`align-items: baseline`), das Längenfeld steht einzeilig (Label links neben einem kompakten Dropdown), damit nichts unter den Titel hängt und der Typ-Chip nicht zu hoch sitzt. (Nachtrag nach Browser-Prüfung)
- Song-Liste: `<h2>Songs</h2>` über dem Anlegen-Formular.

### D4: Song-Tabelle

`<table class="songs">` mit `<thead>` (Titel, Takte, Grooves, Fills) und einer Zeile pro Song. Die Titelzelle enthält den Knopf zum Öffnen (Tastatur, zugänglicher Name = Titel); ein Klick irgendwo in der Zeile öffnet den Song ebenfalls (`onClick` an `<tr>`, Cursor `pointer`, Hover-Fläche `--accent-soft`). Zahlen rechtsbündig mit `font-variant-numeric: tabular-nums`. Linien: `border-top` und `border-bottom` an der Kopfzeile, `border-bottom` an jeder Zeile, alles `--border`. Zahlen: `allBars(song).length`, Patterns nach `kind` gezählt.

## Risks / Trade-offs

- [Bestehende Tests verwenden „Alle Songs“, „Zurück zum Song“ und die Felder „Songtitel“/„Name“] → fachliche Änderung der Bedienung; die Tests werden mit den Szenarien angepasst (siehe Proposal, Impact).
- [Versehentliches Umbenennen durch Klick auf die Überschrift] → Escape verwirft; ein unveränderter Name ändert nichts, weil `renameSong` und `renamePattern` bei gleichem Namen nichts speichern (keine neue Revision).
- [Klick auf die Zeile und Knopf in der Titelzelle lösen doppelt aus] → harmlos, beide rufen `openSong` mit derselben ID auf; der Knopf bleibt für die Tastaturbedienung.

## Ergebnis der Browser-Prüfung

Am 2026-11-02 vom Nutzer im Release-Build (pub) geprüft: Pfad und Überschrift, Umbenennen an Ort und Stelle und die Song-Tabelle passen. Der Kopf des Pattern-Editors wurde nachgebessert (Ausrichtung an der Schriftlinie, einzeiliges Längenfeld) und danach freigegeben.
