# Spec Delta

## MODIFIED Requirements

### Requirement: Song-Wiedergabe endet beim Verlassen
Verlässt der Nutzer die Doppelseite, etwa zur Song-Liste oder in den Pattern-Editor, MUST die Wiedergabe enden. Song- und Pattern-Wiedergabe MUST NOT gleichzeitig laufen.

#### Scenario: Pattern öffnen während der Wiedergabe
- **WHEN** der Song läuft und der Nutzer auf der Patternseite den Groove „Verse“ öffnet
- **THEN** erklingt kein weiterer Schlag und der Pattern-Editor zeigt „In Schleife abspielen“
