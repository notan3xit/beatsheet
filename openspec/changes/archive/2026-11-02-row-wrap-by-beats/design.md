# Design

## Kontext

`layoutStructure` teilt die Takte eines Blocks in Stücke zu `BARS_PER_ROW = 4`. Die Breite eines Takts ist bereits proportional zu seinen Beats (`--beat` pro Beat), eine Zeile aus vier 4/4-Takten ist 16 Beats breit.

## Entscheidungen

### D1: Umbruch nach Beat-Budget

Die Takte eines Blocks werden der Reihe nach in die aktuelle Zeile gelegt. Würde ein Takt die Zeile über `BEATS_PER_ROW = 16` hinaus verlängern und ist die Zeile nicht leer, beginnt vorher eine neue Zeile. Ein Takt wird nie geteilt. Da Takte höchstens 16 Beats haben, passt jeder Takt in eine leere Zeile.

Alternative: zusätzlich höchstens 4 Takte pro Zeile beibehalten. Verworfen, weil gerade der Fall „vier 3/4-Takte und ein 4/4-Takt“ damit nicht gelöst wäre.

### D2: Keine Änderung an der UI

`StructurePage` positioniert Takte, Einfüge-Knöpfe und Popover über `row.width` und `bar.x`. Die längste mögliche Zeile bleibt 16 Beats, die Seitenbreite reicht also wie bisher.

## Risiken

- Viele sehr kurze Takte (z. B. sechzehn 1/4-Takte) ergeben eine Zeile mit vielen schmalen Takten, deren Groove-Namen stark gekürzt werden. Das ist hinnehmbar, die Breite pro Beat bleibt gleich.
