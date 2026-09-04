/**
 * Every timestamp in the app is a Unix epoch rendered through the *location's*
 * timezone, never the browser's. `Intl.DateTimeFormat` handles DST for us, so
 * there is no manual offset arithmetic anywhere in this file.
 */

const cache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${timeZone}|${JSON.stringify(options)}`;
  let existing = cache.get(key);
  if (!existing) {
    existing = new Intl.DateTimeFormat('en-GB', { timeZone, ...options });
    cache.set(key, existing);
  }
  return existing;
}

const toDate = (epochSeconds: number) => new Date(epochSeconds * 1000);

/** "14:00" — 24-hour clock keeps the timeline columns a fixed width. */
export const formatHour = (epochSeconds: number, timeZone: string) =>
  formatter(timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(toDate(epochSeconds));

/** "Mon" */
export const formatWeekdayShort = (epochSeconds: number, timeZone: string) =>
  formatter(timeZone, { weekday: 'short' }).format(toDate(epochSeconds));

/** "Monday 14 March" */
export const formatDateLong = (epochSeconds: number, timeZone: string) =>
  formatter(timeZone, { weekday: 'long', day: 'numeric', month: 'long' }).format(toDate(epochSeconds));

/** "14 Mar" */
export const formatDateShort = (epochSeconds: number, timeZone: string) =>
  formatter(timeZone, { day: 'numeric', month: 'short' }).format(toDate(epochSeconds));

/** "Sat 14:32" — used for the "local time" readout in the header. */
export const formatLocalClock = (epochSeconds: number, timeZone: string) =>
  formatter(timeZone, { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
    toDate(epochSeconds),
  );

/** "2026-03-14" in the given zone. Safe to compare as strings. */
export function isoDateInZone(epochSeconds: number, timeZone: string): string {
  const parts = formatter(timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(
    toDate(epochSeconds),
  );
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export const isSameDayInZone = (a: number, b: number, timeZone: string) =>
  isoDateInZone(a, timeZone) === isoDateInZone(b, timeZone);

/**
 * "Today" / "Tomorrow" / "Mon" relative to the location's own calendar day,
 * which is why `now` has to be passed in rather than read from `Date.now()`.
 */
export function relativeDayLabel(epochSeconds: number, nowEpochSeconds: number, timeZone: string): string {
  const target = isoDateInZone(epochSeconds, timeZone);
  const today = isoDateInZone(nowEpochSeconds, timeZone);
  if (target === today) return 'Today';
  if (target === isoDateInZone(nowEpochSeconds + 86_400, timeZone)) return 'Tomorrow';
  return formatWeekdayShort(epochSeconds, timeZone);
}

/** "4h 12m" from a second count. Used for daylight duration. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return hours === 0 ? `${minutes}m` : `${hours}h ${minutes}m`;
}

export interface DaylightInfo {
  /** 0 before sunrise, 1 after sunset, fraction of the day elapsed in between. */
  progress: number;
  durationSeconds: number;
  isDaylight: boolean;
}

export function daylight(nowEpoch: number, sunriseEpoch: number, sunsetEpoch: number): DaylightInfo {
  const durationSeconds = Math.max(0, sunsetEpoch - sunriseEpoch);
  if (durationSeconds === 0) {
    return { progress: nowEpoch >= sunsetEpoch ? 1 : 0, durationSeconds: 0, isDaylight: false };
  }
  const elapsed = (nowEpoch - sunriseEpoch) / durationSeconds;
  const progress = Math.min(1, Math.max(0, elapsed));
  return { progress, durationSeconds, isDaylight: elapsed > 0 && elapsed < 1 };
}

/** "just now" / "3 min ago" / "2 hr ago" for the last-updated stamp. */
export function formatRelativeToNow(timestampMs: number, nowMs = Date.now()): string {
  const seconds = Math.max(0, Math.round((nowMs - timestampMs) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}
