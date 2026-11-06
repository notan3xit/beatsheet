import { describe, expect, it } from 'vitest';
import { emptyBeats, patternOf } from '../test/patterns';
import { articulationAt, changeSubdivision, cycleArticulation, emphasisAt, toggleEmphasis, toggleHit } from './sequencer';
import type { Beat, Pattern } from './types';

describe('Spec pattern-sequencer › Schläge setzen und entfernen', () => {
  it('Schlag setzen', () => {
    const p = toggleHit(patternOf(emptyBeats(4)), 0, 'kick', 0);
    expect(p.beats[0]!.hits.kick).toEqual([0]);
  });

  it('Schlag entfernen', () => {
    const p = patternOf([{ hits: { kick: [1, 3] } }]);
    const toggled = toggleHit(p, 0, 'kick', 0);
    expect(toggled.beats[0]!.hits.kick).toEqual([2]);
    expect(toggleHit(toggled, 0, 'kick', 2).beats[0]!.hits).toEqual({});
  });

  it('Gleichzeitige Schläge', () => {
    let p = patternOf(emptyBeats(1));
    p = toggleHit(p, 0, 'hihat', 1);
    p = toggleHit(p, 0, 'snare', 1);
    expect(p.beats[0]!.hits).toEqual({ hihat: [1], snare: [1] });
  });

  it('Positionen bleiben sortiert', () => {
    let p = patternOf(emptyBeats(1));
    p = toggleHit(p, 0, 'hihat', 3);
    p = toggleHit(p, 0, 'hihat', 0);
    expect(p.beats[0]!.hits.hihat).toEqual([0, 3]);
  });

  it('Original bleibt unverändert', () => {
    const p = patternOf(emptyBeats(1));
    toggleHit(p, 0, 'kick', 0);
    expect(p.beats[0]!.hits).toEqual({});
  });
});

describe('Spec pattern-sequencer › Hi-Hat geschlossen und offen schließen sich aus', () => {
  it('Wechsel auf offene Hi-Hat', () => {
    const p = toggleHit(patternOf([{ hits: { hihat: [1, 3] } }]), 0, 'hihatOpen', 2);
    expect(p.beats[0]!.hits).toEqual({ hihat: [0], hihatOpen: [2] });
  });

  it('Wechsel zurück auf geschlossene Hi-Hat', () => {
    const p = toggleHit(patternOf([{ hits: { hihatOpen: [1] } }]), 0, 'hihat', 0);
    expect(p.beats[0]!.hits).toEqual({ hihat: [0] });
  });
});

describe('Spec pattern-sequencer › Unterteilung pro Beat', () => {
  it('Beat auf Triolen umstellen', () => {
    const p = patternOf(emptyBeats(4));
    const { pattern, lost } = changeSubdivision(p, 1, 3);
    expect(lost).toEqual([]);
    expect(pattern.beats.map((b) => b.subdivision)).toEqual([4, 3, 4, 4]);
  });

  it('Beat auf Zweiunddreißigsteltriolen umstellen', () => {
    const { pattern, lost } = changeSubdivision(patternOf(emptyBeats(4)), 0, 12);
    expect(lost).toEqual([]);
    expect(pattern.beats.map((b) => b.subdivision)).toEqual([12, 4, 4, 4]);
  });

  it('Beat auf Zweiunddreißigstel umstellen', () => {
    const { pattern, lost } = changeSubdivision(patternOf(emptyBeats(4)), 0, 8);
    expect(lost).toEqual([]);
    expect(pattern.beats.map((b) => b.subdivision)).toEqual([8, 4, 4, 4]);
  });
});

describe('Spec pattern-sequencer › Schläge beim Wechsel der Unterteilung', () => {
  it('Sechzehntel nach Achtel ohne Verlust', () => {
    const { pattern, lost } = changeSubdivision(patternOf([{ hits: { hihat: [1, 3] } }]), 0, 2);
    expect(lost).toEqual([]);
    expect(pattern.beats[0]).toEqual({ subdivision: 2, hits: { hihat: [0, 1] } });
  });

  it('Achtel nach Sechzehntel', () => {
    const { pattern, lost } = changeSubdivision(patternOf([{ sub: 2, hits: { snare: [1, 2] } }]), 0, 4);
    expect(lost).toEqual([]);
    expect(pattern.beats[0]).toEqual({ subdivision: 4, hits: { snare: [0, 2] } });
  });

  it('Sechzehntel nach Triole mit Verlust', () => {
    const { pattern, lost } = changeSubdivision(patternOf([{ hits: { kick: [1, 2] } }]), 0, 3);
    expect(lost).toEqual([{ instrument: 'kick', position: 1 }]);
    expect(pattern.beats[0]).toEqual({ subdivision: 3, hits: { kick: [0] } });
  });

  it('Achteltriole nach Sechzehnteltriole', () => {
    const { pattern, lost } = changeSubdivision(patternOf([{ sub: 3, hits: { snare: [1, 2, 3] } }]), 0, 6);
    expect(lost).toEqual([]);
    expect(pattern.beats[0]).toEqual({ subdivision: 6, hits: { snare: [0, 2, 4] } });
  });

  it('Sechzehntel nach Zweiunddreißigstel', () => {
    const { pattern, lost } = changeSubdivision(patternOf([{ hits: { snare: [1, 2, 3, 4] } }]), 0, 8);
    expect(lost).toEqual([]);
    expect(pattern.beats[0]).toEqual({ subdivision: 8, hits: { snare: [0, 2, 4, 6] } });
  });

  it('Zweiunddreißigstel nach Sechzehntel mit Verlust', () => {
    const { pattern, lost } = changeSubdivision(patternOf([{ sub: 8, hits: { snare: [1, 2] } }]), 0, 4);
    expect(lost).toEqual([{ instrument: 'snare', position: 1 }]);
    expect(pattern.beats[0]).toEqual({ subdivision: 4, hits: { snare: [0] } });
  });

  it('Sechzehnteltriole nach Zweiunddreißigsteltriole', () => {
    const { pattern, lost } = changeSubdivision(patternOf([{ sub: 6, hits: { snare: [1, 2, 3, 4, 5, 6] } }]), 0, 12);
    expect(lost).toEqual([]);
    expect(pattern.beats[0]).toEqual({ subdivision: 12, hits: { snare: [0, 2, 4, 6, 8, 10] } });
  });

  it('Achteltriole nach Zweiunddreißigsteltriole', () => {
    const { pattern, lost } = changeSubdivision(patternOf([{ sub: 3, hits: { snare: [1, 2, 3] } }]), 0, 12);
    expect(lost).toEqual([]);
    expect(pattern.beats[0]).toEqual({ subdivision: 12, hits: { snare: [0, 4, 8] } });
  });

  it('Instrumente ohne verbleibende Schläge verschwinden', () => {
    const { pattern } = changeSubdivision(patternOf([{ hits: { kick: [2] } }]), 0, 3);
    expect(pattern.beats[0]!.hits).toEqual({});
  });
});

/** Beat mit Spielweisen (Positionen 0-basiert). */
function withArticulations(pattern: Pattern, beat: number, articulations: Beat['articulations']): Pattern {
  return { ...pattern, beats: pattern.beats.map((b, i) => (i === beat ? { ...b, articulations } : b)) };
}

describe('Spec pattern-sequencer › Schläge setzen und entfernen (Spielweisen)', () => {
  it('Flam entfernen und neu setzen', () => {
    let p = withArticulations(patternOf([{ hits: { snare: [1] } }]), 0, { snare: { 0: 'flam' } });
    p = toggleHit(p, 0, 'snare', 0);
    p = toggleHit(p, 0, 'snare', 0);
    expect(p.beats[0]).toEqual({ subdivision: 4, hits: { snare: [0] } });
  });
});

describe('Spec pattern-sequencer › Spielweise eines Schlags', () => {
  it('Flam auf leerer Zelle', () => {
    const p = cycleArticulation(patternOf(emptyBeats(1)), 0, 'tom1', 2);
    expect(p.beats[0]!.hits).toEqual({ tom1: [2] });
    expect(articulationAt(p.beats[0]!, 'tom1', 2)).toBe('flam');
  });

  it('Shift-Klick auf der Hi-Hat', () => {
    const set = patternOf([{ hits: { hihat: [1] } }]);
    const empty = patternOf(emptyBeats(1));
    expect(cycleArticulation(set, 0, 'hihat', 0)).toEqual(set);
    expect(cycleArticulation(empty, 0, 'hihat', 1)).toEqual(empty);
  });
});

describe('Spec pattern-sequencer › Schläge beim Wechsel der Unterteilung (Spielweisen)', () => {
  it('Spielweise folgt dem Schlag', () => {
    const p = withArticulations(patternOf([{ hits: { snare: [3] } }]), 0, { snare: { 2: 'ghost' } });
    const { pattern } = changeSubdivision(p, 0, 2);
    expect(pattern.beats[0]!.hits).toEqual({ snare: [1] });
    expect(articulationAt(pattern.beats[0]!, 'snare', 1)).toBe('ghost');
  });

  it('verlorener Schlag verliert seine Spielweise', () => {
    const p = withArticulations(patternOf([{ hits: { snare: [1, 2] } }]), 0, { snare: { 0: 'flam', 1: 'ghost' } });
    const { pattern, lost } = changeSubdivision(p, 0, 3);
    expect(lost).toEqual([{ instrument: 'snare', position: 1 }]);
    expect(pattern.beats[0]).toEqual({ subdivision: 3, hits: { snare: [0] }, articulations: { snare: { 0: 'flam' } } });
  });
});

/** Schaltet die Spielweise so oft weiter und liefert die Folge der Spielweisen. */
function cycleSeen(instrument: 'snare' | 'tom1' | 'ride' | 'crash', steps: number) {
  let p = patternOf([{ hits: { [instrument]: [1] } }]);
  const seen: (string | undefined)[] = [];
  for (let i = 0; i < steps; i++) {
    p = cycleArticulation(p, 0, instrument, 0);
    seen.push(articulationAt(p.beats[0]!, instrument, 0));
  }
  return { seen, final: p };
}

describe('Spec pattern-sequencer › Spielweise eines Schlags (je Instrument)', () => {
  it('Spielweise durchschalten', () => {
    const { seen, final } = cycleSeen('snare', 6);
    expect(seen).toEqual(['flam', 'drag', 'ghost', 'rim', 'cross', undefined]);
    expect(final.beats[0]).toEqual({ subdivision: 4, hits: { snare: [0] } });
  });

  it('Spielweisen der Toms', () => {
    expect(cycleSeen('tom1', 4).seen).toEqual(['flam', 'drag', 'ghost', undefined]);
  });

  it('Glocke auf der Ride', () => {
    expect(cycleSeen('ride', 2).seen).toEqual(['bell', undefined]);
  });

  it('Choke auf leerer Crash-Zelle', () => {
    const p = cycleArticulation(patternOf(emptyBeats(1)), 0, 'crash', 1);
    expect(p.beats[0]).toEqual({ subdivision: 4, hits: { crash: [1] }, articulations: { crash: { 1: 'choke' } } });
  });
});

describe('Spec pattern-sequencer › Betonung eines Schlags', () => {
  it('Betonung umschalten', () => {
    const p = patternOf([{ hits: { hihat: [1] } }]);
    const on = toggleEmphasis(p, 0, 'hihat', 0);
    expect(on.beats[0]).toEqual({ subdivision: 4, hits: { hihat: [0] }, emphasis: { hihat: [0] } });
    expect(emphasisAt(on.beats[0]!, 'hihat', 0)).toBe(true);
    const off = toggleEmphasis(on, 0, 'hihat', 0);
    expect(off.beats[0]).toEqual({ subdivision: 4, hits: { hihat: [0] } });
    expect(emphasisAt(off.beats[0]!, 'hihat', 0)).toBe(false);
  });

  it('Betonter Flam', () => {
    const p = cycleArticulation(patternOf([{ hits: { snare: [1] } }]), 0, 'snare', 0);
    const beat = toggleEmphasis(p, 0, 'snare', 0).beats[0]!;
    expect(articulationAt(beat, 'snare', 0)).toBe('flam');
    expect(emphasisAt(beat, 'snare', 0)).toBe(true);
  });

  it('Leere Zelle', () => {
    const p = toggleEmphasis(patternOf(emptyBeats(1)), 0, 'kick', 2);
    expect(p.beats[0]).toEqual({ subdivision: 4, hits: { kick: [2] }, emphasis: { kick: [2] } });
  });

  it('Leere Zelle der Hi-Hat ersetzt die andere Variante', () => {
    const p = toggleEmphasis(patternOf([{ hits: { hihat: [1] } }]), 0, 'hihatOpen', 0);
    expect(p.beats[0]).toEqual({ subdivision: 4, hits: { hihatOpen: [0] }, emphasis: { hihatOpen: [0] } });
  });

  it('Ghost Note', () => {
    let p = patternOf([{ hits: { snare: [1] } }]);
    for (let i = 0; i < 3; i++) p = cycleArticulation(p, 0, 'snare', 0);
    expect(articulationAt(p.beats[0]!, 'snare', 0)).toBe('ghost');
    expect(toggleEmphasis(p, 0, 'snare', 0)).toBe(p);
  });

  it('Positionen bleiben sortiert, Original unverändert', () => {
    const p = patternOf([{ hits: { hihat: [1, 3] } }]);
    const beat = toggleEmphasis(toggleEmphasis(p, 0, 'hihat', 2), 0, 'hihat', 0).beats[0]!;
    expect(beat.emphasis).toEqual({ hihat: [0, 2] });
    expect(p.beats[0]!.emphasis).toBeUndefined();
  });
});

describe('Spec pattern-sequencer › Betonung folgt ihrem Schlag', () => {
  it('Schlag entfernen und neu setzen', () => {
    const emphasized = toggleEmphasis(patternOf([{ hits: { snare: [1] } }]), 0, 'snare', 0);
    const p = toggleHit(toggleHit(emphasized, 0, 'snare', 0), 0, 'snare', 0);
    expect(p.beats[0]).toEqual({ subdivision: 4, hits: { snare: [0] } });
  });

  it('Weiterschalten zur Ghost Note', () => {
    let p = cycleArticulation(cycleArticulation(patternOf([{ hits: { snare: [1] } }]), 0, 'snare', 0), 0, 'snare', 0);
    p = toggleEmphasis(p, 0, 'snare', 0);
    expect(articulationAt(p.beats[0]!, 'snare', 0)).toBe('drag');
    const beat = cycleArticulation(p, 0, 'snare', 0).beats[0]!;
    expect(beat).toEqual({ subdivision: 4, hits: { snare: [0] }, articulations: { snare: { 0: 'ghost' } } });
  });

  it('Wechsel der Hi-Hat-Variante', () => {
    const emphasized = toggleEmphasis(patternOf([{ hits: { hihat: [1] } }]), 0, 'hihat', 0);
    const beat = toggleHit(emphasized, 0, 'hihatOpen', 0).beats[0]!;
    expect(beat).toEqual({ subdivision: 4, hits: { hihatOpen: [0] } });
  });

  it('Wechsel der Unterteilung', () => {
    const emphasized = toggleEmphasis(patternOf([{ hits: { snare: [3] } }]), 0, 'snare', 2);
    const { pattern } = changeSubdivision(emphasized, 0, 2);
    expect(pattern.beats[0]).toEqual({ subdivision: 2, hits: { snare: [1] }, emphasis: { snare: [1] } });
  });

  it('verlorener Schlag verliert seine Betonung', () => {
    const emphasized = toggleEmphasis(patternOf([{ hits: { snare: [2] } }]), 0, 'snare', 1);
    const { pattern, lost } = changeSubdivision(emphasized, 0, 2);
    expect(lost).toHaveLength(1);
    expect(pattern.beats[0]).toEqual({ subdivision: 2, hits: {} });
  });
});
