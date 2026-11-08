# Spec Delta

## ADDED Requirements

### Requirement: Wiederholte Blöcke
Ein Block MUST als flache Zeilen erscheinen, wenn ein früherer Block des Songs genauso aussieht, ob im selben oder in einem früheren Segment. Gleich aussehen heißt: gleich viele Takte, und jeder Takt hat dieselbe Länge, denselben Groove ab demselben Groove-Beat, dieselben Fill-Abschnitte und dieselben Akzente wie sein Gegenstück. Für leere Blöcke gilt allein „Leere Blöcke“.

#### Scenario: Wiederholter Block
- **WHEN** ein Segment aus vier gleichen Blöcken besteht
- **THEN** erscheint der erste Block in vollen Zeilen und die übrigen drei als flache Zeilen

#### Scenario: Block mit anderem Fill
- **WHEN** ein Segment aus zwei Blöcken besteht, die sich nur im Fill des letzten Takts unterscheiden
- **THEN** erscheinen beide Blöcke in vollen Zeilen

#### Scenario: Früherer Block im selben Segment
- **WHEN** ein Segment die Blöcke X, Y und einen Block gleich X hat
- **THEN** erscheinen X und Y in vollen Zeilen und der dritte Block als flache Zeilen

#### Scenario: Fill aus dem folgenden Block
- **WHEN** ein Segment zwei gleiche Blöcke hat und ein Fill vom Anfang des folgenden Blocks in den zweiten hineinreicht
- **THEN** erscheinen beide Blöcke in vollen Zeilen

#### Scenario: Wiederholtes Segment
- **WHEN** der Song die Segmente Verse, Chorus, Verse, Chorus hat und das zweite Verse und der zweite Chorus genauso aussehen wie die ersten
- **THEN** erscheinen das zweite Verse und der zweite Chorus mit ihren Namen und nur flachen Zeilen

#### Scenario: Block aus einem früheren Segment
- **WHEN** der letzte Refrain mit einem Block beginnt, der genauso aussieht wie ein Block eines früheren Refrains, und mit einem abweichenden Block endet
- **THEN** erscheint sein erster Block als flache Zeilen und sein zweiter in vollen Zeilen

#### Scenario: Gleiches Segment mit anderem Namen
- **WHEN** das Segment „Solo“ genauso aussieht wie das frühere Segment „Verse“
- **THEN** erscheint „Solo“ mit seinem Namen und nur flachen Zeilen

### Requirement: Leere Blöcke
Ein Block ist leer, wenn keiner seiner Takte einen Groove, einen Fill-Abschnitt oder einen Akzent hat. Ist der Song gesperrt, MUST ein leerer Block als flache Zeilen erscheinen. Ist der Song entsperrt, MUST er in vollen Zeilen erscheinen, auch wenn er einem anderen Block gleicht.

#### Scenario: Leeres Intro
- **WHEN** der Nutzer einen Song öffnet, dessen Intro aus einem Block mit vier leeren Takten besteht
- **THEN** erscheint das Intro mit seinem Namen und nur flachen Zeilen

#### Scenario: Entsperren
- **WHEN** der Nutzer diesen Song entsperrt
- **THEN** erscheint das Intro in vollen Zeilen

#### Scenario: Neues leeres Segment
- **WHEN** der entsperrte Song ein Segment mit leeren Takten hat und der Nutzer ein Segment einfügt
- **THEN** erscheinen beide Segmente in vollen Zeilen

#### Scenario: Leere Blöcke hintereinander
- **WHEN** ein Segment des entsperrten Songs aus zwei gleich langen leeren Blöcken besteht
- **THEN** erscheinen beide Blöcke in vollen Zeilen

#### Scenario: Leerer Takt mit Akzent
- **WHEN** ein Block aus einem Takt ohne Groove und Fill mit einem Crash-Akzent besteht und der Song gesperrt ist
- **THEN** erscheint der Block in einer vollen Zeile

#### Scenario: Teilweise leerer Block
- **WHEN** ein Block zwei leere Takte und zwei Takte mit Groove hat und der Song gesperrt ist
- **THEN** erscheint der Block in vollen Zeilen

### Requirement: Flache Zeilen
Eine flache Zeile MUST ihre Takte an derselben Stelle und in derselben Breite zeigen wie als volle Zeile, Grooves und Fills in denselben Farben und Tönungen. Abweichend von „Groove-Kennzeichnung im Takt“, „Fill-Blöcke“ und „Akzent-Markierungen“ MUST sie keine Namen, Startbeats, Kurzschrift und Akzente zeigen. Ihre Zeilennummer MUST bleiben. Sie MUST 0,625rem hoch sein, mit höchstens 0,125rem Abstand zur vorigen Zeile, am Blockanfang höchstens 0,25rem.

#### Scenario: Darstellung
- **WHEN** ein Block mit Groove A und am Ende Fill f1 als flache Zeile erscheint
- **THEN** zeigt die Zeile die Takte in der Farbe von A und den Fill-Abschnitt in der Farbe von f1, ohne Text

#### Scenario: Zeilennummern
- **WHEN** der zweite Refrain eines Songs in 6/4 mit den Takten 25 bis 32 flach erscheint
- **THEN** stehen neben seinen Zeilen die Nummern 25, 27, 29 und 31

#### Scenario: Höhe
- **WHEN** ein Segment aus einem Block in vollen Zeilen und drei gleichen Blöcken besteht
- **THEN** sind die flachen Zeilen 0,625rem hoch und ihr Abstand zur vorigen Zeile beträgt höchstens 0,25rem

### Requirement: Bedienung flacher Zeilen
Die Takte einer flachen Zeile MUST sich wie die Takte voller Zeilen auswählen, bearbeiten, als Ziel beim Ziehen verwenden und abspielen lassen.

#### Scenario: Ablegen in flacher Zeile
- **WHEN** der Nutzer Groove B auf einen Takt einer flachen Zeile zieht und loslässt
- **THEN** hat dieser Takt Groove B

#### Scenario: Takt in flacher Zeile auswählen
- **WHEN** der Nutzer in einer flachen Zeile auf den zweiten Takt klickt
- **THEN** ist dieser Takt ausgewählt, sein Groove-Balken ist hervorgehoben und das Popover für den Takt ist geöffnet

#### Scenario: Bereich über flache Zeilen
- **WHEN** der Nutzer Takt 1 in einer vollen Zeile anklickt und mit Shift einen Takt in der folgenden flachen Zeile
- **THEN** sind alle Takte dazwischen in Songreihenfolge ausgewählt

#### Scenario: Wiedergabe
- **WHEN** die Wiedergabe einen Takt in einer flachen Zeile erreicht
- **THEN** ist dieser Takt als laufender Takt gekennzeichnet und die Wiedergabeposition läuft durch ihn

### Requirement: Übergang zwischen vollen und flachen Zeilen
Ändert eine Bearbeitung, das Sperren bzw. Entsperren oder der Schalter „Struktur ausklappen“, ob eine Zeile flach ist, MUST die Zeile ihre Höhe und der Name ihres Segments seine Lage gleitend ändern statt zu springen. Die Auswahl MUST dabei erhalten bleiben. Wünscht das System reduzierte Bewegung, MUST der Wechsel ohne Animation erfolgen.

#### Scenario: Original ändert sich
- **WHEN** der zweite Refrain flach erscheint und der Nutzer im ersten Refrain den Fill des letzten Takts entfernt
- **THEN** fährt der zweite Refrain zu vollen Zeilen auf
- **AND** der letzte Takt des ersten Refrains bleibt ausgewählt

#### Scenario: Wiederholung entsteht
- **WHEN** der zweite Refrain sich nur durch den Fill seines letzten Takts vom ersten unterscheidet und der Nutzer diesen Takt auswählt und den Fill angleicht
- **THEN** fährt der zweite Refrain zu flachen Zeilen zusammen
- **AND** der Takt bleibt ausgewählt und sein Fill-Balken hervorgehoben

#### Scenario: Entsperren
- **WHEN** der gesperrte Song ein leeres Intro hat und der Nutzer ihn entsperrt
- **THEN** fährt das Intro gleitend zu vollen Zeilen auf

#### Scenario: Segmentname gleitet mit
- **WHEN** die Segmentnamen links stehen und der Nutzer einen Song mit leerem Intro entsperrt
- **THEN** rückt der Name „Intro“ gleitend auf die Höhe der nun vollen ersten Zeile

#### Scenario: Reduzierte Bewegung
- **WHEN** das System reduzierte Bewegung wünscht und der Nutzer den Song entsperrt
- **THEN** erscheint das Intro sofort in vollen Zeilen

### Requirement: Struktur ausklappen
Die Doppelseite MUST direkt links neben dem Schloss einen Schalter zeigen, der die Struktur aus- und wieder einklappt, gesperrt wie entsperrt. Ausgeklappt MUST abweichend von „Wiederholte Blöcke“ und „Leere Blöcke“ keine Zeile flach erscheinen. Beim Öffnen eines Songs MUST die Struktur eingeklappt sein. Das Symbol MUST den Zustand zeigen: eingeklappt zwei eng liegende Linien mit einem Pfeil nach oben darunter, ausgeklappt zwei auseinanderliegende Linien mit einem Pfeil nach unten dazwischen.

#### Scenario: Ausklappen
- **WHEN** der zweite Refrain flach erscheint und der Nutzer auf „Struktur ausklappen“ klickt
- **THEN** erscheinen alle Zeilen voll
- **AND** der Schalter heißt „Struktur einklappen“

#### Scenario: Einklappen
- **WHEN** die Struktur ausgeklappt ist und der Nutzer auf „Struktur einklappen“ klickt
- **THEN** erscheint der zweite Refrain wieder flach

#### Scenario: Gesperrter Song
- **WHEN** der gesperrte Song ein leeres Intro hat und der Nutzer die Struktur ausklappt
- **THEN** erscheint das Intro in vollen Zeilen
- **AND** der Song bleibt gesperrt

#### Scenario: Erneutes Öffnen
- **WHEN** der Nutzer die Struktur ausklappt, zur Song-Liste wechselt und den Song wieder öffnet
- **THEN** ist die Struktur eingeklappt

#### Scenario: Lage in der Kopfzeile
- **WHEN** der Nutzer den Song entsperrt
- **THEN** steht „Song löschen“ links vom Schalter und der Schalter direkt links vom Schloss

#### Scenario: Pattern-Editor
- **WHEN** der Nutzer ein Pattern im Pattern-Editor öffnet
- **THEN** zeigt die Kopfzeile keinen Schalter „Struktur ausklappen“

### Requirement: Segmentnamen neben der Struktur
Hat die linke Seite neben einer Spalte für die Segmentnamen Platz für eine Zeile von 16 Beats mit 2,25rem pro Beat, MUST jeder Segmentname in dieser Spalte auf Höhe der ersten Zeile seines Segments stehen, ohne eigene Zeile. Sonst MUST er wie bisher über den Zeilen stehen. Ein Name, der nicht in die Spalte passt, MUST umbrechen, höchstens auf zwei Zeilen, und sonst gekürzt mit vollem Namen als Tooltip erscheinen. Die Namensspalte MUST zur größten Breite der Struktur hinzukommen.

#### Scenario: Großes Fenster
- **WHEN** der Nutzer einen Song mit 16-Beat-Zeilen in einem 1650 px breiten Fenster öffnet
- **THEN** stehen die Segmentnamen links neben ihren ersten Zeilen und die Breite pro Beat beträgt 3rem

#### Scenario: Smartphone
- **WHEN** der Nutzer einen Song in einem 390 px breiten Fenster öffnet
- **THEN** stehen die Segmentnamen über ihren Zeilen

#### Scenario: Langer Name
- **WHEN** die Namen links stehen und ein Segment „Refrain mit doppelten Fills und Breaks am Ende“ heißt
- **THEN** steht der Name auf höchstens zwei Zeilen gekürzt und der vollständige Name ist als Tooltip verfügbar

#### Scenario: Segment auswählen
- **WHEN** die Namen links stehen und der Nutzer auf den Segmentnamen „Verse“ klickt
- **THEN** ist das Segment „Verse“ ausgewählt und das Segment-Popover ist geöffnet

## MODIFIED Requirements

### Requirement: Maßstabsgetreue Struktur
Jedes Segment MUST mit seinem Namen erscheinen, nach der Anforderung „Segmentnamen neben der Struktur“ links neben oder über seinen Takten, die in Zeilen zu höchstens 16 Beats stehen. Ein Takt MUST in der laufenden Zeile stehen, wenn er ganz hineinpasst, sonst in einer neuen. Ein Takt MUST NOT geteilt werden. Die Breite eines Takts MUST proportional zu seinen Beats sein, mit gleicher Breite pro Beat im ganzen Song. Jeder Block und damit jedes Segment MUST in einer neuen Zeile beginnen. Die Breite pro Beat MUST sich nach der Breite der linken Seite ohne eine Namensspalte richten, sodass eine Zeile von 16 Beats genau hineinpasst, höchstens aber 3rem. Sie MUST mindestens 2,25rem betragen, solange eine Zeile von 16 Beats mit 2,25rem in die linke Seite passt. Die Struktur MUST NOT über die linke Seite hinausragen.

#### Scenario: Unterschiedliche Taktlängen
- **WHEN** ein Segment die Takte 4/4, 2/4, 4/4 enthält
- **THEN** ist der 2/4-Takt halb so breit wie die 4/4-Takte

#### Scenario: Zeilenumbruch
- **WHEN** ein Segment 6 Takte 4/4 hat
- **THEN** stehen 4 Takte in der ersten und 2 Takte in der zweiten Zeile

#### Scenario: Kürzere Takte füllen die Zeile
- **WHEN** ein Block die Takte 3/4, 3/4, 3/4, 3/4, 4/4 enthält
- **THEN** stehen alle 5 Takte in einer Zeile

#### Scenario: Takt passt nicht mehr in die Zeile
- **WHEN** ein Block die Takte 3/4, 3/4, 3/4, 3/4, 3/4, 3/4 enthält
- **THEN** stehen 5 Takte in der ersten und 1 Takt in der zweiten Zeile

#### Scenario: Neuer Block in neuer Zeile
- **WHEN** ein Segment aus einem Block mit 2 Takten und einem Block mit 4 Takten besteht
- **THEN** stehen die 2 Takte des ersten Blocks allein in der ersten Zeile und die 4 Takte des zweiten Blocks in der zweiten Zeile

#### Scenario: Smartphone hochkant
- **WHEN** der Nutzer einen Song mit 16-Beat-Zeilen in einem 390 px breiten Fenster öffnet
- **THEN** stehen weiterhin 4 Takte 4/4 in einer Zeile, die Zeile liegt vollständig in der linken Seite und die Seite ist nicht breiter als das Fenster

### Requirement: Kompakte Zeilen
Eine volle Zeile der Struktur MUST als flacher Balken erscheinen, höchstens 1,5rem hoch, mit höchstens 0,5rem Abstand zur nächsten Zeile desselben Segments. Groove- und Fill-Namen MUST in den Balken passen oder gekürzt werden. Der vollständige Name MUST dann als Tooltip verfügbar sein. Für flache Zeilen gilt die Anforderung „Flache Zeilen“.

#### Scenario: Zeilenmaße
- **WHEN** die Struktur eines Songs dargestellt wird
- **THEN** ist jede volle Zeile höchstens 1,5rem hoch und der Zeilenabstand innerhalb eines Segments beträgt höchstens 0,5rem

#### Scenario: Langer Groove-Name
- **WHEN** ein 2/4-Takt den Groove „Verse-Beat mit Ghost Notes“ hat
- **THEN** zeigt der Takt den Namen gekürzt und der vollständige Name ist als Tooltip verfügbar
