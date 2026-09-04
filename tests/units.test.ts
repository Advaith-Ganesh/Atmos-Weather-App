import { describe, expect, it } from 'vitest';
import {
  celsiusToFahrenheit,
  convertSpeed,
  formatDistance,
  formatPrecipitation,
  formatSpeed,
  formatTemperature,
  kmhToMph,
  windDirectionLabel,
} from '../src/lib/units';

describe('temperature conversion', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [21.5, 70.7],
  ])('converts %d°C to %d°F', (celsius, fahrenheit) => {
    expect(celsiusToFahrenheit(celsius)).toBeCloseTo(fahrenheit, 6);
  });

  it('rounds for display without changing the underlying value', () => {
    expect(formatTemperature(21.4, 'C')).toBe('21°');
    expect(formatTemperature(21.4, 'F', true)).toBe('71°F');
    // Math.round(-0.4) is negative zero; it must never render as "-0°".
    expect(formatTemperature(-0.4, 'C')).toBe('0°');
    expect(formatTemperature(-0.6, 'C')).toBe('-1°');
  });
});

describe('speed conversion', () => {
  it('uses the exact statute mile', () => {
    expect(kmhToMph(1.609344)).toBeCloseTo(1, 10);
    expect(kmhToMph(100)).toBeCloseTo(62.1371, 4);
  });

  it('leaves metric values untouched', () => {
    expect(convertSpeed(42, 'kmh')).toBe(42);
  });

  it('formats with the matching suffix', () => {
    expect(formatSpeed(20, 'kmh')).toBe('20 km/h');
    expect(formatSpeed(20, 'mph')).toBe('12 mph');
  });
});

describe('distance and precipitation formatting', () => {
  it('switches to miles and inches for imperial', () => {
    expect(formatDistance(16, 'mph')).toBe('9.9 mi');
    expect(formatDistance(24, 'mph')).toBe('15 mi');
    expect(formatDistance(16, 'kmh')).toBe('16 km');
    expect(formatPrecipitation(25.4, 'mph')).toBe('1.00 in');
    expect(formatPrecipitation(2.5, 'kmh')).toBe('2.5 mm');
  });
});

describe('wind direction', () => {
  it.each([
    [0, 'N'],
    [90, 'E'],
    [180, 'S'],
    [270, 'W'],
    [315, 'NW'],
    [359, 'N'],
    [22.5, 'NNE'],
  ])('maps %d degrees to %s', (degrees, label) => {
    expect(windDirectionLabel(degrees)).toBe(label);
  });

  it('normalises values outside 0-360', () => {
    expect(windDirectionLabel(-90)).toBe('W');
    expect(windDirectionLabel(450)).toBe('E');
  });
});
