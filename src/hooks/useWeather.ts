import { useCallback, useEffect, useRef, useState } from 'react';
import { toWeatherError, type WeatherError } from '../api/errors';
import { getWeather } from '../api/weatherService';
import type { WeatherData } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'error';

interface WeatherResult {
  /** The query this result belongs to, so a stale result is easy to spot. */
  query: string;
  data: WeatherData | null;
  error: WeatherError | null;
}

/**
 * Owns the fetch lifecycle for one location. Only settled results are stored —
 * "loading" is derived from the result not matching the requested query, which
 * keeps the state machine to a single transition per request. Responses from a
 * superseded request are discarded, so rapid searching can't leave the previous
 * location's weather on screen.
 */
export function useWeather(query: string | null) {
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [refreshRequested, setRefreshRequested] = useState(false);
  const requestIdRef = useRef(0);

  const load = useCallback(async (target: string, force: boolean) => {
    const requestId = ++requestIdRef.current;

    try {
      const data = await getWeather(target, { force });
      if (requestId !== requestIdRef.current) return;
      setResult({ query: target, data, error: null });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setResult({ query: target, data: null, error: toWeatherError(error) });
    } finally {
      if (requestId === requestIdRef.current) setRefreshRequested(false);
    }
  }, []);

  useEffect(() => {
    if (!query) return;
    // `load` only calls setState once its request has settled, so this does not
    // start a cascading render — the lint rule can't see across the await.
    // oxlint-disable-next-line react/set-state-in-effect
    void load(query, false);
  }, [query, load]);

  const refresh = useCallback(() => {
    if (!query) return;
    setRefreshRequested(true);
    void load(query, true);
  }, [query, load]);

  const current = result && result.query === query ? result : null;

  const status: WeatherStatus = !query
    ? 'idle'
    : !current
      ? 'loading'
      : refreshRequested
        ? 'refreshing'
        : current.error
          ? 'error'
          : 'success';

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    status,
    isLoading: status === 'loading',
    isRefreshing: status === 'refreshing',
    refresh,
  };
}
