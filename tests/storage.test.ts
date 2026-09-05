import { afterEach, describe, expect, it, vi } from 'vitest';
import { isSavedLocationArray, isStringArray, type SavedLocation } from '../src/lib/locations';
import { STORAGE_KEYS, readJson, writeJson } from '../src/lib/storage';

const KEY = 'atmos:test';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('readJson', () => {
  it('round-trips a valid value', () => {
    writeJson(KEY, ['London', 'Tokyo']);
    expect(readJson(KEY, [] as string[], isStringArray)).toEqual(['London', 'Tokyo']);
  });

  it('falls back when the key is absent', () => {
    expect(readJson(KEY, ['default'], isStringArray)).toEqual(['default']);
  });

  it('falls back on unparseable JSON rather than throwing', () => {
    window.localStorage.setItem(KEY, '{not json');
    expect(readJson(KEY, [] as string[], isStringArray)).toEqual([]);
  });

  // Each of these previously reached the components as-is and crashed the first
  // one that treated it as an array of objects.
  it.each([
    ['null', 'null'],
    ['a bare string', '"london"'],
    ['a number', '42'],
    ['an object where an array is expected', '{"0":"London"}'],
    ['an array with the wrong element type', '[1,2,3]'],
  ])('falls back on %s', (_label, stored) => {
    window.localStorage.setItem(KEY, stored);
    expect(readJson(KEY, [] as string[], isStringArray)).toEqual([]);
  });

  it('falls back when saved locations are missing required fields', () => {
    window.localStorage.setItem(KEY, JSON.stringify([{ id: 'london', label: 'London' }]));
    expect(readJson(KEY, [] as SavedLocation[], isSavedLocationArray)).toEqual([]);
  });

  it('survives storage being unavailable', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(readJson(KEY, ['fallback'], isStringArray)).toEqual(['fallback']);
  });
});

describe('writeJson', () => {
  it('does not throw when the quota is exceeded', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    expect(() => writeJson(KEY, { a: 1 })).not.toThrow();
  });
});

describe('stored-value guards', () => {
  it('accepts a well-formed saved-location list', () => {
    const saved: SavedLocation[] = [{ id: 'london', label: 'London', query: 'London' }];
    expect(isSavedLocationArray(saved)).toBe(true);
  });

  it.each([[null], [undefined], ['london'], [{}], [[{ id: 1, label: 2, query: 3 }]], [[null]]])(
    'rejects %j',
    (value) => {
      expect(isSavedLocationArray(value)).toBe(false);
    },
  );

  it('namespaces its storage keys', () => {
    for (const key of Object.values(STORAGE_KEYS)) expect(key.startsWith('atmos:')).toBe(true);
  });
});
