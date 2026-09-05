import type { HourPoint, WeatherData } from '../types/weather';

export interface HourWindow {
  /** Up to `pastCount` hours ending with the hour currently in progress. */
  past: HourPoint[];
  /** Up to `futureCount` hours starting with the next full hour. */
  future: HourPoint[];
}

/**
 * The hourly series spans several days; every view needs a slice around "now"
 * at the location. Splitting once here keeps the boundary logic in one place.
 */
export function splitAroundNow(
  hours: HourPoint[],
  nowEpoch: number,
  pastCount = 24,
  futureCount = 24,
): HourWindow {
  const firstFuture = hours.findIndex((hour) => hour.epoch > nowEpoch);
  const pivot = firstFuture === -1 ? hours.length : firstFuture;
  return {
    past: hours.slice(Math.max(0, pivot - pastCount), pivot),
    future: hours.slice(pivot, pivot + futureCount),
  };
}

export const hourWindow = (data: WeatherData, pastCount = 24, futureCount = 24) =>
  splitAroundNow(data.hours, data.current.epoch, pastCount, futureCount);
