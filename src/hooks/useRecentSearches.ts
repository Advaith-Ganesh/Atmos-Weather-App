import { useCallback, useState } from 'react';
import { addRecentSearch } from '../lib/locations';
import { STORAGE_KEYS, readJson, writeJson } from '../lib/storage';

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>(() => readJson<string[]>(STORAGE_KEYS.recent, []));

  const record = useCallback((query: string) => {
    setRecent((previous) => {
      const next = addRecentSearch(previous, query);
      writeJson(STORAGE_KEYS.recent, next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setRecent([]);
    writeJson(STORAGE_KEYS.recent, []);
  }, []);

  return { recent, record, clear };
}
