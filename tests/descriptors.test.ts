import { describe, expect, it } from 'vitest';
import { describePressure, describeUvIndex, describeVisibility } from '../src/lib/descriptors';

describe('describeUvIndex', () => {
  // Boundaries of the WHO global UV index bands.
  it.each([
    [0, 'Low'],
    [2, 'Low'],
    [3, 'Moderate'],
    [5, 'Moderate'],
    [6, 'High'],
    [7, 'High'],
    [8, 'Very high'],
    [10, 'Very high'],
    [11, 'Extreme'],
    [15, 'Extreme'],
  ])('describes UV %d as %s', (uv, expected) => {
    expect(describeUvIndex(uv)).toBe(expected);
  });
});

describe('describePressure', () => {
  it.each([
    [995, 'Low'],
    [1009, 'Low'],
    [1010, 'Normal'],
    [1013, 'Normal'],
    [1022, 'Normal'],
    [1023, 'High'],
    [1040, 'High'],
  ])('describes %d hPa as %s', (hPa, expected) => {
    expect(describePressure(hPa)).toBe(expected);
  });
});

describe('describeVisibility', () => {
  it.each([
    [0, 'Very poor'],
    [0.4, 'Very poor'],
    [1, 'Poor'],
    [3.9, 'Poor'],
    [4, 'Moderate'],
    [9.9, 'Moderate'],
    [10, 'Clear'],
    [40, 'Clear'],
  ])('describes %s km as %s', (km, expected) => {
    expect(describeVisibility(km)).toBe(expected);
  });
});
