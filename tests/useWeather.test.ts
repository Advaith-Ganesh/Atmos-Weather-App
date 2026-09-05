import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WeatherError } from '../src/api/errors';
import { transformTimeline } from '../src/api/transform';
import { useWeather } from '../src/hooks/useWeather';
import { londonTimeline, tokyoTimeline } from './fixtures/timeline';

const getWeather = vi.hoisted(() => vi.fn());
vi.mock('../src/api/weatherService', () => ({ getWeather }));

const london = transformTimeline(londonTimeline(), 'London');
const tokyo = transformTimeline(tokyoTimeline(), 'Tokyo');

beforeEach(() => {
  getWeather.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useWeather', () => {
  it('is idle with no location selected', () => {
    const { result } = renderHook(() => useWeather(null));
    expect(result.current.status).toBe('idle');
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('loads, then reports success', async () => {
    getWeather.mockResolvedValue(london);
    const { result } = renderHook(() => useWeather('London'));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data?.location.name).toBe('London');
  });

  it('surfaces a typed error', async () => {
    getWeather.mockRejectedValue(new WeatherError('RATE_LIMITED'));
    const { result } = renderHook(() => useWeather('London'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.code).toBe('RATE_LIMITED');
    expect(result.current.data).toBeNull();
  });

  // Regression: retrying from the error screen used to report "refreshing" with
  // no data, which rendered neither the skeleton nor the error — a blank page.
  it('shows the loading state while retrying after a failure, never a blank state', async () => {
    getWeather.mockRejectedValueOnce(new WeatherError('NETWORK')).mockResolvedValueOnce(london);
    const { result } = renderHook(() => useWeather('London'));

    await waitFor(() => expect(result.current.status).toBe('error'));

    act(() => result.current.refresh());
    expect(result.current.status).toBe('loading');
    expect(result.current.isRefreshing).toBe(false);

    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('keeps the previous data on screen while refreshing', async () => {
    let release: (value: typeof london) => void = () => {};
    getWeather.mockResolvedValueOnce(london).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );

    const { result } = renderHook(() => useWeather('London'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.refresh());
    expect(result.current.status).toBe('refreshing');
    expect(result.current.data?.location.name).toBe('London');

    await act(async () => release(london));
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('asks the service to bypass the cache only when refreshing', async () => {
    getWeather.mockResolvedValue(london);
    const { result } = renderHook(() => useWeather('London'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(getWeather).toHaveBeenLastCalledWith('London', { force: false });
    act(() => result.current.refresh());
    expect(getWeather).toHaveBeenLastCalledWith('London', { force: true });
  });

  it('discards a slow response once the location has changed', async () => {
    let releaseLondon: (value: typeof london) => void = () => {};
    getWeather.mockImplementation((query: string) => {
      if (query === 'London') return new Promise((resolve) => (releaseLondon = resolve));
      return Promise.resolve(tokyo);
    });

    const { result, rerender } = renderHook(({ query }) => useWeather(query), {
      initialProps: { query: 'London' },
    });

    rerender({ query: 'Tokyo' });
    await waitFor(() => expect(result.current.data?.location.name).toBe('Tokyo'));

    // London finally answers, long after the user moved on.
    await act(async () => releaseLondon(london));
    expect(result.current.data?.location.name).toBe('Tokyo');
  });
});
