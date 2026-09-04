import { describe, expect, it } from 'vitest';
import { transformTimeline } from '../src/api/transform';
import { hourWindow, maxPrecipProbability, splitAroundNow, timelineSeries } from '../src/lib/series';
import type { HourPoint } from '../src/types/weather';
import { londonTimeline } from './fixtures/timeline';

const hour = (epoch: number): HourPoint => ({
  epoch,
  temperature: 10,
  feelsLike: 9,
  precipProbability: 0,
  precipitation: 0,
  windSpeed: 5,
  windDirection: 0,
  humidity: 50,
  uvIndex: 0,
  cloudCover: 0,
  condition: 'CLEAR',
  conditionLabel: 'Clear',
  isDaylight: true,
});

describe('splitting the series around the current hour', () => {
  const hours = Array.from({ length: 72 }, (_, index) => hour(index * 3600));

  it('puts the hour in progress at the end of the past window', () => {
    const now = 40 * 3600 + 1500;
    const { past, future } = splitAroundNow(hours, now);
    expect(past).toHaveLength(24);
    expect(future).toHaveLength(24);
    expect(past.at(-1)?.epoch).toBe(40 * 3600);
    expect(future[0].epoch).toBe(41 * 3600);
  });

  it('treats an exact hour boundary as still in the past window', () => {
    const { past, future } = splitAroundNow(hours, 40 * 3600);
    expect(past.at(-1)?.epoch).toBe(40 * 3600);
    expect(future[0].epoch).toBe(41 * 3600);
  });

  it('returns short windows near the edges rather than padding', () => {
    expect(splitAroundNow(hours, 2 * 3600).past).toHaveLength(3);
    expect(splitAroundNow(hours, 71 * 3600).future).toHaveLength(0);
  });

  it('honours custom window sizes', () => {
    const { past, future } = splitAroundNow(hours, 40 * 3600, 0, 12);
    expect(past).toHaveLength(0);
    expect(future).toHaveLength(12);
  });
});

describe('windows over real transformed data', () => {
  const data = transformTimeline(londonTimeline(), 'London');

  it('gives a full 24 hours of history and 24 of forecast', () => {
    const { past, future } = hourWindow(data);
    expect(past).toHaveLength(24);
    expect(future).toHaveLength(24);
    expect(past.every((entry) => entry.epoch <= data.current.epoch)).toBe(true);
    expect(future.every((entry) => entry.epoch > data.current.epoch)).toBe(true);
  });

  it('produces a contiguous 48-point chart series', () => {
    const series = timelineSeries(data);
    expect(series).toHaveLength(48);
    for (let index = 1; index < series.length; index += 1) {
      expect(series[index].epoch - series[index - 1].epoch).toBe(3600);
    }
  });

  it('finds the peak precipitation probability in a window', () => {
    expect(maxPrecipProbability(hourWindow(data, 0, 24).future)).toBeGreaterThan(0);
    expect(maxPrecipProbability([])).toBe(0);
  });
});
