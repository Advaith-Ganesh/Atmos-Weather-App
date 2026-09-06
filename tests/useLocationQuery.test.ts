import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useLocationQuery } from '../src/hooks/useLocationQuery';

// Relative paths keep this same-origin under jsdom, whose origin is not the
// dev server's.
const visit = (search = '') => window.history.replaceState({}, '', `/${search}`);

beforeEach(() => visit());
afterEach(() => visit());

describe('useLocationQuery', () => {
  it('reads a valid location out of the URL', () => {
    visit('?q=Tokyo');
    const { result } = renderHook(() => useLocationQuery());
    expect(result.current.query).toBe('Tokyo');
    expect(result.current.rejectedLink).toBe(false);
  });

  it('normalises what it reads', () => {
    visit('?q=%20%20New%20%20%20York%20%20');
    const { result } = renderHook(() => useLocationQuery());
    expect(result.current.query).toBe('New York');
  });

  it('reports no location when the parameter is absent', () => {
    const { result } = renderHook(() => useLocationQuery());
    expect(result.current.query).toBeNull();
    expect(result.current.rejectedLink).toBe(false);
  });

  // The distinction matters: an absent parameter should try geolocation, a
  // rejected one should go straight to the fallback.
  it.each(['<script>alert(1)</script>', '../../etc/passwd', 'a'.repeat(300), '---'])(
    'rejects %j without reporting it as an empty URL',
    (hostile) => {
      visit(`?q=${encodeURIComponent(hostile)}`);
      const { result } = renderHook(() => useLocationQuery());
      expect(result.current.query).toBeNull();
      expect(result.current.rejectedLink).toBe(true);
    },
  );

  it('accepts the coordinates geolocation writes', () => {
    visit('?q=51.5074%2C-0.1276');
    const { result } = renderHook(() => useLocationQuery());
    expect(result.current.query).toBe('51.5074,-0.1276');
    expect(result.current.rejectedLink).toBe(false);
  });

  it('pushes a new history entry when the location changes', () => {
    const { result } = renderHook(() => useLocationQuery());
    const before = window.history.length;

    act(() => result.current.setQuery('Dubai'));

    expect(result.current.query).toBe('Dubai');
    expect(new URL(window.location.href).searchParams.get('q')).toBe('Dubai');
    expect(window.history.length).toBeGreaterThan(before);
  });

  it('replaces instead of pushing when asked, so the fallback is not a back-button step', () => {
    const { result } = renderHook(() => useLocationQuery());
    const before = window.history.length;

    act(() => result.current.setQuery('London', { replace: true }));

    expect(window.location.search).toBe('?q=London');
    expect(window.history.length).toBe(before);
  });

  it('clears a rejected link once a real search replaces it', () => {
    visit('?q=%3Cbad%3E');
    const { result } = renderHook(() => useLocationQuery());
    expect(result.current.rejectedLink).toBe(true);

    act(() => result.current.setQuery('Paris'));
    expect(result.current.rejectedLink).toBe(false);
    expect(result.current.query).toBe('Paris');
  });

  it('does not add a history entry when the URL would not change', () => {
    visit('?q=London');
    const { result } = renderHook(() => useLocationQuery());
    const before = window.history.length;

    act(() => result.current.setQuery('London'));
    expect(window.history.length).toBe(before);
  });

  it('follows back-navigation', () => {
    visit('?q=London');
    const { result } = renderHook(() => useLocationQuery());

    act(() => {
      window.history.replaceState({}, '', '/?q=Tokyo');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(result.current.query).toBe('Tokyo');
  });
});
