import { useCallback, useState } from 'react';
import {
  addSavedLocation,
  isSavedLocationArray,
  removeSavedLocation,
  reorderSavedLocations,
  type SavedLocation,
} from '../lib/locations';
import { STORAGE_KEYS, readJson, writeJson } from '../lib/storage';

export function useSavedLocations() {
  const [saved, setSaved] = useState<SavedLocation[]>(() =>
    readJson(STORAGE_KEYS.saved, [] as SavedLocation[], isSavedLocationArray),
  );

  const commit = useCallback((update: (previous: SavedLocation[]) => SavedLocation[]) => {
    setSaved((previous) => {
      const next = update(previous);
      writeJson(STORAGE_KEYS.saved, next);
      return next;
    });
  }, []);

  return {
    saved,
    add: useCallback((location: SavedLocation) => commit((list) => addSavedLocation(list, location)), [commit]),
    remove: useCallback((id: string) => commit((list) => removeSavedLocation(list, id)), [commit]),
    move: useCallback((from: number, to: number) => commit((list) => reorderSavedLocations(list, from, to)), [commit]),
  };
}
