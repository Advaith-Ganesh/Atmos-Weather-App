import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import type { ConditionCategory } from '../../types/weather';

const DAY_ICONS: Record<ConditionCategory, LucideIcon> = {
  CLEAR: Sun,
  PARTLY_CLOUDY: CloudSun,
  CLOUDY: Cloud,
  FOG: CloudFog,
  RAIN: CloudRain,
  HEAVY_RAIN: CloudRainWind,
  SNOW: CloudSnow,
  THUNDERSTORM: CloudLightning,
  WIND: Wind,
};

const NIGHT_OVERRIDES: Partial<Record<ConditionCategory, LucideIcon>> = {
  CLEAR: Moon,
  PARTLY_CLOUDY: CloudMoon,
};

interface WeatherIconProps {
  condition: ConditionCategory;
  isDaylight?: boolean;
  className?: string;
  strokeWidth?: number;
}

export function WeatherIcon({ condition, isDaylight = true, className, strokeWidth = 1.5 }: WeatherIconProps) {
  const Icon = (!isDaylight && NIGHT_OVERRIDES[condition]) || DAY_ICONS[condition];
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden focusable="false" />;
}
