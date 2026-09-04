import { describe, expect, it } from 'vitest';
import { WeatherError } from '../src/api/errors';
import { parseLocationName, transformTimeline } from '../src/api/transform';
import { isoDateInZone } from '../src/lib/time';
import { coordinateTimeline, londonTimeline, tokyoTimeline } from './fixtures/timeline';

describe('transforming the Visual Crossing payload', () => {
  const data = transformTimeline(londonTimeline(), 'London');

  it('normalises the location', () => {
    expect(data.location).toMatchObject({
      query: 'London',
      name: 'London',
      region: 'England, United Kingdom',
      timezone: 'Europe/London',
    });
  });

  it('reads current conditions from the provider block', () => {
    expect(data.current.epoch).toBe(londonTimeline().currentConditions?.datetimeEpoch);
    expect(data.current.condition).toBe('PARTLY_CLOUDY');
    expect(data.current.conditionLabel).toBe('Partially cloudy');
    expect(data.current.isDaylight).toBe(true);
  });

  it('flattens every hour into one ordered series', () => {
    expect(data.hours).toHaveLength(8 * 24);
    const epochs = data.hours.map((hour) => hour.epoch);
    expect([...epochs].sort((a, b) => a - b)).toEqual(epochs);
    expect(new Set(epochs).size).toBe(epochs.length);
  });

  it('keeps seven forecast days starting today, dropping the history day', () => {
    expect(data.days).toHaveLength(7);
    expect(data.days[0].date).toBe(isoDateInZone(data.current.epoch, data.location.timezone));
    expect(data.days.some((day) => day.date === '2026-07-14')).toBe(false);
  });

  it('marks hours as day or night from that day sunrise and sunset', () => {
    const day = data.days[0];
    const noon = data.hours.find((hour) => hour.epoch === day.epoch + 12 * 3600);
    const midnight = data.hours.find((hour) => hour.epoch === day.epoch);
    expect(noon?.isDaylight).toBe(true);
    expect(midnight?.isDaylight).toBe(false);
  });

  it('clamps percentages and defaults missing numbers', () => {
    const raw = londonTimeline();
    raw.currentConditions!.humidity = 140;
    raw.currentConditions!.precipprob = null;
    raw.currentConditions!.visibility = null;
    const clamped = transformTimeline(raw, 'London');
    expect(clamped.current.humidity).toBe(100);
    expect(clamped.current.precipProbability).toBe(0);
    expect(clamped.current.visibility).toBe(10);
  });

  it('falls back to the nearest hour when currentConditions is absent', () => {
    const raw = londonTimeline();
    const target = raw.days[1].hours![9].datetimeEpoch;
    delete raw.currentConditions;
    const fallback = transformTimeline(raw, 'London', target * 1000);
    expect(fallback.current.epoch).toBe(target);
  });
});

describe('timezone independence', () => {
  it('slices the same payload differently for a different timezone', () => {
    const london = transformTimeline(londonTimeline(), 'London');
    const tokyo = transformTimeline(tokyoTimeline(), 'Tokyo');
    expect(tokyo.location.timezone).toBe('Asia/Tokyo');
    expect(tokyo.days[0].date).toBe('2026-07-15');
    expect(london.days[0].date).toBe('2026-07-15');
    // Same local wall-clock hour, eight hours apart in absolute time.
    expect(tokyo.current.epoch).toBe(london.current.epoch - 8 * 3600);
  });
});

describe('parseLocationName', () => {
  it('splits a resolved address into a name and a region', () => {
    expect(parseLocationName('London, England, United Kingdom', 'Europe/London')).toEqual({
      name: 'London',
      region: 'England, United Kingdom',
    });
  });

  it('handles single-component addresses', () => {
    expect(parseLocationName('Dubai', 'Asia/Dubai')).toEqual({ name: 'Dubai', region: '' });
  });

  it('uses the timezone when the provider echoes back coordinates', () => {
    expect(parseLocationName('40.4168,-3.7038', 'Europe/Madrid')).toEqual({ name: 'Madrid', region: 'Europe' });
    expect(parseLocationName('40.7,-74.0', 'America/New_York')).toEqual({ name: 'New York', region: 'America' });
  });

  it('is applied end to end for geolocation searches', () => {
    const data = transformTimeline(coordinateTimeline(), '40.4168,-3.7038');
    expect(data.location.name).toBe('Madrid');
  });
});

describe('malformed payloads', () => {
  it('rejects a response with no days', () => {
    expect(() => transformTimeline({ ...londonTimeline(), days: [] }, 'London')).toThrow(WeatherError);
  });

  it('rejects a response with no hourly data', () => {
    const raw = londonTimeline();
    raw.days = raw.days.map((day) => ({ ...day, hours: [] }));
    expect(() => transformTimeline(raw, 'London')).toThrow(/No weather data/);
  });

  it('rejects a response whose days all predate the current time', () => {
    const raw = londonTimeline();
    raw.days = raw.days.slice(0, 1);
    expect(() => transformTimeline(raw, 'London')).toThrow(WeatherError);
  });
});
