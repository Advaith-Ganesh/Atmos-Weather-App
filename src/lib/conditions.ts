import type { ConditionCategory } from '../types/weather';

/**
 * Visual Crossing returns a small, stable set of `icon` strings plus a much
 * looser free-text `conditions` field. We key off `icon` and use precipitation
 * intensity to promote rain to HEAVY_RAIN, which the icon set doesn't express.
 */
const ICON_MAP: Record<string, ConditionCategory> = {
  'clear-day': 'CLEAR',
  'clear-night': 'CLEAR',
  'partly-cloudy-day': 'PARTLY_CLOUDY',
  'partly-cloudy-night': 'PARTLY_CLOUDY',
  cloudy: 'CLOUDY',
  fog: 'FOG',
  wind: 'WIND',
  rain: 'RAIN',
  'showers-day': 'RAIN',
  'showers-night': 'RAIN',
  sleet: 'RAIN',
  hail: 'RAIN',
  snow: 'SNOW',
  'snow-showers-day': 'SNOW',
  'snow-showers-night': 'SNOW',
  'thunder-rain': 'THUNDERSTORM',
  'thunder-showers-day': 'THUNDERSTORM',
  'thunder-showers-night': 'THUNDERSTORM',
};

/** mm/h at which we treat rain as heavy. Roughly the UK Met Office threshold. */
const HEAVY_RAIN_MM = 4;

export function toConditionCategory(icon: string | undefined, precipitationMm = 0): ConditionCategory {
  const category = ICON_MAP[icon ?? ''] ?? 'CLOUDY';
  if (category === 'RAIN' && precipitationMm >= HEAVY_RAIN_MM) return 'HEAVY_RAIN';
  return category;
}

const LABELS: Record<ConditionCategory, string> = {
  CLEAR: 'Clear',
  PARTLY_CLOUDY: 'Partly cloudy',
  CLOUDY: 'Cloudy',
  FOG: 'Fog',
  RAIN: 'Rain',
  HEAVY_RAIN: 'Heavy rain',
  SNOW: 'Snow',
  THUNDERSTORM: 'Thunderstorm',
  WIND: 'Windy',
};

/**
 * Provider text is inconsistent ("Rain, Partially cloudy") and sometimes empty,
 * so we normalise it and fall back to our own label.
 */
export function toConditionLabel(category: ConditionCategory, providerText?: string): string {
  const primary = providerText?.split(',')[0]?.trim();
  if (!primary) return LABELS[category];
  return primary.charAt(0).toUpperCase() + primary.slice(1);
}

export const conditionLabel = (category: ConditionCategory) => LABELS[category];

/** Conditions that should trigger falling-particle backdrops. */
export const isPrecipitating = (category: ConditionCategory) =>
  category === 'RAIN' || category === 'HEAVY_RAIN' || category === 'SNOW' || category === 'THUNDERSTORM';
