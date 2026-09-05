import { useCallback, useState } from 'react';
import { addRecentSearch, isStringArray } from '../lib/locations';
import { STORAGE_KEYS, readJson, writeJson } from '../lib/storage';

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(() => readJson(STORAGE_KEYS.recent, [] as string[], isStringArray));

  const record = useCallback((query: string) => {
    setRecent((previous) => {
      const next = addRecentSearch(previous, query);
      writeJson(STORAGE_KEYS.recent, next);
      return next;
    });
  }, []);

  return { recent, record };
}
