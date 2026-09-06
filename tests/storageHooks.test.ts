import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useRecentSearches } from '../src/hooks/useRecentSearches';
import { useSavedLocations } from '../src/hooks/useSavedLocations';
import { MAX_RECENT_SEARCHES, MAX_SAVED_LOCATIONS, type SavedLocation } from '../src/lib/locations';
import { STORAGE_KEYS } from '../src/lib/storage';

const location = (name: string): SavedLocation => ({
  id: name.toLowerCase(),
  label: name,
  query: name,
});

const stored = <T,>(key: string): T | null => {
  const raw = window.localStorage.getItem(key);
  return raw === null ? null : (JSON.parse(raw) as T);
};

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe('useSavedLocations', () => {
  it('starts empty and persists what is added', () => {
    const { result } = renderHook(() => useSavedLocations());
    expect(result.current.saved).toEqual([]);

    act(() => result.current.add(location('London')));

    expect(result.current.saved.map((entry) => entry.label)).toEqual(['London']);
    expect(stored<SavedLocation[]>(STORAGE_KEYS.saved)).toHaveLength(1);
  });

  it('restores what a previous session saved', () => {
    window.localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify([location('Tokyo')]));
    const { result } = renderHook(() => useSavedLocations());
    expect(result.current.saved.map((entry) => entry.label)).toEqual(['Tokyo']);
  });

  it('ignores a corrupt stored value instead of crashing', () => {
    window.localStorage.setItem(STORAGE_KEYS.saved, '{"not":"an array"}');
    const { result } = renderHook(() => useSavedLocations());
    expect(result.current.saved).toEqual([]);
  });

  it('removes by id and reorders', () => {
    const { result } = renderHook(() => useSavedLocations());
    act(() => result.current.add(location('London')));
    act(() => result.current.add(location('Dubai')));
    act(() => result.current.add(location('Tokyo')));

    act(() => result.current.move(2, 0));
    expect(result.current.saved.map((entry) => entry.label)).toEqual(['Tokyo', 'London', 'Dubai']);

    act(() => result.current.remove('london'));
    expect(result.current.saved.map((entry) => entry.label)).toEqual(['Tokyo', 'Dubai']);
    expect(stored<SavedLocation[]>(STORAGE_KEYS.saved)).toHaveLength(2);
  });

  // Functional updates matter here: batched in one tick, the earlier
  // closure-based version dropped every change but the last.
  it('applies several updates made in the same tick', () => {
    const { result } = renderHook(() => useSavedLocations());

    act(() => {
      result.current.add(location('London'));
      result.current.add(location('Dubai'));
      result.current.add(location('Tokyo'));
    });

    expect(result.current.saved.map((entry) => entry.label)).toEqual(['London', 'Dubai', 'Tokyo']);
  });

  it('will not save the same place twice, and caps the list', () => {
    const { result } = renderHook(() => useSavedLocations());

    act(() => {
      result.current.add(location('London'));
      result.current.add(location('London'));
    });
    expect(result.current.saved).toHaveLength(1);

    act(() => {
      for (let index = 0; index < MAX_SAVED_LOCATIONS + 5; index += 1) {
        result.current.add(location(`City ${index}`));
      }
    });
    expect(result.current.saved).toHaveLength(MAX_SAVED_LOCATIONS);
  });
});

describe('useRecentSearches', () => {
  it('records newest first and persists', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.record('London');
      result.current.record('Tokyo');
    });

    expect(result.current.recent).toEqual(['Tokyo', 'London']);
    expect(stored<string[]>(STORAGE_KEYS.recent)).toEqual(['Tokyo', 'London']);
  });

  it('moves a repeated search to the top rather than duplicating it', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.record('London');
      result.current.record('Tokyo');
      result.current.record('london');
    });

    expect(result.current.recent).toEqual(['london', 'Tokyo']);
  });

  it('caps the list', () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      for (const city of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) result.current.record(city);
    });

    expect(result.current.recent).toHaveLength(MAX_RECENT_SEARCHES);
    expect(result.current.recent[0]).toBe('G');
  });

  it('ignores a corrupt stored value', () => {
    window.localStorage.setItem(STORAGE_KEYS.recent, '[1,2,3]');
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.recent).toEqual([]);
  });
});
