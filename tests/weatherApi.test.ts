import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WeatherError } from '../src/api/errors';
import { buildRequestUrl, fetchTimeline } from '../src/api/visualCrossing';
import { clearWeatherCache, getWeather } from '../src/api/weatherService';
import { londonTimeline } from './fixtures/timeline';

const API_KEY = 'test-key-1234';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

const errorResponse = (status: number) => new Response('Bad API Request', { status });

describe('request building', () => {
  const now = new Date('2026-07-15T12:00:00Z');

  it('requests yesterday through a week ahead so both windows are covered', () => {
    const url = new URL(buildRequestUrl('London', API_KEY, now));
    expect(url.pathname).toContain('/timeline/London/2026-07-14/2026-07-22');
  });

  it('asks for metric units, hourly data and the detailed icon set', () => {
    const url = new URL(buildRequestUrl('London', API_KEY, now));
    expect(url.searchParams.get('unitGroup')).toBe('metric');
    expect(url.searchParams.get('include')).toBe('current,hours,days');
    expect(url.searchParams.get('iconSet')).toBe('icons2');
    expect(url.searchParams.get('key')).toBe(API_KEY);
  });

  it('encodes locations that contain punctuation', () => {
    const url = buildRequestUrl('Paris, France', API_KEY, now);
    expect(url).toContain('Paris%2C%20France');
    expect(new URL(url).pathname).toContain('/timeline/Paris%2C%20France/');
  });
});

describe('fetchTimeline error handling', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_VISUAL_CROSSING_API_KEY', API_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rejects an empty location before making a request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    await expect(fetchTimeline('   ')).rejects.toMatchObject({ code: 'EMPTY_QUERY' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a missing key without calling the API', async () => {
    vi.stubEnv('VITE_VISUAL_CROSSING_API_KEY', '');
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    await expect(fetchTimeline('London')).rejects.toMatchObject({ code: 'MISSING_API_KEY' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'INVALID_API_KEY'],
    [403, 'INVALID_API_KEY'],
    [400, 'LOCATION_NOT_FOUND'],
    [404, 'LOCATION_NOT_FOUND'],
    [429, 'RATE_LIMITED'],
    [500, 'PROVIDER_UNAVAILABLE'],
    [503, 'PROVIDER_UNAVAILABLE'],
    [418, 'UNKNOWN'],
  ])('maps HTTP %d to %s', async (status, code) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(errorResponse(status));
    await expect(fetchTimeline('Nowhere')).rejects.toMatchObject({ code });
  });

  it('never leaks the API key or the raw provider body into the error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(`No account found with API key ${API_KEY}`, { status: 401 }),
    );

    const error = await fetchTimeline('London').catch((caught: WeatherError) => caught);
    expect(error).toBeInstanceOf(WeatherError);
    expect((error as WeatherError).message).not.toContain(API_KEY);
    expect((error as WeatherError).message).not.toContain('No account found');
  });

  it('treats a transport failure as a network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(fetchTimeline('London')).rejects.toMatchObject({ code: 'NETWORK' });
  });
});

describe('getWeather', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_VISUAL_CROSSING_API_KEY', API_KEY);
    clearWeatherCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns normalised data the UI can render', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(jsonResponse(londonTimeline())));
    const data = await getWeather('London');
    expect(data.location.name).toBe('London');
    expect(data.days).toHaveLength(7);
    expect(data.hours.length).toBeGreaterThan(48);
  });

  it('serves a repeated search from cache, ignoring case and spacing', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(jsonResponse(londonTimeline())));
    await getWeather('London');
    await getWeather('  london ');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('bypasses the cache when the user refreshes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(jsonResponse(londonTimeline())));
    await getWeather('London');
    await getWeather('London', { force: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shares one request between simultaneous callers', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(jsonResponse(londonTimeline())), 5)));

    const [first, second] = await Promise.all([getWeather('London'), getWeather('London')]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.location.name).toBe(second.location.name);
  });

  it('keeps separate entries per location', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(jsonResponse(londonTimeline())));
    await getWeather('London');
    await getWeather('Tokyo');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('treats an unparseable 200 as a provider problem', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>maintenance</html>', { status: 200 }));
    await expect(getWeather('London')).rejects.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
  });

  it('surfaces a typed error rather than a raw failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(errorResponse(429));
    await expect(getWeather('London')).rejects.toBeInstanceOf(WeatherError);
  });
});
