import { describe, expect, it } from 'vitest';
import { CHART_METRICS, METRIC_OPTIONS, METRIC_ORDER, type Metric } from '../src/components/weather/chartMetrics';
import type { UnitPreferences } from '../src/lib/units';
import type { HourPoint } from '../src/types/weather';

const metric: UnitPreferences = { temperature: 'C', speed: 'kmh' };
const imperial: UnitPreferences = { temperature: 'F', speed: 'mph' };

const hour: HourPoint = {
  epoch: 0,
  temperature: 21.46,
  feelsLike: 20,
  precipProbability: 63.7,
  precipitation: 1.2,
  windSpeed: 24.3,
  windDirection: 180,
  humidity: 71.2,
  uvIndex: 4,
  cloudCover: 40,
  condition: 'RAIN',
  conditionLabel: 'Rain',
  isDaylight: true,
};

describe('chart metric definitions', () => {
  it('covers every metric in the switcher, in a stable order', () => {
    expect(METRIC_OPTIONS.map((option) => option.value)).toEqual([...METRIC_ORDER]);
    for (const value of METRIC_ORDER) expect(CHART_METRICS[value]).toBeDefined();
  });

  it('reads temperature to one decimal and honours the unit', () => {
    expect(CHART_METRICS.temperature.value(hour, metric)).toBe(21.5);
    expect(CHART_METRICS.temperature.value(hour, imperial)).toBe(70.6);
    expect(CHART_METRICS.temperature.unitLabel(metric)).toBe('°C');
    expect(CHART_METRICS.temperature.unitLabel(imperial)).toBe('°F');
  });

  it('reads wind as whole units and honours the unit', () => {
    expect(CHART_METRICS.wind.value(hour, metric)).toBe(24);
    expect(CHART_METRICS.wind.value(hour, imperial)).toBe(15);
    expect(CHART_METRICS.wind.unitLabel(imperial)).toBe(' mph');
  });

  it('reads percentages as whole numbers that never change with units', () => {
    for (const key of ['precipitation', 'humidity'] as const) {
      expect(CHART_METRICS[key].value(hour, metric)).toBe(CHART_METRICS[key].value(hour, imperial));
      expect(CHART_METRICS[key].unitLabel(metric)).toBe('%');
    }
    expect(CHART_METRICS.precipitation.value(hour, metric)).toBe(64);
    expect(CHART_METRICS.humidity.value(hour, metric)).toBe(71);
  });

  // A bounded metric gets a fixed 0–100 axis; getting this wrong would silently
  // rescale the chart and misrepresent the data.
  it('marks only the percentage metrics as bounded', () => {
    const bounded = METRIC_ORDER.filter((value) => CHART_METRICS[value].bounded);
    expect(bounded).toEqual(['precipitation', 'humidity']);
  });

  it('gives every metric a distinct colour and a short label', () => {
    const colours = METRIC_ORDER.map((value) => CHART_METRICS[value].colour);
    expect(new Set(colours).size).toBe(colours.length);

    for (const value of METRIC_ORDER) {
      const { label, colour } = CHART_METRICS[value as Metric];
      expect(label.length).toBeGreaterThan(0);
      expect(colour).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
