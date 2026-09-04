export type WeatherErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'EMPTY_QUERY'
  | 'LOCATION_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'PROVIDER_UNAVAILABLE'
  | 'NO_DATA'
  | 'UNKNOWN';

const MESSAGES: Record<WeatherErrorCode, string> = {
  MISSING_API_KEY:
    'No API key configured. Copy .env.example to .env and add your Visual Crossing key, then restart the dev server.',
  INVALID_API_KEY: 'The Visual Crossing API key was rejected. Check that the key in your .env file is correct.',
  EMPTY_QUERY: 'Enter a city, postcode or country to search.',
  LOCATION_NOT_FOUND: "We couldn't find that location. Try a city name, or add a country — for example “Manchester, UK”.",
  RATE_LIMITED: 'Daily request limit reached for this API key. Try again later or upgrade your Visual Crossing plan.',
  NETWORK: "Couldn't reach the weather service. Check your connection and try again.",
  PROVIDER_UNAVAILABLE: 'The weather service is temporarily unavailable. Please try again in a moment.',
  NO_DATA: 'No weather data is available for that location right now.',
  UNKNOWN: 'Something went wrong while loading the weather. Please try again.',
};

/**
 * Wraps every failure path so the UI never has to inspect an HTTP status or
 * render a raw provider string (which can echo back the API key).
 */
export class WeatherError extends Error {
  readonly code: WeatherErrorCode;

  constructor(code: WeatherErrorCode) {
    super(MESSAGES[code]);
    this.name = 'WeatherError';
    this.code = code;
  }
}

export const isWeatherError = (error: unknown): error is WeatherError => error instanceof WeatherError;

export function toWeatherError(error: unknown): WeatherError {
  if (isWeatherError(error)) return error;
  if (error instanceof TypeError) return new WeatherError('NETWORK');
  return new WeatherError('UNKNOWN');
}
