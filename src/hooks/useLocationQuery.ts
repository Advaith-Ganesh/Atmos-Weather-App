import { useCallback, useEffect, useState } from 'react';
import { validateQuery } from '../lib/validation';

const PARAM = 'q';

/**
 * A shared link is untrusted input, so it goes through the same validation as
 * the search box. Anything rejected is treated as no location at all, which
 * falls through to geolocation.
 */
function readParam(): string | null {
  const raw = new URLSearchParams(window.location.search).get(PARAM);
  if (!raw) return null;
  const result = validateQuery(raw);
  return result.ok ? result.value : null;
}

/**
 * The selected location lives in the URL (`?q=Tokyo`) rather than in component
 * state, which makes it shareable and survives a reload for free. Full routing
 * would be overkill for a single parameter.
 */
export function useLocationQuery() {
  const [query, setQueryState] = useState<string | null>(readParam);

  useEffect(() => {
    const onPopState = () => setQueryState(readParam());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setQuery = useCallback((next: string | null, { replace = false } = {}) => {
    const url = new URL(window.location.href);
    if (next) url.searchParams.set(PARAM, next);
    else url.searchParams.delete(PARAM);

    if (url.href !== window.location.href) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
    }
    setQueryState(next);
  }, []);

  return [query, setQuery] as const;
}
