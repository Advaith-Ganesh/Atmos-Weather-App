import { describe, expect, it } from 'vitest';
import { clothingAdvice, outdoorAssessment } from '../src/lib/insights';
import type { CurrentConditions, HourPoint } from '../src/types/weather';

const current = (overrides: Partial<CurrentConditions> = {}): CurrentConditions => ({
  epoch: 0,
  temperature: 18,
  feelsLike: 18,
  condition: 'CLEAR',
  conditionLabel: 'Clear',
  isDaylight: true,
  windSpeed: 8,
  windDirection: 180,
  precipProbability: 5,
  humidity: 55,
  uvIndex: 3,
  visibility: 15,
  pressure: 1013,
  cloudCover: 20,
  dewPoint: 9,
  ...overrides,
});

const hours = (overrides: Partial<HourPoint> = {}, count = 6): HourPoint[] =>
  Array.from({ length: count }, (_, index) => ({
    epoch: index * 3600,
    temperature: 18,
    feelsLike: 18,
    precipProbability: 5,
    precipitation: 0,
    windSpeed: 8,
    windDirection: 180,
    humidity: 55,
    uvIndex: 3,
    cloudCover: 20,
    condition: 'CLEAR',
    conditionLabel: 'Clear',
    isDaylight: true,
    ...overrides,
  }));

const tipIds = (advice: ReturnType<typeof clothingAdvice>) => advice.tips.map((tip) => tip.id);

describe('what should I wear', () => {
  it('recommends a coat below freezing', () => {
    const advice = clothingAdvice(current({ feelsLike: -3 }), hours({ feelsLike: -3 }));
    expect(advice.headline).toBe('Dress warm');
    expect(tipIds(advice)).toContain('freezing');
  });

  it('steps down through the temperature bands', () => {
    expect(tipIds(clothingAdvice(current({ feelsLike: 5 }), hours({ feelsLike: 5 })))).toContain('cold');
    expect(tipIds(clothingAdvice(current({ feelsLike: 13 }), hours({ feelsLike: 13 })))).toContain('mild');
    expect(tipIds(clothingAdvice(current({ feelsLike: 19 }), hours({ feelsLike: 19 })))).toContain('comfortable');
    expect(tipIds(clothingAdvice(current({ feelsLike: 31 }), hours({ feelsLike: 31 })))).toContain('hot');
  });

  it('uses the coldest hour ahead, not just right now', () => {
    const advice = clothingAdvice(current({ feelsLike: 16 }), hours({ feelsLike: 4 }));
    expect(tipIds(advice)).toContain('cold');
  });

  it('suggests an umbrella once rain is likely', () => {
    expect(tipIds(clothingAdvice(current(), hours({ precipProbability: 75 })))).toContain('umbrella');
    expect(tipIds(clothingAdvice(current(), hours({ precipProbability: 40 })))).toContain('showers');
    expect(tipIds(clothingAdvice(current(), hours({ precipProbability: 10 })))).not.toContain('showers');
  });

  it('flags high UV, strong wind, snow and fog', () => {
    expect(tipIds(clothingAdvice(current({ uvIndex: 8 }), hours()))).toContain('uv');
    expect(tipIds(clothingAdvice(current({ windSpeed: 48 }), hours()))).toContain('gale');
    expect(tipIds(clothingAdvice(current({ windSpeed: 28 }), hours()))).toContain('breezy');
    expect(tipIds(clothingAdvice(current({ condition: 'SNOW' }), hours()))).toContain('snow');
    expect(tipIds(clothingAdvice(current({ visibility: 0.4 }), hours()))).toContain('fog');
  });

  it('gives a headline that agrees with the tips it shows', () => {
    expect(clothingAdvice(current({ feelsLike: 2 }), hours({ feelsLike: 2 })).headline).toBe('Dress warm');
    expect(clothingAdvice(current(), hours({ precipProbability: 80 })).headline).toBe('Take a coat and an umbrella');
    expect(clothingAdvice(current({ feelsLike: 30 }), hours({ feelsLike: 30 })).headline).toBe('Keep it light');
    expect(clothingAdvice(current(), hours({ precipProbability: 40 })).headline).toBe('Take something rainproof');
    expect(clothingAdvice(current({ feelsLike: 13 }), hours({ feelsLike: 13 })).headline).toBe('A jacket should do');
    expect(clothingAdvice(current(), hours()).headline).toBe('Nothing special needed');
  });

  it('never returns more than four tips', () => {
    const advice = clothingAdvice(
      current({ feelsLike: -5, uvIndex: 9, windSpeed: 50, visibility: 0.2, condition: 'SNOW' }),
      hours({ feelsLike: -5, precipProbability: 90, condition: 'SNOW' }),
    );
    expect(advice.tips.length).toBeLessThanOrEqual(4);
  });

  it('only looks six hours ahead', () => {
    const later = hours({}, 12).map((hour, index) => (index >= 6 ? { ...hour, feelsLike: -10 } : hour));
    expect(tipIds(clothingAdvice(current(), later))).not.toContain('freezing');
  });
});

describe('outdoor conditions', () => {
  it('rates a calm mild day as excellent', () => {
    const assessment = outdoorAssessment(current({ feelsLike: 19, windSpeed: 6, uvIndex: 3 }), hours());
    expect(assessment.rating).toBe('Excellent');
    expect(assessment.score).toBe(100);
    expect(assessment.summary).toContain('comfortable temperatures');
    expect(assessment.summary).toContain('light winds');
  });

  it('drops to poor when rain, cold and wind stack up', () => {
    const assessment = outdoorAssessment(
      current({ feelsLike: 2, windSpeed: 45, precipProbability: 90 }),
      hours({ precipProbability: 90, windSpeed: 45 }),
    );
    expect(assessment.rating).toBe('Poor');
    expect(assessment.summary).toContain('a high chance of rain');
    expect(assessment.summary).toContain('strong winds');
  });

  it('never scores outside 0 to 100', () => {
    const worst = outdoorAssessment(
      current({ feelsLike: -25, windSpeed: 120, precipProbability: 100, uvIndex: 12 }),
      hours({ precipProbability: 100, windSpeed: 120, uvIndex: 12 }),
    );
    expect(worst.score).toBeGreaterThanOrEqual(0);
    expect(worst.score).toBeLessThanOrEqual(100);
  });

  it('lands in the middle bands for mixed weather', () => {
    expect(outdoorAssessment(current({ precipProbability: 45 }), hours({ precipProbability: 45 })).rating).toBe('Good');
    expect(outdoorAssessment(current({ feelsLike: 4 }), hours({ precipProbability: 55 })).rating).toBe('Mixed');
  });

  it('explains each factor it scored', () => {
    const assessment = outdoorAssessment(current(), hours());
    expect(assessment.factors.map((factor) => factor.label)).toEqual(['Rain', 'Temperature', 'Wind', 'UV']);
  });
});
