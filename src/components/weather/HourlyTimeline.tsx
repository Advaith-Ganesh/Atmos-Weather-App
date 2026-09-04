import { useEffect, useRef } from 'react';
import { useUnits } from '../../context/unitsContext';
import { hourWindow } from '../../lib/series';
import { formatHour } from '../../lib/time';
import { formatTemperature } from '../../lib/units';
import type { HourPoint, WeatherData } from '../../types/weather';
import { Panel } from '../ui/Panel';
import { WeatherIcon } from '../ui/WeatherIcon';

export function HourlyTimeline({ data }: { data: WeatherData }) {
  const units = useUnits();
  const { past, future } = hourWindow(data);
  const nowRef = useRef<HTMLLIElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Open on "now" rather than 24 hours ago — history is there if you scroll back.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const marker = nowRef.current;
    if (!scroller || !marker) return;
    scroller.scrollLeft = Math.max(0, marker.offsetLeft - 24);
  }, [data.location.query, data.current.epoch]);

  return (
    <Panel title="Previous and next 24 hours">
      <div ref={scrollerRef} className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-2">
        <ol className="flex items-stretch gap-0.5" aria-label="Hourly weather from 24 hours ago to 24 hours ahead">
          {past.map((hour) => (
            <HourColumn key={hour.epoch} hour={hour} timezone={data.location.timezone} unit={units.temperature} past />
          ))}
          <li ref={nowRef} className="flex shrink-0 flex-col items-center px-2" aria-hidden>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent">Now</span>
            <span className="mt-1.5 w-px flex-1 bg-linear-to-b from-accent/70 to-transparent" />
          </li>
          {future.map((hour) => (
            <HourColumn key={hour.epoch} hour={hour} timezone={data.location.timezone} unit={units.temperature} />
          ))}
        </ol>
      </div>
    </Panel>
  );
}

interface HourColumnProps {
  hour: HourPoint;
  timezone: string;
  unit: 'C' | 'F';
  past?: boolean;
}

function HourColumn({ hour, timezone, unit, past = false }: HourColumnProps) {
  const time = formatHour(hour.epoch, timezone);
  return (
    // `relative` matters: the screen-reader summary below is absolutely
    // positioned, and without a positioned ancestor inside the scroll container
    // it escapes the container's clipping and widens the whole page.
    <li
      className={`relative flex w-14 shrink-0 flex-col items-center gap-2 rounded-lg py-2 transition-colors hover:bg-white/[0.04] ${
        past ? 'opacity-45' : ''
      }`}
    >
      <span className="tabular text-[11px] text-mist-400">{time}</span>
      <WeatherIcon
        condition={hour.condition}
        isDaylight={hour.isDaylight}
        className="h-5 w-5 text-mist-200"
        strokeWidth={1.4}
      />
      <span className="tabular text-sm font-medium text-mist-100">{formatTemperature(hour.temperature, unit)}</span>
      <span className="tabular h-3.5 text-[10px] text-cool">
        {hour.precipProbability >= 10 ? `${Math.round(hour.precipProbability)}%` : ''}
      </span>
      <span className="sr-only">
        {time}: {hour.conditionLabel}, {formatTemperature(hour.temperature, unit, true)},{' '}
        {Math.round(hour.precipProbability)}% chance of precipitation
      </span>
    </li>
  );
}
