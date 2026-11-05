import { describe, expect, it, vi } from 'vitest';
import { createSoundSetting, SOUND_STORAGE_KEY } from './soundSetting';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

describe('Spec playback-sound › Wahl pro Gerät', () => {
  it('Vorgabe: ohne gespeicherte Wahl gilt DRSKit', () => {
    expect(createSoundSetting(memoryStorage()).get()).toBe('drs');
  });

  it('Wahl bleibt erhalten: ein neuer Store über denselben Speicher liest sie', () => {
    const storage = memoryStorage();
    createSoundSetting(storage).set('synth');
    expect(createSoundSetting(storage).get()).toBe('synth');
    expect(storage.data.get(SOUND_STORAGE_KEY)).toBe('synth');
  });

  it('unbekannter gespeicherter Wert gilt als Vorgabe', () => {
    expect(createSoundSetting(memoryStorage({ [SOUND_STORAGE_KEY]: 'orgel' })).get()).toBe('drs');
  });

  it('nicht nutzbarer Speicher: Wahl gilt im Speicher der Sitzung', () => {
    const broken = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const setting = createSoundSetting(broken);
    expect(setting.get()).toBe('drs');
    setting.set('synth');
    expect(setting.get()).toBe('synth');
  });

  it('ohne Speicher (null) gilt die Vorgabe', () => {
    expect(createSoundSetting(null).get()).toBe('drs');
  });

  it('benachrichtigt Abonnenten bei einer Änderung, nicht bei gleicher Wahl', () => {
    const setting = createSoundSetting(memoryStorage());
    const listener = vi.fn();
    const unsubscribe = setting.subscribe(listener);
    setting.set('drs');
    expect(listener).not.toHaveBeenCalled();
    setting.set('synth');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setting.set('drs');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
