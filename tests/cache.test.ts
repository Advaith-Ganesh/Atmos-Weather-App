import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../src/lib/cache';

describe('TtlCache', () => {
  it('returns a stored value until it expires', () => {
    let now = 0;
    const cache = new TtlCache<string>(1000, () => now);
    cache.set('london', 'sunny');
    expect(cache.get('london')).toBe('sunny');

    now = 999;
    expect(cache.get('london')).toBe('sunny');

    now = 1000;
    expect(cache.get('london')).toBeUndefined();
  });

  it('serves a repeated request without calling the loader again', async () => {
    const cache = new TtlCache<number>(1000);
    const load = vi.fn().mockResolvedValue(42);

    expect(await cache.resolve('key', load)).toBe(42);
    expect(await cache.resolve('key', load)).toBe(42);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('de-duplicates concurrent requests for the same key', async () => {
    const cache = new TtlCache<number>(1000);
    const load = vi.fn(() => new Promise<number>((resolve) => setTimeout(() => resolve(7), 5)));

    const [first, second] = await Promise.all([cache.resolve('key', load), cache.resolve('key', load)]);

    expect(first).toBe(7);
    expect(second).toBe(7);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failed load, and retries next time', async () => {
    const cache = new TtlCache<number>(1000);
    const load = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(1);

    await expect(cache.resolve('key', load)).rejects.toThrow('boom');
    await expect(cache.resolve('key', load)).resolves.toBe(1);
    expect(load).toHaveBeenCalledTimes(2);
  });

  // Regression: a forced refresh deletes the entry, but the request it replaced
  // was still in flight and used to write its stale result back afterwards.
  it('does not let a discarded in-flight request repopulate the cache', async () => {
    const cache = new TtlCache<string>(10_000);
    let releaseStale: (value: string) => void = () => {};

    const stale = cache.resolve('london', () => new Promise<string>((resolve) => (releaseStale = resolve)));
    cache.delete('london');

    const fresh = await cache.resolve('london', () => Promise.resolve('fresh'));
    expect(fresh).toBe('fresh');

    releaseStale('stale');
    await stale;

    expect(cache.get('london')).toBe('fresh');
  });

  it('drops entries on delete and clear', () => {
    const cache = new TtlCache<string>(1000);
    cache.set('a', 'x');
    cache.set('b', 'y');
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('y');
    cache.clear();
    expect(cache.get('b')).toBeUndefined();
  });
});
