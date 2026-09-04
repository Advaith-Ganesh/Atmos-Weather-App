import { useCallback, useState } from 'react';
import { coordinateQuery } from '../lib/validation';

export type GeolocationStatus = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable';

/**
 * One-shot location lookup. We deliberately do not use `watchPosition` — the app
 * has no reason to follow the user around, and a single fix is cheaper on
 * battery and less intrusive.
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle');

  const locate = useCallback(async (): Promise<string | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return null;
    }

    setStatus('locating');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setStatus('granted');
          resolve(coordinateQuery(position.coords.latitude, position.coords.longitude));
        },
        (error) => {
          setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
      );
    });
  }, []);

  return { status, locate };
}
