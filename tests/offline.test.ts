import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchTimeline } from '../src/api/visualCrossing';
import { useOnlineStatus } from '../src/hooks/useOnlineStatus';

const setOnline = (value: boolean) =>
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });

beforeEach(() => {
  vi.stubEnv('VITE_VISUAL_CROSSING_API_KEY', 'test-key');
  setOnline(true);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  setOnline(true);
});

describe('offline detection in the API client', () => {
  it('fails fast without spending a request when the browser reports no connection', async () => {
    setOnline(false);
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(fetchTimeline('London')).rejects.toMatchObject({ code: 'OFFLINE' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('still checks the key and the query before connectivity', async () => {
    setOnline(false);
    await expect(fetchTimeline('  ')).rejects.toMatchObject({ code: 'EMPTY_QUERY' });

    vi.stubEnv('VITE_VISUAL_CROSSING_API_KEY', '');
    await expect(fetchTimeline('London')).rejects.toMatchObject({ code: 'MISSING_API_KEY' });
  });

  // onLine: true only means an interface is up, so a genuine failure must still
  // be reported rather than assumed to be success.
  it('reports a real transport failure as a network error while nominally online', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(fetchTimeline('London')).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('does not report the location as offline when the message is shown to a user', async () => {
    setOnline(false);
    const error = await fetchTimeline('London').catch((caught: Error) => caught);
    expect(error.message).toMatch(/offline/i);
    expect(error.message).not.toContain('London');
  });
});

describe('useOnlineStatus', () => {
  it('starts from the browser flag', () => {
    setOnline(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('follows offline and online events', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });

  it('removes its listeners on unmount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOnlineStatus());
    unmount();

    const removed = remove.mock.calls.map(([event]) => event);
    expect(removed).toContain('online');
    expect(removed).toContain('offline');
  });
});
