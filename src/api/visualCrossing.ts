import { WeatherError } from './errors';
import type { VcResponse } from './visualCrossingTypes';

const DEFAULT_BASE_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

/** Overridable so local development can point at a proxy or a stub server. */
const baseUrl = () =>
  (import.meta.env.VITE_VISUAL_CROSSING_BASE_URL as string | undefined)?.trim() || DEFAULT_BASE_URL;

const apiKey = () => (import.meta.env.VITE_VISUAL_CROSSING_API_KEY as string | undefined)?.trim() ?? '';

/** UTC date offset by `days`, formatted YYYY-MM-DD. */
function utcDate(days: number, now = new Date()): string {
  const date = new Date(now.getTime() + days * 86_400_000);
  return date.toISOString().slice(0, 10);
}

/**
 * We request yesterday → +7 days in *UTC*. The location's own calendar day can
 * be up to 14 hours away from UTC, so the extra day on each end guarantees a
 * full 24 hours of history and 7 forecast days once we re-slice the series in
 * the location's timezone.
 */
export function buildRequestUrl(location: string, key: string, now = new Date()): string {
  const path = `${baseUrl()}/${encodeURIComponent(location)}/${utcDate(-1, now)}/${utcDate(7, now)}`;
  const params = new URLSearchParams({
    unitGroup: 'metric',
    include: 'current,hours,days',
    // icons2 distinguishes showers, thunderstorms and snow showers; the default
    // set collapses all of them into "rain"/"snow".
    iconSet: 'icons2',
    contentType: 'json',
    lang: 'en',
    key,
  });
  return `${path}?${params}`;
}

function errorForStatus(status: number): WeatherError {
  if (status === 401 || status === 403) return new WeatherError('INVALID_API_KEY');
  if (status === 400 || status === 404) return new WeatherError('LOCATION_NOT_FOUND');
  if (status === 429) return new WeatherError('RATE_LIMITED');
  if (status >= 500) return new WeatherError('PROVIDER_UNAVAILABLE');
  return new WeatherError('UNKNOWN');
}

export async function fetchTimeline(location: string): Promise<VcResponse> {
  const trimmed = location.trim();
  if (!trimmed) throw new WeatherError('EMPTY_QUERY');

  const key = apiKey();
  if (!key) throw new WeatherError('MISSING_API_KEY');

  let response: Response;
  try {
    response = await fetch(buildRequestUrl(trimmed, key));
  } catch {
    throw new WeatherError('NETWORK');
  }

  // The body of a failed request can contain the key, so it is never surfaced.
  if (!response.ok) throw errorForStatus(response.status);

  try {
    return (await response.json()) as VcResponse;
  } catch {
    // A 200 with a body we can't parse means the provider, not the connection.
    throw new WeatherError('PROVIDER_UNAVAILABLE');
  }
}
