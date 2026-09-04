import type { CurrentConditions, HourPoint } from '../types/weather';

/**
 * Deterministic rules over the actual forecast — no model, no API call. Keeping
 * them here (rather than inside components) is what makes them testable.
 */

export type AdviceIcon = 'coat' | 'jacket' | 'shirt' | 'umbrella' | 'sun' | 'wind' | 'snow' | 'fog';

export interface ClothingAdvice {
  headline: string;
  tips: Array<{ id: string; icon: AdviceIcon; text: string }>;
}

/** Six hours is long enough to cover a commute plus an errand either side. */
const LOOKAHEAD_HOURS = 6;

export function clothingAdvice(current: CurrentConditions, upcoming: HourPoint[]): ClothingAdvice {
  const window = upcoming.slice(0, LOOKAHEAD_HOURS);
  const feelsLike = Math.min(current.feelsLike, ...window.map((hour) => hour.feelsLike));
  const rainChance = Math.max(current.precipProbability, ...window.map((hour) => hour.precipProbability), 0);
  const wind = Math.max(current.windSpeed, ...window.map((hour) => hour.windSpeed), 0);
  const uv = Math.max(current.uvIndex, ...window.map((hour) => hour.uvIndex), 0);
  const snowing = [current.condition, ...window.map((hour) => hour.condition)].includes('SNOW');

  const tips: ClothingAdvice['tips'] = [];

  if (feelsLike <= 0) {
    tips.push({ id: 'freezing', icon: 'coat', text: 'Below freezing — hat, gloves and a proper coat' });
  } else if (feelsLike <= 8) {
    tips.push({ id: 'cold', icon: 'coat', text: 'Cold out — a warm coat is worth it' });
  } else if (feelsLike <= 15) {
    tips.push({ id: 'mild', icon: 'jacket', text: 'A light jacket or jumper should be enough' });
  } else if (feelsLike >= 27) {
    tips.push({ id: 'hot', icon: 'shirt', text: 'Hot — light clothing and plenty of water' });
  } else {
    tips.push({ id: 'comfortable', icon: 'shirt', text: 'Comfortable — no extra layers needed' });
  }

  if (rainChance >= 60) {
    tips.push({ id: 'umbrella', icon: 'umbrella', text: `Rain likely (${Math.round(rainChance)}%) — take an umbrella` });
  } else if (rainChance >= 30) {
    tips.push({ id: 'showers', icon: 'umbrella', text: `Showers possible (${Math.round(rainChance)}%) — pack a hood` });
  }

  if (snowing) tips.push({ id: 'snow', icon: 'snow', text: 'Snow around — wear shoes with grip' });
  if (uv >= 6) tips.push({ id: 'uv', icon: 'sun', text: `UV index ${Math.round(uv)} — sunscreen recommended` });
  if (wind >= 40) tips.push({ id: 'gale', icon: 'wind', text: 'Strong winds — expect it to feel colder' });
  else if (wind >= 25) tips.push({ id: 'breezy', icon: 'wind', text: 'Breezy — a windproof layer helps' });
  if (current.visibility < 1) tips.push({ id: 'fog', icon: 'fog', text: 'Poor visibility — take care on the roads' });

  // Mirrors the tip thresholds above so the headline never contradicts the list.
  const headline =
    feelsLike <= 8
      ? 'Dress warm'
      : rainChance >= 60
        ? 'Take a coat and an umbrella'
        : feelsLike >= 27
          ? 'Keep it light'
          : rainChance >= 30
            ? 'Take something rainproof'
            : feelsLike <= 15
              ? 'A jacket should do'
              : 'Nothing special needed';

  return { headline, tips: tips.slice(0, 4) };
}

export type OutdoorRating = 'Excellent' | 'Good' | 'Mixed' | 'Poor';

export interface OutdoorAssessment {
  rating: OutdoorRating;
  score: number;
  summary: string;
  factors: Array<{ label: string; detail: string; penalty: number }>;
}

/** Comfortable range for being outside without planning around the weather. */
const IDEAL_MIN_C = 12;
const IDEAL_MAX_C = 26;

const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));

export function outdoorAssessment(current: CurrentConditions, upcoming: HourPoint[]): OutdoorAssessment {
  const window = upcoming.slice(0, LOOKAHEAD_HOURS);
  const rain = Math.max(current.precipProbability, ...window.map((hour) => hour.precipProbability), 0);
  const wind = Math.max(current.windSpeed, ...window.map((hour) => hour.windSpeed), 0);
  const uv = Math.max(current.uvIndex, ...window.map((hour) => hour.uvIndex), 0);
  const feelsLike = current.feelsLike;

  const tempDelta =
    feelsLike < IDEAL_MIN_C ? IDEAL_MIN_C - feelsLike : feelsLike > IDEAL_MAX_C ? feelsLike - IDEAL_MAX_C : 0;

  const factors = [
    {
      label: 'Rain',
      detail: rain >= 60 ? `${Math.round(rain)}% chance` : rain >= 30 ? `${Math.round(rain)}% chance` : 'Low chance',
      // Anything under 10% is inside the forecast's own noise, so it costs nothing.
      penalty: clamp((rain - 10) * 0.6, 50),
    },
    {
      label: 'Temperature',
      detail:
        tempDelta === 0
          ? 'Comfortable'
          : feelsLike < IDEAL_MIN_C
            ? `Feels cold (${Math.round(feelsLike)}°C)`
            : `Feels hot (${Math.round(feelsLike)}°C)`,
      penalty: clamp(tempDelta * 2.5, 35),
    },
    {
      label: 'Wind',
      detail: wind >= 40 ? 'Strong' : wind >= 25 ? 'Breezy' : 'Light',
      penalty: clamp((wind - 15) * 1.2, 25),
    },
    {
      label: 'UV',
      detail: uv >= 8 ? 'Very high' : uv >= 6 ? 'High' : 'Moderate or low',
      penalty: clamp((uv - 6) * 4, 20),
    },
  ];

  const score = Math.round(clamp(100 - factors.reduce((total, factor) => total + factor.penalty, 0), 100));
  const rating: OutdoorRating = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 35 ? 'Mixed' : 'Poor';

  const phrases = [
    tempDelta === 0
      ? 'comfortable temperatures'
      : feelsLike < IDEAL_MIN_C
        ? 'cold air'
        : 'high temperatures',
    rain >= 60 ? 'a high chance of rain' : rain >= 30 ? 'some chance of rain' : 'little chance of rain',
    wind >= 40 ? 'strong winds' : wind >= 25 ? 'a noticeable breeze' : 'light winds',
  ];

  const summary = `${rating} conditions — ${phrases.slice(0, -1).join(', ')} and ${phrases.at(-1)}.`;

  return { rating, score, summary, factors };
}
