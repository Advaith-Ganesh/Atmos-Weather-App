import { convertSpeed, convertTemperature, speedSuffix, temperatureSuffix, type UnitPreferences } from '../../lib/units';
import type { HourPoint } from '../../types/weather';

export type Metric = 'temperature' | 'precipitation' | 'wind' | 'humidity';

export interface MetricDefinition {
  label: string;
  colour: string;
  /** Percentages get a fixed 0–100 axis; open-ended values are auto-scaled. */
  bounded: boolean;
  /** Suffix shown after a value, including any leading space it needs. */
  unitLabel: (units: UnitPreferences) => string;
  value: (hour: HourPoint, units: UnitPreferences) => number;
}

/**
 * Everything the chart needs to know about a metric lives in one entry. Before
 * this, adding a metric meant editing the option list, the colour map, a unit
 * ternary, a value switch and an axis condition — five places, in two of which
 * a missed case failed silently.
 */
export const CHART_METRICS: Record<Metric, MetricDefinition> = {
  temperature: {
    label: 'Temp',
    colour: '#5b9dff',
    bounded: false,
    unitLabel: (units) => temperatureSuffix(units.temperature),
    // One decimal: the line is smoother than whole degrees without implying
    // precision the forecast does not have.
    value: (hour, units) => Math.round(convertTemperature(hour.temperature, units.temperature) * 10) / 10,
  },
  precipitation: {
    label: 'Rain',
    colour: '#64d2ff',
    bounded: true,
    unitLabel: () => '%',
    value: (hour) => Math.round(hour.precipProbability),
  },
  wind: {
    label: 'Wind',
    colour: '#7ee0c8',
    bounded: false,
    unitLabel: (units) => ` ${speedSuffix(units.speed)}`,
    value: (hour, units) => Math.round(convertSpeed(hour.windSpeed, units.speed)),
  },
  humidity: {
    label: 'Humidity',
    colour: '#a88cff',
    bounded: true,
    unitLabel: () => '%',
    value: (hour) => Math.round(hour.humidity),
  },
};

/** Display order of the metric switcher. */
export const METRIC_ORDER: readonly Metric[] = ['temperature', 'precipitation', 'wind', 'humidity'];

export const METRIC_OPTIONS = METRIC_ORDER.map((value) => ({ value, label: CHART_METRICS[value].label }));
