import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useUnits } from '../../context/unitsContext';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { formatDateShort, formatHour, relativeDayLabel } from '../../lib/time';
import { formatSpeed, formatTemperature, windDirectionLabel } from '../../lib/units';
import type { DayForecast as DayForecastModel, WeatherData } from '../../types/weather';
import { Panel } from '../ui/Panel';
import { WeatherIcon } from '../ui/WeatherIcon';

export function DailyForecast({ data }: { data: WeatherData }) {
  const units = useUnits();
  const reducedMotion = usePrefersReducedMotion();
  const [expanded, setExpanded] = useState<string | null>(null);

  const weekMin = Math.min(...data.days.map((day) => day.tempMin));
  const weekMax = Math.max(...data.days.map((day) => day.tempMax));
  const span = Math.max(1, weekMax - weekMin);

  return (
    <Panel title="7-day forecast">
      <ul className="divide-y divide-white/6">
        {data.days.map((day) => {
          const isOpen = expanded === day.date;
          const offset = ((day.tempMin - weekMin) / span) * 100;
          const width = ((day.tempMax - day.tempMin) / span) * 100;

          return (
            <li key={day.date}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : day.date)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
              >
                <span className="w-16 shrink-0 text-sm text-mist-200">
                  {relativeDayLabel(day.epoch, data.current.epoch, data.location.timezone)}
                </span>

                <WeatherIcon condition={day.condition} className="h-5 w-5 shrink-0 text-mist-300" strokeWidth={1.4} />

                <span className="tabular w-10 shrink-0 text-[11px] text-cool">
                  {day.precipProbability >= 10 ? `${Math.round(day.precipProbability)}%` : ''}
                </span>

                <span className="tabular hidden w-9 shrink-0 text-right text-sm text-mist-400 sm:block">
                  {formatTemperature(day.tempMin, units.temperature)}
                </span>

                <span className="hidden h-1 flex-1 rounded-full bg-white/[0.06] sm:block" aria-hidden>
                  <span
                    className="block h-1 rounded-full bg-linear-to-r from-cool/70 to-warm/80"
                    style={{ marginLeft: `${offset}%`, width: `${Math.max(width, 6)}%` }}
                  />
                </span>

                <span className="tabular ml-auto w-9 shrink-0 text-right text-sm font-medium text-mist-100 sm:ml-0">
                  {formatTemperature(day.tempMax, units.temperature)}
                </span>
                <span className="tabular w-9 shrink-0 text-right text-sm text-mist-400 sm:hidden">
                  {formatTemperature(day.tempMin, units.temperature)}
                </span>

                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-mist-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <DayDetail day={day} timezone={data.location.timezone} speedUnit={units.speed} />
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

interface DayDetailProps {
  day: DayForecastModel;
  timezone: string;
  speedUnit: 'kmh' | 'mph';
}

function DayDetail({ day, timezone, speedUnit }: DayDetailProps) {
  const items = [
    { label: 'Conditions', value: day.conditionLabel },
    { label: 'Wind', value: `${formatSpeed(day.windSpeed, speedUnit)} ${windDirectionLabel(day.windDirection)}` },
    { label: 'Humidity', value: `${Math.round(day.humidity)}%` },
    { label: 'UV index', value: `${Math.round(day.uvIndex)}` },
    { label: 'Sunrise', value: formatHour(day.sunriseEpoch, timezone) },
    { label: 'Sunset', value: formatHour(day.sunsetEpoch, timezone) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/6 px-1 pb-4 pt-3 sm:grid-cols-3">
      <div className="col-span-2 sm:col-span-3">
        <p className="text-[11px] uppercase tracking-[0.12em] text-mist-400">{formatDateShort(day.epoch, timezone)}</p>
      </div>
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] uppercase tracking-[0.12em] text-mist-400">{item.label}</dt>
          <dd className="tabular mt-0.5 text-sm text-mist-100">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
