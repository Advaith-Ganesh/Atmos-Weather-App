export type TemperatureUnit = 'C' | 'F';
export type SpeedUnit = 'kmh' | 'mph';

export interface UnitPreferences {
  temperature: TemperatureUnit;
  speed: SpeedUnit;
}

export const DEFAULT_UNITS: UnitPreferences = { temperature: 'C', speed: 'kmh' };

const KM_PER_MILE = 1.609344;

export const celsiusToFahrenheit = (celsius: number) => celsius * (9 / 5) + 32;
export const kmhToMph = (kmh: number) => kmh / KM_PER_MILE;
export const kmToMiles = (km: number) => km / KM_PER_MILE;
export const mmToInches = (mm: number) => mm / 25.4;

export const convertTemperature = (celsius: number, unit: TemperatureUnit) =>
  unit === 'F' ? celsiusToFahrenheit(celsius) : celsius;

export const convertSpeed = (kmh: number, unit: SpeedUnit) => (unit === 'mph' ? kmhToMph(kmh) : kmh);

export const temperatureSuffix = (unit: TemperatureUnit) => `°${unit}`;
export const speedSuffix = (unit: SpeedUnit) => (unit === 'mph' ? 'mph' : 'km/h');

/** Rounded temperature with degree sign, e.g. "12°". Used everywhere in the UI. */
export function formatTemperature(celsius: number, unit: TemperatureUnit, withUnit = false): string {
  const value = Math.round(convertTemperature(celsius, unit));
  return withUnit ? `${value}${temperatureSuffix(unit)}` : `${value}°`;
}

export function formatSpeed(kmh: number, unit: SpeedUnit): string {
  return `${Math.round(convertSpeed(kmh, unit))} ${speedSuffix(unit)}`;
}

export function formatDistance(km: number, unit: SpeedUnit): string {
  const value = unit === 'mph' ? kmToMiles(km) : km;
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${unit === 'mph' ? 'mi' : 'km'}`;
}

export function formatPrecipitation(mm: number, unit: SpeedUnit): string {
  if (unit === 'mph') return `${mmToInches(mm).toFixed(2)} in`;
  return `${mm < 10 ? mm.toFixed(1) : Math.round(mm)} mm`;
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

/** Degrees to a 16-point compass label. 348.75°–11.25° is north. */
export function windDirectionLabel(degrees: number): string {
  const normalised = ((degrees % 360) + 360) % 360;
  return COMPASS[Math.round(normalised / 22.5) % 16];
}
