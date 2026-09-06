import { useEffect, useState } from 'react';

/**
 * Tracks the browser's connectivity flag. `false` is reliable — the browser
 * knows there is no connection. `true` only means an interface is up, so it is
 * used to trigger a retry rather than to promise the request will succeed.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}
