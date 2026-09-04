import { describe, expect, it } from 'vitest';
import { conditionLabel, isPrecipitating, toConditionCategory, toConditionLabel } from '../src/lib/conditions';

describe('condition mapping', () => {
  it.each([
    ['clear-day', 'CLEAR'],
    ['clear-night', 'CLEAR'],
    ['partly-cloudy-night', 'PARTLY_CLOUDY'],
    ['cloudy', 'CLOUDY'],
    ['fog', 'FOG'],
    ['wind', 'WIND'],
    ['showers-day', 'RAIN'],
    ['snow-showers-night', 'SNOW'],
    ['thunder-rain', 'THUNDERSTORM'],
  ] as const)('maps the %s icon to %s', (icon, category) => {
    expect(toConditionCategory(icon)).toBe(category);
  });

  it('promotes rain to heavy rain past the intensity threshold', () => {
    expect(toConditionCategory('rain', 1)).toBe('RAIN');
    expect(toConditionCategory('rain', 4)).toBe('HEAVY_RAIN');
  });

  it('does not promote non-rain icons', () => {
    expect(toConditionCategory('snow', 12)).toBe('SNOW');
  });

  it('falls back to cloudy for unknown or missing icons', () => {
    expect(toConditionCategory(undefined)).toBe('CLOUDY');
    expect(toConditionCategory('meteor-shower')).toBe('CLOUDY');
  });
});

describe('condition labels', () => {
  it('takes the first clause of the provider text', () => {
    expect(toConditionLabel('RAIN', 'Rain, Partially cloudy')).toBe('Rain');
  });

  it('capitalises provider text', () => {
    expect(toConditionLabel('CLOUDY', 'overcast')).toBe('Overcast');
  });

  it('falls back to our own label when the provider says nothing', () => {
    expect(toConditionLabel('THUNDERSTORM', '')).toBe('Thunderstorm');
    expect(toConditionLabel('PARTLY_CLOUDY')).toBe('Partly cloudy');
    expect(conditionLabel('HEAVY_RAIN')).toBe('Heavy rain');
  });
});

describe('isPrecipitating', () => {
  it('is true only for wet conditions', () => {
    expect(isPrecipitating('RAIN')).toBe(true);
    expect(isPrecipitating('SNOW')).toBe(true);
    expect(isPrecipitating('CLEAR')).toBe(false);
    expect(isPrecipitating('WIND')).toBe(false);
  });
});
