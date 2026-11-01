import { describe, expect, it } from 'vitest';
import { emptyBeats, patternOf } from '../test/patterns';
import { changeSubdivision, toggleHit } from './sequencer';

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

  it('Instrumente ohne verbleibende Schläge verschwinden', () => {
    const { pattern } = changeSubdivision(patternOf([{ hits: { kick: [2] } }]), 0, 3);
    expect(pattern.beats[0]!.hits).toEqual({});
  });
});
