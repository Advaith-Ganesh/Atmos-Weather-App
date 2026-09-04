import { ArrowUp, Droplets, MapPin, Star, Wind } from 'lucide-react';
import type { ReactNode } from 'react';
import { useUnits } from '../../context/unitsContext';
import { formatLocalClock, formatRelativeToNow } from '../../lib/time';
import { formatSpeed, formatTemperature, windDirectionLabel } from '../../lib/units';
import type { DayForecast, WeatherData } from '../../types/weather';
import { WeatherIcon } from '../ui/WeatherIcon';

interface CurrentWeatherProps {
  data: WeatherData;
  isSaved: boolean;
  onToggleSaved: () => void;
}

export function CurrentWeather({ data, isSaved, onToggleSaved }: CurrentWeatherProps) {
  const units = useUnits();
  const { current, location } = data;
  const today: DayForecast | undefined = data.days[0];

  return (
    <section className="panel p-5 sm:p-7" aria-label={`Current weather in ${location.name}`}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-mist-400" strokeWidth={1.75} aria-hidden />
            <h1 className="truncate text-lg font-semibold tracking-tight text-mist-100 sm:text-xl">{location.name}</h1>
            <button
              type="button"
              onClick={onToggleSaved}
              aria-pressed={isSaved}
              aria-label={isSaved ? `Remove ${location.name} from saved locations` : `Save ${location.name}`}
              className={`rounded p-1 transition-colors ${
                isSaved ? 'text-warm' : 'text-mist-400 hover:text-mist-200'
              }`}
            >
              <Star className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          {location.region && <p className="mt-0.5 truncate text-sm text-mist-400">{location.region}</p>}

          <p className="tabular mt-1 text-xs text-mist-400">
            <span>{formatLocalClock(current.epoch, location.timezone)} local</span>
            <span aria-hidden> · </span>
            <span>Updated {formatRelativeToNow(data.fetchedAt)}</span>
          </p>

          <div className="mt-6 flex items-end gap-5">
            <p className="tabular text-[68px] font-light leading-[0.85] tracking-[-0.04em] sm:text-[84px]">
              {formatTemperature(current.temperature, units.temperature)}
            </p>
            <div className="pb-1.5">
              <p className="text-base font-medium text-mist-100">{current.conditionLabel}</p>
              <p className="tabular text-sm text-mist-400">
                Feels like {formatTemperature(current.feelsLike, units.temperature, true)}
              </p>
              {today && (
                <p className="tabular mt-0.5 text-sm text-mist-400">
                  H {formatTemperature(today.tempMax, units.temperature)} · L{' '}
                  {formatTemperature(today.tempMin, units.temperature)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-6 sm:flex-col sm:items-end sm:gap-5">
          <WeatherIcon
            condition={current.condition}
            isDaylight={current.isDaylight}
            className="h-20 w-20 shrink-0 text-mist-200 sm:h-24 sm:w-24"
            strokeWidth={1.1}
          />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-1 sm:gap-y-2.5 sm:text-right">
            <HeroStat
              icon={<Wind className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
              label="Wind"
              value={formatSpeed(current.windSpeed, units.speed)}
              suffix={
                <span className="inline-flex items-center gap-0.5 text-mist-400">
                  <ArrowUp
                    className="h-3 w-3"
                    strokeWidth={2}
                    style={{ transform: `rotate(${current.windDirection + 180}deg)` }}
                    aria-hidden
                  />
                  {windDirectionLabel(current.windDirection)}
                </span>
              }
            />
            <HeroStat
              icon={<Droplets className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
              label="Rain"
              value={`${Math.round(current.precipProbability)}%`}
            />
          </dl>
        </div>
      </div>
    </section>
  );
}

interface HeroStatProps {
  icon: ReactNode;
  label: string;
  value: string;
  suffix?: ReactNode;
}

function HeroStat({ icon, label, value, suffix }: HeroStatProps) {
  return (
    <div className="sm:flex sm:items-center sm:justify-end sm:gap-2">
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-mist-400 sm:order-first">
        {icon}
        {label}
      </dt>
      <dd className="tabular mt-0.5 flex items-center gap-2 text-sm text-mist-100 sm:mt-0">
        {value}
        {suffix}
      </dd>
    </div>
  );
}
