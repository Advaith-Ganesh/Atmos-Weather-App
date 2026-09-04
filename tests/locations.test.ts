import { describe, expect, it } from 'vitest';
import {
  MAX_RECENT_SEARCHES,
  MAX_SAVED_LOCATIONS,
  addRecentSearch,
  addSavedLocation,
  isSaved,
  locationId,
  removeSavedLocation,
  reorderSavedLocations,
  type SavedLocation,
} from '../src/lib/locations';

const location = (name: string): SavedLocation => ({
  id: locationId(name),
  label: name,
  query: name,
});

describe('saved locations', () => {
  const london = location('London');
  const dubai = location('Dubai');

  it('adds a location once', () => {
    const saved = addSavedLocation([], london);
    expect(saved).toHaveLength(1);
    expect(addSavedLocation(saved, london)).toEqual(saved);
  });

  it('treats casing and padding as the same place', () => {
    const saved = addSavedLocation([], london);
    expect(isSaved(saved, '  LONDON ')).toBe(true);
    expect(addSavedLocation(saved, location('london'))).toHaveLength(1);
  });

  it('removes by id and leaves the rest in order', () => {
    const saved = addSavedLocation(addSavedLocation([], london), dubai);
    expect(removeSavedLocation(saved, 'london')).toEqual([dubai]);
    expect(removeSavedLocation(saved, 'paris')).toHaveLength(2);
  });

  it('caps how many can be saved', () => {
    const many = Array.from({ length: 20 }, (_, index) => location(`City ${index}`)).reduce(
      addSavedLocation,
      [] as SavedLocation[],
    );
    expect(many).toHaveLength(MAX_SAVED_LOCATIONS);
  });

  it('reorders without losing entries', () => {
    const saved = [location('A'), location('B'), location('C')];
    expect(reorderSavedLocations(saved, 2, 0).map((entry) => entry.label)).toEqual(['C', 'A', 'B']);
    expect(reorderSavedLocations(saved, 0, 1).map((entry) => entry.label)).toEqual(['B', 'A', 'C']);
  });

  it('ignores out-of-range and no-op moves', () => {
    const saved = [location('A'), location('B')];
    expect(reorderSavedLocations(saved, 1, 1)).toBe(saved);
    expect(reorderSavedLocations(saved, -1, 0)).toBe(saved);
    expect(reorderSavedLocations(saved, 0, 5)).toBe(saved);
  });
});

describe('recent searches', () => {
  it('puts the newest first', () => {
    const recent = addRecentSearch(addRecentSearch([], 'London'), 'Tokyo');
    expect(recent).toEqual(['Tokyo', 'London']);
  });

  it('moves a repeated search back to the top instead of duplicating it', () => {
    const recent = ['Tokyo', 'London', 'Dubai'].reduce(addRecentSearch, [] as string[]);
    expect(addRecentSearch(recent, 'tokyo')).toEqual(['tokyo', 'Dubai', 'London']);
  });

  it('caps the list', () => {
    const recent = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].reduce(addRecentSearch, [] as string[]);
    expect(recent).toHaveLength(MAX_RECENT_SEARCHES);
    expect(recent[0]).toBe('G');
  });

  it('ignores blank input', () => {
    expect(addRecentSearch(['London'], '   ')).toEqual(['London']);
  });
});
