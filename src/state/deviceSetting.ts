export type SettingStorage = Pick<Storage, 'getItem' | 'setItem'>;

export interface DeviceSetting<T extends string> {
  get(): T;
  set(value: T): void;
  subscribe(listener: () => void): () => void;
}

export interface DeviceSettingOptions<T extends string> {
  key: string;
  values: readonly T[];
  fallback: T;
}

/**
 * Wahl pro Gerät im lokalen Speicher, nicht abgeglichen (theme-choice, design.md D2). Unbekannte Werte
 * gelten als Vorgabe; ist der Speicher nicht nutzbar, gilt die Wahl nur für die Sitzung.
 */
export function createDeviceSetting<T extends string>(
  { key, values, fallback }: DeviceSettingOptions<T>,
  storage: SettingStorage | null,
): DeviceSetting<T> {
  let stored: string | null = null;
  try {
    stored = storage?.getItem(key) ?? null;
  } catch {
    // privater Modus o. ä.: Vorgabe
  }
  let current: T = values.find((value) => value === stored) ?? fallback;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set(value) {
      if (value === current) return;
      current = value;
      try {
        storage?.setItem(key, value);
      } catch {
        // nur für die Sitzung
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Speicher des Browsers, falls zugänglich. */
export function browserStorage(): SettingStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
