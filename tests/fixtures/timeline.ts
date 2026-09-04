import type { VcDay, VcHour, VcResponse } from '../../src/api/visualCrossingTypes';

/**
 * Builds a Visual Crossing-shaped payload with the same structure the real API
 * returns: one entry per requested day, each carrying 24 hourly records, plus a
 * `currentConditions` block. Values are generated from a fixed seed so every
 * assertion is deterministic.
 */

export interface TimelineOptions {
  timezone: string;
  /** Fixed UTC offset in hours for the window being generated. */
  offsetHours: number;
  resolvedAddress: string;
  /** Local calendar date of the first day, e.g. "2026-07-14". */
  firstDate: string;
  days?: number;
  /** Local hour of `currentConditions` on the second day. */
  currentHour?: number;
  icon?: string;
}

const HOUR = 3600;
const DAY = 24 * HOUR;

const pad = (value: number) => String(value).padStart(2, '0');

const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

function hour(epoch: number, index: number, icon: string): VcHour {
  const hourOfDay = ((index % 24) + 24) % 24;
  // Simple diurnal curve: coldest at 04:00, warmest at 16:00.
  const temp = Math.round((15 + 6 * Math.sin(((hourOfDay - 10) / 24) * 2 * Math.PI)) * 10) / 10;
  return {
    datetimeEpoch: epoch,
    temp,
    feelslike: Math.round((temp - 1.5) * 10) / 10,
    humidity: 60 + (hourOfDay % 5) * 4,
    dew: Math.round((temp - 4) * 10) / 10,
    precip: hourOfDay === 14 ? 1.4 : 0,
    precipprob: hourOfDay >= 12 && hourOfDay <= 15 ? 20 + (hourOfDay - 12) * 20 : 5,
    snow: 0,
    windspeed: 10 + (hourOfDay % 6) * 2,
    winddir: (200 + hourOfDay * 3) % 360,
    pressure: 1012 + (hourOfDay % 3),
    visibility: 14,
    cloudcover: 30 + (hourOfDay % 7) * 5,
    uvindex: hourOfDay >= 9 && hourOfDay <= 17 ? 5 : 0,
    conditions: 'Partially cloudy',
    icon,
  };
}

export function buildTimeline(options: TimelineOptions): VcResponse {
  const { timezone, offsetHours, resolvedAddress, firstDate, days = 8, currentHour = 13, icon = 'partly-cloudy-day' } = options;

  const firstMidnightUtc = Date.parse(`${firstDate}T00:00:00Z`) / 1000 - offsetHours * HOUR;

  const vcDays: VcDay[] = Array.from({ length: days }, (_, dayIndex) => {
    const dayStart = firstMidnightUtc + dayIndex * DAY;
    const hours = Array.from({ length: 24 }, (_, hourIndex) =>
      hour(dayStart + hourIndex * HOUR, hourIndex, icon),
    );
    const temps = hours.map((entry) => entry.temp as number);

    return {
      datetime: addDays(firstDate, dayIndex),
      datetimeEpoch: dayStart,
      temp: 15,
      tempmax: Math.max(...temps),
      tempmin: Math.min(...temps),
      feelslike: 13.5,
      humidity: 68,
      dew: 11,
      precip: 1.4,
      precipprob: 60,
      snow: 0,
      windspeed: 18,
      winddir: 215,
      pressure: 1013,
      visibility: 14,
      cloudcover: 45,
      uvindex: 5,
      conditions: 'Rain, Partially cloudy',
      icon,
      sunriseEpoch: dayStart + 5 * HOUR,
      sunsetEpoch: dayStart + 21 * HOUR,
      hours,
    };
  });

  const currentEpoch = firstMidnightUtc + DAY + currentHour * HOUR;

  return {
    latitude: 51.5072,
    longitude: -0.1276,
    resolvedAddress,
    address: resolvedAddress,
    timezone,
    tzoffset: offsetHours,
    days: vcDays,
    currentConditions: { ...hour(currentEpoch, currentHour, icon), conditions: 'Partially cloudy' },
  };
}

export const londonTimeline = () =>
  buildTimeline({
    timezone: 'Europe/London',
    offsetHours: 1,
    resolvedAddress: 'London, England, United Kingdom',
    firstDate: '2026-07-14',
  });

export const tokyoTimeline = () =>
  buildTimeline({
    timezone: 'Asia/Tokyo',
    offsetHours: 9,
    resolvedAddress: 'Tokyo, Japan',
    firstDate: '2026-07-14',
  });

/** Geolocation searches come back with the coordinates as the resolved address. */
export const coordinateTimeline = () =>
  buildTimeline({
    timezone: 'Europe/Madrid',
    offsetHours: 2,
    resolvedAddress: '40.4168,-3.7038',
    firstDate: '2026-07-14',
  });

export const currentEpochOf = (response: VcResponse) => response.currentConditions?.datetimeEpoch ?? 0;

export const pad2 = pad;
