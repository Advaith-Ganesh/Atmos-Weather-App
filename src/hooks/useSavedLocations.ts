import { useCallback, useState } from 'react';
import {
  addSavedLocation,
  removeSavedLocation,
  reorderSavedLocations,
  type SavedLocation,
} from '../lib/locations';
import { STORAGE_KEYS, readJson, writeJson } from '../lib/storage';

export function useSavedLocations() {
  const [saved, setSaved] = useState<SavedLocation[]>(() => readJson<SavedLocation[]>(STORAGE_KEYS.saved, []));

  const commit = useCallback((next: SavedLocation[]) => {
    setSaved(next);
    writeJson(STORAGE_KEYS.saved, next);
  }, []);

  return {
    saved,
    add: useCallback((location: SavedLocation) => commit(addSavedLocation(saved, location)), [saved, commit]),
    remove: useCallback((id: string) => commit(removeSavedLocation(saved, id)), [saved, commit]),
    move: useCallback((from: number, to: number) => commit(reorderSavedLocations(saved, from, to)), [saved, commit]),
  };
}
