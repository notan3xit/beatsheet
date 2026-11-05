# Proposal

## Why

Die Kopfzeile zeigt den App-Namen als schlichten Text. Ein Logo gibt Beatsheet ein wiedererkennbares Gesicht: eine Rote Beete als Wortspiel auf „beat“ und ein Schriftzug, dessen „e“s aus farbigen Strichen bestehen wie die Reihen des Song-Motivs.

## What Changes

- In der Kopfzeile steht statt „Beatsheet“ als Text ein Logo: Symbol einer Roten Beete, daneben der Schriftzug „beatsheet“ in Kleinbuchstaben.
- Der Schriftzug erscheint in einer eigenen, runden Schrift (Comfortaa). Die App liefert sie selbst aus, die übrige Oberfläche behält ihre Schrift.
- Jedes „e“ besteht aus drei waagerechten, farbigen Strichen mit runden Enden. Der mittlere ist kürzer, die drei zusammen sind so hoch wie die Kleinbuchstaben.
- Die Kopfzeile behält „Beatsheet“ als zugänglichen Namen.
- Die Farbregel erlaubt für das Logo zusätzlich die Mischung zweier Palettenfarben; damit erhält die Beete ein Violett zwischen Mauve und Maroon.
- Nicht enthalten: Favicon und App-Symbol, sie folgen in eigenen Changes.

## Capabilities

### New Capabilities

_Keine._

### Modified Capabilities

- `app-header`: neue Anforderungen an das Logo in der Kopfzeile (Symbol, Schriftzug, „e“-Striche, Schrift, zugänglicher Name).
- `color-theme`: „Farben ausschließlich aus der Palette“ erlaubt für das Logo die Mischung zweier Palettenfarben außer „red“.

## Impact

- `src/ui/AppHeader.tsx`: Logo statt Text im `h1`; neue Komponente für Symbol und Schriftzug in `src/ui`.
- `src/ui/styles.css`: Logo-Tokens (Farben der Beete und der Striche) und Stile für den Schriftzug.
- Neue Abhängigkeit `@fontsource/comfortaa` (Schriftdateien werden mit der App gebaut und vom eigenen Server ausgeliefert).
- Tests: `src/ui/appMenu.test.tsx` (Überschrift „Beatsheet“ bleibt auffindbar), `src/ui/styles.test.ts` (Farbregel).
