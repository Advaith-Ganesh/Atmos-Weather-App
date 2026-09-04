import { describe, expect, it } from 'vitest';
import {
  daylight,
  formatDateShort,
  formatDuration,
  formatHour,
  formatRelativeToNow,
  isSameDayInZone,
  isoDateInZone,
  relativeDayLabel,
} from '../src/lib/time';

/** 2026-07-15 12:00 UTC — inside British Summer Time. */
const SUMMER_NOON_UTC = Date.UTC(2026, 6, 15, 12, 0, 0) / 1000;
/** 2026-01-15 12:00 UTC — GMT, no offset in London. */
const WINTER_NOON_UTC = Date.UTC(2026, 0, 15, 12, 0, 0) / 1000;

describe('rendering times in the location timezone', () => {
  it('uses the location offset, not the runtime one', () => {
    expect(formatHour(SUMMER_NOON_UTC, 'Europe/London')).toBe('13:00');
    expect(formatHour(SUMMER_NOON_UTC, 'Asia/Tokyo')).toBe('21:00');
    expect(formatHour(SUMMER_NOON_UTC, 'America/New_York')).toBe('08:00');
    expect(formatHour(SUMMER_NOON_UTC, 'Asia/Dubai')).toBe('16:00');
  });

  it('applies daylight saving only where it is in force', () => {
    expect(formatHour(WINTER_NOON_UTC, 'Europe/London')).toBe('12:00');
    expect(formatHour(WINTER_NOON_UTC, 'Asia/Tokyo')).toBe('21:00');
    expect(formatHour(WINTER_NOON_UTC, 'America/New_York')).toBe('07:00');
  });

  it('handles the London clock change at 01:00 UTC on 29 March 2026', () => {
    const beforeChange = Date.UTC(2026, 2, 29, 0, 30, 0) / 1000;
    const afterChange = Date.UTC(2026, 2, 29, 1, 30, 0) / 1000;
    expect(formatHour(beforeChange, 'Europe/London')).toBe('00:30');
    expect(formatHour(afterChange, 'Europe/London')).toBe('02:30');
  });

  it('rolls the calendar date over at the location midnight', () => {
    const lateEvening = Date.UTC(2026, 6, 15, 22, 0, 0) / 1000;
    expect(isoDateInZone(lateEvening, 'Europe/London')).toBe('2026-07-15');
    expect(isoDateInZone(lateEvening, 'Asia/Tokyo')).toBe('2026-07-16');
    expect(isSameDayInZone(lateEvening, SUMMER_NOON_UTC, 'Europe/London')).toBe(true);
    expect(isSameDayInZone(lateEvening, SUMMER_NOON_UTC, 'Asia/Tokyo')).toBe(false);
  });

  it('formats short dates in the location timezone', () => {
    expect(formatDateShort(SUMMER_NOON_UTC, 'Europe/London')).toBe('15 Jul');
  });
});

describe('relative day labels', () => {
  const now = SUMMER_NOON_UTC;

  it('names today and tomorrow relative to the location calendar', () => {
    expect(relativeDayLabel(now, now, 'Europe/London')).toBe('Today');
    expect(relativeDayLabel(now + 86_400, now, 'Europe/London')).toBe('Tomorrow');
    expect(relativeDayLabel(now + 2 * 86_400, now, 'Europe/London')).toBe('Fri');
  });

  it('shifts when the location is already on the next day', () => {
    const lateInLondon = Date.UTC(2026, 6, 15, 23, 0, 0) / 1000;
    expect(relativeDayLabel(lateInLondon, lateInLondon, 'Asia/Tokyo')).toBe('Today');
    expect(relativeDayLabel(lateInLondon - 86_400, lateInLondon, 'Asia/Tokyo')).toBe('Wed');
  });
});

describe('daylight calculations', () => {
  const sunrise = Date.UTC(2026, 6, 15, 4, 0, 0) / 1000;
  const sunset = Date.UTC(2026, 6, 15, 20, 0, 0) / 1000;

  it('reports the fraction of the day elapsed', () => {
    const midday = daylight(sunrise + 8 * 3600, sunrise, sunset);
    expect(midday.progress).toBeCloseTo(0.5, 5);
    expect(midday.isDaylight).toBe(true);
    expect(midday.durationSeconds).toBe(16 * 3600);
  });

  it('clamps before sunrise and after sunset', () => {
    expect(daylight(sunrise - 3600, sunrise, sunset).progress).toBe(0);
    expect(daylight(sunset + 3600, sunrise, sunset).progress).toBe(1);
    expect(daylight(sunset + 3600, sunrise, sunset).isDaylight).toBe(false);
  });

  it('survives polar days where sunrise equals sunset', () => {
    const polar = daylight(sunrise, sunrise, sunrise);
    expect(polar.durationSeconds).toBe(0);
    expect(polar.isDaylight).toBe(false);
  });

  it('formats durations in hours and minutes', () => {
    expect(formatDuration(16 * 3600)).toBe('16h 0m');
    expect(formatDuration(3600 + 25 * 60)).toBe('1h 25m');
    expect(formatDuration(45 * 60)).toBe('45m');
    expect(formatDuration(-500)).toBe('0m');
  });
});

describe('relative timestamps', () => {
  const now = Date.UTC(2026, 6, 15, 12, 0, 0);

  it('describes how stale the data is', () => {
    expect(formatRelativeToNow(now - 10_000, now)).toBe('just now');
    expect(formatRelativeToNow(now - 3 * 60_000, now)).toBe('3 min ago');
    expect(formatRelativeToNow(now - 2 * 3_600_000, now)).toBe('2 hr ago');
  });
});
