/**
 * localStorage access is wrapped because it throws in Safari private mode and
 * in embedded browsers that disable site data. A failed read or write should
 * never break the app — preferences just stop persisting.
 */

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
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
