/**
 * Application-level weather model. Nothing outside `src/api` should know that
 * Visual Crossing exists — components consume these types only.
 *
 * All values are canonical metric (°C, km/h, mm, km, hPa). Unit conversion is a
 * presentation concern and happens in `lib/units.ts`.
 */

export type ConditionCategory =
  | 'CLEAR'
  | 'PARTLY_CLOUDY'
  | 'CLOUDY'
  | 'FOG'
  | 'RAIN'
  | 'HEAVY_RAIN'
  | 'SNOW'
  | 'THUNDERSTORM'
  | 'WIND';

export interface WeatherLocation {
  /** Raw string or "lat,lon" that produced this result. */
  query: string;
  /** Full address as resolved by the provider. */
  resolvedName: string;
  /** Leading component, e.g. "London". */
  name: string;
  /** Remaining components, e.g. "England, United Kingdom". */
  region: string;
  latitude: number;
  longitude: number;
  /** IANA timezone of the location, e.g. "Europe/London". */
  timezone: string;
}

export interface HourPoint {
  /** Unix seconds. Always render through the location timezone. */
  epoch: number;
  temperature: number;
  feelsLike: number;
  /** 0–100 */
  precipProbability: number;
  /** mm */
  precipitation: number;
  windSpeed: number;
  /** Degrees clockwise from north. */
  windDirection: number;
  /** 0–100 */
  humidity: number;
  uvIndex: number;
  /** 0–100 */
  cloudCover: number;
  condition: ConditionCategory;
  conditionLabel: string;
  isDaylight: boolean;
}

export interface CurrentConditions {
  epoch: number;
  temperature: number;
  feelsLike: number;
  condition: ConditionCategory;
  conditionLabel: string;
  isDaylight: boolean;
  windSpeed: number;
  windDirection: number;
  precipProbability: number;
  humidity: number;
  uvIndex: number;
  /** km */
  visibility: number;
  /** hPa */
  pressure: number;
  cloudCover: number;
  dewPoint: number;
}

export interface DayForecast {
  epoch: number;
  /** ISO date in the location timezone, e.g. "2026-03-14". */
  date: string;
  tempMax: number;
  tempMin: number;
  condition: ConditionCategory;
  conditionLabel: string;
  precipProbability: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  uvIndex: number;
  sunriseEpoch: number;
  sunsetEpoch: number;
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentConditions;
  /** Contiguous hourly series spanning roughly 24h before to 7 days ahead. */
  hours: HourPoint[];
  /** Today first, then the next six days. */
  days: DayForecast[];
  /** Epoch millis the payload was retrieved. */
  fetchedAt: number;
}
