/**
 * localStorage access is wrapped because it throws in Safari private mode and
 * in embedded browsers that disable site data. A failed read or write should
 * never break the app — preferences just stop persisting.
 */

/**
 * Stored JSON is untrusted: it can be hand-edited, left behind by an older
 * version of the app, or simply corrupt. Callers pass a type guard so a bad
 * value falls back instead of crashing the first component that reads it.
 */
export function readJson<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full — preferences simply won't persist */
  }
}

export const STORAGE_KEYS = {
  units: 'atmos:units',
  saved: 'atmos:saved-locations',
  recent: 'atmos:recent-searches',
} as const;
