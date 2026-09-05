/**
 * Small TTL cache with in-flight request de-duplication. Two components asking
 * for the same location at the same time produce one network request, and
 * re-searching a place you just looked at is instant.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, { value: T; expiresAt: number }>();
  private readonly pending = new Map<string, Promise<T>>();

  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(ttlMs: number, now: () => number = Date.now) {
    this.ttlMs = ttlMs;
    this.now = now;
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.entries.delete(key);
    this.pending.delete(key);
  }

  clear(): void {
    this.entries.clear();
    this.pending.clear();
  }

  /** Returns the cached value, joins an in-flight request, or starts a new one. */
  async resolve(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const inFlight = this.pending.get(key);
    if (inFlight) return inFlight;

    const request: Promise<T> = load()
      .then((value) => {
        // A forced refresh can drop this request while it is still in flight;
        // storing its result would resurrect data the caller discarded.
        if (this.pending.get(key) === request) this.set(key, value);
        return value;
      })
      .finally(() => {
        if (this.pending.get(key) === request) this.pending.delete(key);
      });

    this.pending.set(key, request);
    return request;
  }
}
