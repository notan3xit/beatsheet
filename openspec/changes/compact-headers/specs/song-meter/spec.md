# Spec Delta

## MODIFIED Requirements

### Requirement: Eigene Taktart im Pattern-Editor
Der Pattern-Editor MUST neben der Länge das Taktart-Symbol und dahinter die wirksame Taktart zeigen. Entsperrt MUST das Symbol der Umschalter „Eigene Taktart“ sein. Ohne eigene Taktart MUST die Angabe gedämpfter Text sein. Mit eigener Taktart MUST sie entsperrt eine Auswahl der Werte des Standard-Takts sein, ohne Rahmen und Pfeil wie die Tempoangabe und auf jedem Gerät mit dessen eigener Auswahlliste. Gesperrt und entsperrt MUST die Angabe nur die Breite ihres Texts belegen. Die Auswahl MUST keinen Eintrag „Wie Song“ enthalten; das Folgen ist allein der Zustand des Umschalters.

#### Scenario: Pattern folgt dem Song
- **WHEN** der Nutzer in einem Song in 4/4 einen Groove ohne eigene Taktart öffnet
- **THEN** ist der Umschalter „Eigene Taktart“ nicht gewählt und daneben steht „4/4“ als Text

#### Scenario: Eigene Taktart einschalten
- **WHEN** der Nutzer in einem Song in 4/4 den Umschalter einschaltet
- **THEN** hat das Pattern die eigene Taktart 4/4 und daneben steht eine Auswahl mit dem Wert „4/4“

#### Scenario: Eigenen Wert wählen
- **WHEN** der Umschalter gewählt ist und der Nutzer in der Auswahl „7/4“ wählt
- **THEN** hat das Pattern die eigene Taktart 7/4

#### Scenario: Eigene Taktart ausschalten
- **WHEN** ein Pattern die eigene Taktart 7/4 hat, der Song in 4/4 steht und der Nutzer den Umschalter ausschaltet
- **THEN** hat das Pattern keine eigene Taktart mehr und daneben steht „4/4“ als Text

#### Scenario: Rückgängig
- **WHEN** der Nutzer dem Pattern die eigene Taktart 7/4 gibt und danach „Rückgängig“ wählt
- **THEN** hat das Pattern wieder den Wert davor

#### Scenario: Ohne Lücke
- **WHEN** der Nutzer einen gesperrten Groove in 6/4 ansieht
- **THEN** folgt auf „6/4“ die Kennzeichnung „Groove“ im üblichen Abstand der Kopfzeile, ohne zusätzlichen Leerraum
