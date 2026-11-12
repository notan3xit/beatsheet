import { describe, expect, it } from 'vitest';
import { createPracticeStore } from './practice';

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value), data };
}

describe('Spec practice-tempo › Übetempo bleibt auf dem Gerät', () => {
  it('Neu laden: ein neuer Store über denselben Speicher liest den Wert', () => {
    const storage = memoryStorage();
    createPracticeStore(storage).setTempo('hysteria', 85);
    expect(createPracticeStore(storage).tempo('hysteria')).toBe(85);
  });

  it('Anderer Song: ohne eigenen Wert nichts gespeichert', () => {
    const store = createPracticeStore(memoryStorage());
    store.setTempo('hysteria', 85);
    expect(store.tempo('other')).toBeUndefined();
  });

  it('Abonnenten erfahren Änderungen', () => {
    const store = createPracticeStore(memoryStorage());
    let calls = 0;
    store.subscribe(() => calls++);
    store.setTempo('hysteria', 85);
    store.setEnabled('hysteria', true);
    expect(calls).toBe(2);
  });

  it('unlesbarer Eintrag gilt als leer', () => {
    const storage = memoryStorage();
    storage.data.set('beatsheet.practice-tempo', '{kaputt');
    expect(createPracticeStore(storage).tempo('hysteria')).toBeUndefined();
  });

  it('nicht nutzbarer Speicher: Wert gilt nur für die Sitzung', () => {
    const broken = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const store = createPracticeStore(broken);
    store.setTempo('hysteria', 85);
    expect(store.tempo('hysteria')).toBe(85);
    expect(createPracticeStore(null).tempo('hysteria')).toBeUndefined();
  });
});

describe('Spec practice-tempo › Schalter gilt bis zum Neuladen', () => {
  it('pro Song, nach neuem Store aus', () => {
    const storage = memoryStorage();
    const store = createPracticeStore(storage);
    expect(store.enabled('hysteria')).toBe(false);
    store.setEnabled('hysteria', true);
    expect(store.enabled('hysteria')).toBe(true);
    expect(store.enabled('other')).toBe(false);
    expect(createPracticeStore(storage).enabled('hysteria')).toBe(false);
  });
});

describe('Spec practice-click › Schalter gelten bis zum Neuladen', () => {
  it('Metronom und Einzählen pro Song, unabhängig voneinander und vom Schalter des Übetempos, nach neuem Store aus', () => {
    const storage = memoryStorage();
    const store = createPracticeStore(storage);
    expect(store.metronome('hysteria')).toBe(false);
    expect(store.countIn('hysteria')).toBe(false);
    store.setMetronome('hysteria', true);
    expect(store.metronome('hysteria')).toBe(true);
    expect(store.countIn('hysteria')).toBe(false);
    expect(store.enabled('hysteria')).toBe(false);
    expect(store.metronome('other')).toBe(false);
    store.setCountIn('hysteria', true);
    store.setEnabled('hysteria', true);
    store.setEnabled('hysteria', false);
    expect(store.metronome('hysteria')).toBe(true);
    expect(store.countIn('hysteria')).toBe(true);
    const reloaded = createPracticeStore(storage);
    expect(reloaded.metronome('hysteria')).toBe(false);
    expect(reloaded.countIn('hysteria')).toBe(false);
  });

  it('Abonnenten erfahren Änderungen, gleicher Wert benachrichtigt nicht', () => {
    const store = createPracticeStore(memoryStorage());
    let calls = 0;
    store.subscribe(() => calls++);
    store.setMetronome('hysteria', true);
    store.setCountIn('hysteria', true);
    store.setMetronome('hysteria', true);
    expect(calls).toBe(2);
  });
});
