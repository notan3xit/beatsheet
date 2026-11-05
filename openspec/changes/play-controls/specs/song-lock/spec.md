# Spec Delta

## MODIFIED Requirements

### Requirement: Gleiche Anordnung beim Entsperren
Ein Wert MUST gesperrt und entsperrt denselben Text und denselben Platz haben, entsperrt nur als Bedienelement. Das MUST für Songtitel, Song-Tempo, Patternname, Länge und die Unterteilung der Beats gelten. Das Schloss MUST beim Wechsel des Zustands an seiner Stelle bleiben, solange die Kopfzeile nicht umbricht. Die Kopfzeile MUST dabei gleich hoch bleiben.

#### Scenario: Länge
- **WHEN** der Nutzer einen Groove mit 4 Beats gesperrt ansieht und den Song entsperrt
- **THEN** zeigt der Pattern-Editor zuerst „4 Beats“ als Text und danach eine Auswahlliste mit dem Wert „4 Beats“

#### Scenario: Länge von einem Beat
- **WHEN** der Nutzer einen Groove mit 1 Beat gesperrt und entsperrt ansieht
- **THEN** zeigt der Pattern-Editor in beiden Zuständen „1 Beat“

#### Scenario: Tempo im Pattern-Editor
- **WHEN** das Song-Tempo 120 beträgt und der Nutzer den Pattern-Editor gesperrt ansieht und den Song entsperrt
- **THEN** steht zuerst „♩ = 120 (Song-Tempo)“ als Text und danach derselbe Text mit einer anklickbaren Tempoangabe

#### Scenario: Unterteilung
- **WHEN** Beat 1 in Sechzehnteln steht und der Nutzer den Pattern-Editor gesperrt ansieht und den Song entsperrt
- **THEN** zeigt Beat 1 zuerst „16tel“ als Text und danach eine Auswahlliste mit dem Wert „16tel“

#### Scenario: Höhe der Kopfzeile
- **WHEN** der Nutzer den Song auf der Doppelseite oder im Pattern-Editor entsperrt oder sperrt
- **THEN** bleibt die Kopfzeile gleich hoch, weil die dabei erscheinenden Knöpfe nicht höher sind als die Abspiel-Taste
