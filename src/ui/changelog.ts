export interface ChangelogEntry {
  version: string;
  /** Veröffentlichung als JJJJ-MM-TT. */
  date: string;
  items: string[];
}

/** Neuerungen je Version in Stichworten für Nutzer, neueste zuerst. Der oberste Eintrag ist die aktuelle Version. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.5.1',
    date: '2026-11-07',
    items: ['Ist das DRSKit nicht verfügbar, nennt „Details“ im Menü den Grund'],
  },
  {
    version: '0.5.0',
    date: '2026-11-07',
    items: [
      'Standard-Takt pro Song; Patterns folgen ihm oder haben eine eigene Taktart',
      'Neue Schlag-Arten: Drag, Rim Shot, Cross-Stick, Ride-Glocke, Choke und Betonung',
      'Fill-Kurzschrift zeigt alle Schläge, auch Hi-Hat, Ride und Ghost Notes',
      'Links „zum Groove“ und „zum Fill“ im Takt-Popover',
      'Karten der ausgewählten Takte werden auf der Patternseite hervorgehoben',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-11-05',
    items: ['Song-Ansicht passt sich der Breite an', 'Patternseite in Song-Reihenfolge, Grooves und Fills gemischt'],
  },
  {
    version: '0.3.0',
    date: '2026-11-05',
    items: ['DRSKit-Aufnahmen als Klang neben dem Synth', 'Farbschema wählbar: Wie System, Hell, Dunkel'],
  },
  {
    version: '0.2.0',
    date: '2026-11-05',
    items: [
      'Patterns mit Sequencer und Notenbild, Song-Struktur mit Grooves und Fills',
      'Patterns und Songs abspielen, ab einer Stelle und in Schleife',
      'Flams, Ghost Notes und 32tel',
      'Export und Import mit Auswahl pro Song',
      'Anmeldung per Mail, Songs im Konto und auf mehreren Geräten',
      'Workbooks zum Teilen mit anderen',
      'Songs öffnen gesperrt, ein Schloss gibt das Bearbeiten frei',
      'Song-Übersicht als Kacheln, Profile mit Name, Kürzel und Farbe',
    ],
  },
];
