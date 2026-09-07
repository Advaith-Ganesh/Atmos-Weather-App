import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGeolocation } from '../src/hooks/useGeolocation';

type SuccessCallback = PositionCallback;
type ErrorCallback = PositionErrorCallback;

const mockGeolocation = (
  implementation: (success: SuccessCallback, failure: ErrorCallback, options?: PositionOptions) => void,
) => {
  const getCurrentPosition = vi.fn(implementation);
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition, watchPosition: vi.fn(), clearWatch: vi.fn() },
  });
  return getCurrentPosition;
};

const position = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude } }) as GeolocationPosition;

const denial = () =>
  ({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }) as GeolocationPositionError;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useGeolocation', () => {
  it('returns coordinates rounded to four decimals', async () => {
    mockGeolocation((success) => success(position(51.50735, -0.12776)));
    const { result } = renderHook(() => useGeolocation());

    let coordinates: string | null = null;
    await act(async () => {
      coordinates = await result.current.locate();
    });

    expect(coordinates).toBe('51.5074,-0.1278');
    await waitFor(() => expect(result.current.status).toBe('granted'));
  });

  it('reports denial without throwing', async () => {
    mockGeolocation((_success, failure) => failure(denial()));
    const { result } = renderHook(() => useGeolocation());

    let coordinates: string | null = 'unset';
    await act(async () => {
      coordinates = await result.current.locate();
    });

    expect(coordinates).toBeNull();
    await waitFor(() => expect(result.current.status).toBe('denied'));
  });

  it('separates an unavailable fix from a refused one', async () => {
    mockGeolocation((_success, failure) =>
      failure({ ...denial(), code: 2 } as GeolocationPositionError),
    );
    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await result.current.locate();
    });

    await waitFor(() => expect(result.current.status).toBe('unavailable'));
  });

  it('handles a browser with no geolocation at all', async () => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
    const { result } = renderHook(() => useGeolocation());

    let coordinates: string | null = 'unset';
    await act(async () => {
      coordinates = await result.current.locate();
    });

    expect(coordinates).toBeNull();
    expect(result.current.status).toBe('unavailable');
  });

  // A weather app has no reason to follow the user around; a single fix is
  // cheaper on battery and far less intrusive.
  it('asks for one fix and never watches the position', async () => {
    const getCurrentPosition = mockGeolocation((success) => success(position(1, 2)));
    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await result.current.locate();
    });

    expect(getCurrentPosition).toHaveBeenCalledOnce();
    expect(navigator.geolocation.watchPosition).not.toHaveBeenCalled();
  });

  it('passes a timeout so a silent provider cannot hang the first load', async () => {
    const getCurrentPosition = mockGeolocation((success) => success(position(1, 2)));
    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await result.current.locate();
    });

    expect(getCurrentPosition.mock.calls[0][2]).toMatchObject({ timeout: expect.any(Number) });
    expect(getCurrentPosition.mock.calls[0][2].timeout).toBeLessThanOrEqual(15_000);
  });
});
