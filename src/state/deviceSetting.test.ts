import { describe, expect, it, vi } from 'vitest';
import { createDeviceSetting } from './deviceSetting';

const OPTIONS = { key: 'beatsheet.test', values: ['a', 'b', 'c'] as const, fallback: 'a' as const };

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

describe('Geräte-Einstellung (theme-choice, design.md D2)', () => {
  it('ohne Eintrag gilt die Vorgabe', () => {
    expect(createDeviceSetting(OPTIONS, memoryStorage()).get()).toBe('a');
    expect(createDeviceSetting(OPTIONS, null).get()).toBe('a');
  });

  it('ein neuer Store über denselben Speicher liest die gespeicherte Wahl', () => {
    const storage = memoryStorage();
    createDeviceSetting(OPTIONS, storage).set('c');
    expect(createDeviceSetting(OPTIONS, storage).get()).toBe('c');
    expect(storage.data.get('beatsheet.test')).toBe('c');
  });

  it('unbekannter Wert gilt als Vorgabe', () => {
    expect(createDeviceSetting(OPTIONS, memoryStorage({ 'beatsheet.test': 'z' })).get()).toBe('a');
  });

  it('nicht nutzbarer Speicher: Wahl gilt nur für die Sitzung', () => {
    const broken = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const setting = createDeviceSetting(OPTIONS, broken);
    expect(setting.get()).toBe('a');
    setting.set('b');
    expect(setting.get()).toBe('b');
  });

  it('benachrichtigt bei einer Änderung, nicht bei gleicher Wahl, und lässt sich abmelden', () => {
    const setting = createDeviceSetting(OPTIONS, memoryStorage());
    const listener = vi.fn();
    const unsubscribe = setting.subscribe(listener);
    setting.set('a');
    expect(listener).not.toHaveBeenCalled();
    setting.set('b');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setting.set('c');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
