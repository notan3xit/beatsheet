# Design

## Context

`SongList` rendert je Workbook eine `WorkbookCard` und eine Karte „Meine Songs“, beide mit `SongTable`. „Zu Workbook …“ ist ein `MoveMenu` in einer Tabellenspalte. `dragPattern.tsx` zieht Patterns per Pointer-Events mit Schwelle, Ziehbild und austauschbarer Trefferprüfung (`HitTestContext`). `layoutStructure` (`src/songbook/layout.ts`) liefert für die Strukturseite Segmente, Zeilen und Balken in Beats. Der Entwurf, auf den sich Maße und Farben beziehen, liegt unter `~/tools/playwright/mockups/gen.ts`.

## Goals / Non-Goals

**Goals:**
- Motiv als reine, getestete Ableitung aus `layoutStructure`, damit es der Strukturseite folgt
- Ziehen ohne neue Abhängigkeit, mit Tastatur-Alternative

**Non-Goals:**
- Ziehen aus Workbooks und zwischen Workbooks
- Eigene Reihenfolge der Songs

## Decisions

### D1: Motiv in `src/songbook/motif.ts`

`songMotif(song): MotifRow[]` mit `MotifRow = { strokes: { x, width, color, kind: 'groove' | 'fill' }[]; dots: number[] }`, alle Werte in Beats. Grundlage sind die Zeilen aller Segmente aus `layoutStructure`: Groove-Balken mit gleicher `patternId`, die lückenlos aneinander anschließen, werden zusammengefasst; Fill-Balken bleiben einzeln; leere Takte werden zu Punkten in der Taktmitte; Akzente entfallen. Ohne Segmente liefert die Funktion `[]`, sonst höchstens die ersten 12 Reihen (D2). Keine Abhängigkeit zu React, wie die übrige `songbook`-Logik.

Alternative: eigene Ableitung aus `allBars`. Verworfen, weil Zeilenumbruch und die nach links überdeckenden Fills dann doppelt implementiert wären.

### D2: Darstellung `SongMotif`

`src/ui/SongMotif.tsx` zeichnet Reihen als `div` mit absolut gesetzten Strichen (`left`/`width` in Prozent von 16 Beats, abzüglich `--motif-gap`). Farben über `patternStyle` und `--pc`: Groove `color-mix(in srgb, var(--pc) 70%, var(--bg))`, Fill `var(--pc)`, Punkte `--border`. Maße aus dem Entwurf: Strichhöhe 5px, Reihenabstand 3px, Lücke zwischen Strichen 2,5px, seitlicher Rand der Motivfläche 2,6rem. Das Motiv ist `aria-hidden`.

`songMotif` liefert höchstens `MOTIF_MAX_ROWS = 12` Reihen; 12 Reihen zu 8px füllen die Motivfläche von 6,3rem. Längere Songs werden abgeschnitten, nicht verkleinert: Einheitliche Kacheln sind wichtiger als Vollständigkeit. Ein leerer Song zeigt ein 3×3-Punktmuster.

### D3: Kachel `SongTile`

`src/ui/SongTile.tsx`: `article` mit Motivfläche oben und Text unten (Titel, „N Takte · ♩ = BPM“). Der Titel ist ein `button` mit `className="tile-open"`, dessen `::after` die ganze Kachel überdeckt; so öffnet ein Klick irgendwo die Doppelseite, und Tastatur und Bildschirmleser haben einen echten Knopf. „Zu Workbook …“ sitzt als kleiner Knopf mit einem Pfeil nach rechts in eine Box in der oberen Ecke über dieser Fläche (`--z-local-1`) und öffnet das bestehende `MoveMenu`, nur in „Meine Songs“ und nur, wenn es Ziele gibt. `SongTable` entfällt, `allBars(song).length` liefert die Takte.

„+ Song“ ist eine Kachel gleicher Größe mit gestricheltem Rand. In „Meine Songs“ ruft sie `store.createSong('')` und danach `store.openSong(id)`. Ein leerer Song öffnet nach `song-lock` entsperrt.

### D4: Bereich „Workbooks“

`src/ui/WorkbookArea.tsx` ersetzt `WorkbookCard` als Container: Seitenleiste (`nav` mit einer Liste von Knöpfen, `aria-pressed` für den gewählten) und Hauptbereich (`section`, `aria-label` = Titel). Der Hauptbereich enthält den Kopf mit `EditableHeading` (Besitzer) bzw. Überschrift, den Mitglieder-Knopf mit Initialen der ersten Mitglieder und dem `MembersPopover`, gegliedert in die Abschnitte „Mitglieder“ und, für den Besitzer, „Hinzufügen“ mit je einer Überschrift, „Workbook löschen“ (Besitzer, leer) und die Kacheln samt „+ Song“. Der gewählte Eintrag verbindet sich optisch mit dem Hauptbereich: gleiche Fläche, kein Rand zur Seite des Hauptbereichs.

Unter 40rem Breite steht die Seitenleiste als umbrechende Reihe über dem Hauptbereich.

„+ Workbook“ ruft `sync.createWorkbook('')` und wählt das neue Workbook. Dazu liefern `createWorkbook` und `createSongIn` bei Erfolg zusätzlich die ID (`{ ok: true; id: string }`), aus der Antwort des Servers bzw. dem lokal angelegten Song. „+ Song“ im Workbook öffnet danach den neuen Song.

### D5: Wahl des Workbooks

Die gewählte ID liegt in `sessionStorage` (`beatsheet.workbook`), gelesen beim Rendern der Startseite. Fehlt sie oder gibt es das Workbook nicht mehr, gilt das erste der alphabetischen Liste. Damit übersteht die Wahl das Öffnen eines Songs, ohne Navigationszustand im Store oder in der Adresse.

Alternative: Feld im `NotebookStore`. Verworfen, weil die Wahl reine Darstellung ist und weder Revision noch Speicherung berührt.

### D6: Ziehen von Kacheln

`src/ui/dragSong.tsx` folgt dem Muster von `dragPattern.tsx`, ohne dessen Takt-Logik: `pointerdown` auf einer Kachel in „Meine Songs“ merkt den Start; ab 5px Bewegung beginnt das Ziehen, die Kachel bleibt als gestrichelter Platzhalter stehen, ein Ziehbild auf `--z-drag` folgt dem Zeiger. Ziele tragen `data-drop-workbook="<id>"` (Einträge der Seitenleiste, Hauptbereich); die Trefferprüfung kommt aus `HitTestContext`. Das Ziel unter dem Zeiger erhält eine Klasse für die Hervorhebung. Beim gewählten Workbook erhalten Eintrag und Hauptbereich sie gemeinsam; hervorgehoben wird über die Randfarbe statt `outline`, damit die offene Kante zwischen Eintrag und Hauptbereich offen bleibt und beide als eine Fläche erscheinen. Solange gezogen wird, entfallen die Hover-Stile von Kacheln und „+ Song“. Loslassen auf einem Ziel ruft `sync.moveSong` über `useReportedAction`; sonst und bei Escape endet das Ziehen ohne Wirkung. Nach einem Ziehen unterdrückt ein `click`-Handler in der Erfassungsphase das Öffnen. Wie beim Ziehen von Patterns starten nur Maus und Stift ein Ziehen: Auf Touch-Geräten kollidiert es mit dem Scrollen, dort verschiebt „Zu Workbook …“.

Alternative: HTML5 Drag-and-Drop. Verworfen, weil es sich in jsdom schlecht testen lässt und vom Muster der Pattern-Karten abwiche.

### D7: Anpassung bestehender Tests

Geänderte Anforderungen tragen diese Anpassungen:
- Karten (`region` je Workbook) werden zu Einträgen der Seitenleiste und dem Hauptbereich des gewählten Workbooks; Tests wählen das Workbook vorher
- Eingabefelder zum Anlegen entfallen, Tests nutzen „+ Song“ und „+ Workbook“ und benennen danach um
- Tabellenzeilen werden Kacheln mit dem Knopf des Titels
- Mitglieder stehen im Popover statt als Text der Karte

## Risks / Trade-offs

- [Viele Workbook-Tests ändern sich] → Hilfsfunktionen in `workbooks.test.tsx` (`card`, `cardTitles`) werden einmal angepasst, die Erwartungen bleiben.
- [Ein neuer Song öffnet sich sofort] → Wer mehrere Songs hintereinander anlegen will, kehrt jedes Mal zurück. Dafür entfällt das Eingabefeld, und der Titel wird dort vergeben, wo der Song bearbeitet wird.
- [Lange Songs zeigen nur ihren Anfang] → Gewollt; das Motiv schmückt, es informiert nicht.
- [Optik nur begrenzt in jsdom testbar] → Prüfung mit `~/tools/playwright/beatsheet-check.mjs`, erweitert um die Übersicht.
