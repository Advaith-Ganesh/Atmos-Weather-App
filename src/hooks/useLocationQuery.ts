import { useCallback, useEffect, useState } from 'react';
import { validateQuery } from '../lib/validation';

const PARAM = 'q';

interface LocationParam {
  query: string | null;
  /** The URL carried a `q` value that failed validation. */
  rejected: boolean;
}

/**
 * A shared link is untrusted input, so it goes through the same validation as
 * the search box. "No parameter" and "a parameter we rejected" are kept apart:
 * the first should try geolocation, the second already told us the user wanted
 * a specific place, so waiting on a permission prompt would only delay the
 * fallback.
 */
function readParam(): LocationParam {
  const raw = new URLSearchParams(window.location.search).get(PARAM);
  if (!raw) return { query: null, rejected: false };

  const result = validateQuery(raw);
  return result.ok ? { query: result.value, rejected: false } : { query: null, rejected: true };
}

/**
 * The selected location lives in the URL (`?q=Tokyo`) rather than in component
 * state, which makes it shareable and survives a reload for free. Full routing
 * would be overkill for a single parameter.
 */
export function useLocationQuery() {
  const [param, setParam] = useState<LocationParam>(readParam);

  useEffect(() => {
    const onPopState = () => setParam(readParam());
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
    setParam({ query: next, rejected: false });
  }, []);

  return { query: param.query, rejectedLink: param.rejected, setQuery };
}
