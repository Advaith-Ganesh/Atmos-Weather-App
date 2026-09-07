import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePrefersReducedMotion } from '../src/hooks/usePrefersReducedMotion';

type Listener = () => void;

/** jsdom has no matchMedia, so the query is stubbed with a controllable one. */
function stubMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  const media = {
    matches: initial,
    addEventListener: (_event: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_event: string, listener: Listener) => listeners.delete(listener),
  };
  const matchMedia = vi.fn(() => media as unknown as MediaQueryList);
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });

  return {
    matchMedia,
    set(value: boolean) {
      media.matches = value;
      for (const listener of listeners) listener();
    },
    listenerCount: () => listeners.size,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePrefersReducedMotion', () => {
  it('starts from the current preference', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('asks for the reduce query specifically', () => {
    const media = stubMatchMedia(false);
    renderHook(() => usePrefersReducedMotion());
    expect(media.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  // Changing the OS setting should quiet the backdrop without a reload.
  it('follows the preference changing at runtime', () => {
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => media.set(true));
    expect(result.current).toBe(true);
  });

  it('detaches its listener on unmount', () => {
    const media = stubMatchMedia(false);
    const { unmount } = renderHook(() => usePrefersReducedMotion());
    expect(media.listenerCount()).toBe(1);

    unmount();
    expect(media.listenerCount()).toBe(0);
  });
});
