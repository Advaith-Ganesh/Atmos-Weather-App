import { toConditionCategory, toConditionLabel } from '../lib/conditions';
import { isoDateInZone } from '../lib/time';
import type { CurrentConditions, DayForecast, HourPoint, WeatherData, WeatherLocation } from '../types/weather';
import { WeatherError } from './errors';
import type { VcDay, VcHour, VcResponse } from './visualCrossingTypes';

const FORECAST_DAYS = 7;

const num = (value: number | null | undefined, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const clampPercent = (value: number | null | undefined) => Math.min(100, Math.max(0, num(value)));

const COORDINATE_ADDRESS = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;

/**
 * `resolvedAddress` is the coordinate pair when the user searched by
 * geolocation, which is useless as a heading. The IANA timezone gives us a
 * recognisable city for those cases — imprecise for large zones, but far better
 * than showing "51.5072,-0.1276".
 */
export function parseLocationName(resolvedAddress: string, timezone: string): { name: string; region: string } {
  if (!COORDINATE_ADDRESS.test(resolvedAddress.trim())) {
    const [first, ...rest] = resolvedAddress.split(',').map((part) => part.trim());
    return { name: first || resolvedAddress, region: rest.join(', ') };
  }
  const segments = timezone.split('/');
  const city = segments.at(-1)?.replace(/_/g, ' ') ?? resolvedAddress;
  return { name: city, region: segments[0]?.replace(/_/g, ' ') ?? '' };
}

function toHourPoint(hour: VcHour, sunriseEpoch: number, sunsetEpoch: number): HourPoint {
  const precipitation = num(hour.precip);
  const condition = toConditionCategory(hour.icon ?? undefined, precipitation);
  return {
    epoch: hour.datetimeEpoch,
    temperature: num(hour.temp),
    feelsLike: num(hour.feelslike, num(hour.temp)),
    precipProbability: clampPercent(hour.precipprob),
    precipitation,
    windSpeed: num(hour.windspeed),
    windDirection: num(hour.winddir),
    humidity: clampPercent(hour.humidity),
    uvIndex: num(hour.uvindex),
    cloudCover: clampPercent(hour.cloudcover),
    condition,
    conditionLabel: toConditionLabel(condition, hour.conditions ?? undefined),
    isDaylight: hour.datetimeEpoch >= sunriseEpoch && hour.datetimeEpoch < sunsetEpoch,
  };
}

function toDayForecast(day: VcDay): DayForecast {
  const precipitation = num(day.precip);
  const condition = toConditionCategory(day.icon ?? undefined, precipitation / 6);
  return {
    epoch: day.datetimeEpoch,
    date: day.datetime,
    tempMax: num(day.tempmax, num(day.temp)),
    tempMin: num(day.tempmin, num(day.temp)),
    condition,
    conditionLabel: toConditionLabel(condition, day.conditions ?? undefined),
    precipProbability: clampPercent(day.precipprob),
    precipitation,
    windSpeed: num(day.windspeed),
    windDirection: num(day.winddir),
    humidity: clampPercent(day.humidity),
    uvIndex: num(day.uvindex),
    sunriseEpoch: num(day.sunriseEpoch),
    sunsetEpoch: num(day.sunsetEpoch),
  };
}

function toCurrent(source: VcHour, isDaylight: boolean): CurrentConditions {
  const condition = toConditionCategory(source.icon ?? undefined, num(source.precip));
  return {
    epoch: source.datetimeEpoch,
    temperature: num(source.temp),
    feelsLike: num(source.feelslike, num(source.temp)),
    condition,
    conditionLabel: toConditionLabel(condition, source.conditions ?? undefined),
    isDaylight,
    windSpeed: num(source.windspeed),
    windDirection: num(source.winddir),
    precipProbability: clampPercent(source.precipprob),
    humidity: clampPercent(source.humidity),
    uvIndex: num(source.uvindex),
    visibility: num(source.visibility, 10),
    pressure: num(source.pressure, 1013),
    cloudCover: clampPercent(source.cloudcover),
    dewPoint: num(source.dew),
  };
}

/** Nearest hour to `epoch` across the whole series — used when the provider omits currentConditions. */
function nearestHour(hours: VcHour[], epoch: number): VcHour | undefined {
  return hours.reduce<VcHour | undefined>((closest, hour) => {
    if (!closest) return hour;
    return Math.abs(hour.datetimeEpoch - epoch) < Math.abs(closest.datetimeEpoch - epoch) ? hour : closest;
  }, undefined);
}

export function transformTimeline(raw: VcResponse, query: string, nowMs = Date.now()): WeatherData {
  if (!raw?.days?.length || !raw.timezone) throw new WeatherError('NO_DATA');

  const timezone = raw.timezone;
  const rawHours = raw.days.flatMap((day) => day.hours ?? []).sort((a, b) => a.datetimeEpoch - b.datetimeEpoch);
  if (rawHours.length === 0) throw new WeatherError('NO_DATA');

  const currentSource = raw.currentConditions ?? nearestHour(rawHours, Math.floor(nowMs / 1000));
  if (!currentSource) throw new WeatherError('NO_DATA');
  const currentEpoch = num(currentSource.datetimeEpoch, Math.floor(nowMs / 1000));

  const allDays = raw.days.map(toDayForecast);
  const sunTimesFor = (epoch: number) => {
    const date = isoDateInZone(epoch, timezone);
    return allDays.find((day) => day.date === date) ?? allDays[0];
  };

  const hours = rawHours.map((hour) => {
    const day = sunTimesFor(hour.datetimeEpoch);
    return toHourPoint(hour, day.sunriseEpoch, day.sunsetEpoch);
  });

  const today = isoDateInZone(currentEpoch, timezone);
  const days = allDays.filter((day) => day.date >= today).slice(0, FORECAST_DAYS);
  if (days.length === 0) throw new WeatherError('NO_DATA');

  const currentDay = days[0];
  const isDaylight = currentEpoch >= currentDay.sunriseEpoch && currentEpoch < currentDay.sunsetEpoch;

  const { name, region } = parseLocationName(raw.resolvedAddress ?? raw.address ?? query, timezone);
  const location: WeatherLocation = {
    query,
    resolvedName: raw.resolvedAddress ?? query,
    name,
    region,
    latitude: raw.latitude,
    longitude: raw.longitude,
    timezone,
  };

  return {
    location,
    current: { ...toCurrent(currentSource, isDaylight), epoch: currentEpoch },
    hours,
    days,
    fetchedAt: nowMs,
  };
}
