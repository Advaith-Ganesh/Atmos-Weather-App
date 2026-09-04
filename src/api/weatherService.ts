import { TtlCache } from '../lib/cache';
import { normaliseQuery } from '../lib/validation';
import type { WeatherData } from '../types/weather';
import { toWeatherError } from './errors';
import { transformTimeline } from './transform';
import { fetchTimeline } from './visualCrossing';

/**
 * Visual Crossing bills per request and its observations refresh on the order of
 * fifteen minutes, so a short cache costs almost nothing in freshness and a lot
 * in quota — flipping between two saved locations stops hitting the network.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;

const cache = new TtlCache<WeatherData>(CACHE_TTL_MS);

const cacheKey = (query: string) => normaliseQuery(query).toLowerCase();

export interface GetWeatherOptions {
  /** Bypass the cache — used by the manual refresh control. */
  force?: boolean;
}

/**
 * There is deliberately no cancellation here. One request can be shared by
 * several callers, so letting any one of them abort it would break the others;
 * callers discard responses they no longer want instead.
 */
export async function getWeather(query: string, options: GetWeatherOptions = {}): Promise<WeatherData> {
  const key = cacheKey(query);
  if (options.force) cache.delete(key);

  try {
    return await cache.resolve(key, async () => {
      const raw = await fetchTimeline(query);
      return transformTimeline(raw, normaliseQuery(query));
    });
  } catch (error) {
    throw toWeatherError(error);
  }
}

export const clearWeatherCache = () => cache.clear();
