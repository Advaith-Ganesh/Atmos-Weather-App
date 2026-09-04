import { Sunrise, Sunset } from 'lucide-react';
import { daylight, formatDuration, formatHour } from '../../lib/time';
import type { WeatherData } from '../../types/weather';
import { Panel } from '../ui/Panel';

export function DaylightCard({ data }: { data: WeatherData }) {
  const today = data.days[0];
  const { timezone } = data.location;
  const { progress, durationSeconds, isDaylight } = daylight(data.current.epoch, today.sunriseEpoch, today.sunsetEpoch);

  const percent = Math.round(progress * 100);
  const remaining = isDaylight ? today.sunsetEpoch - data.current.epoch : 0;

  return (
    <Panel title="Daylight">
      <div className="flex items-baseline justify-between gap-3">
        <p className="tabular text-2xl font-light tracking-tight">{formatDuration(durationSeconds)}</p>
        <p className="text-xs text-mist-400">
          {isDaylight ? `${formatDuration(remaining)} of light left` : 'After sunset'}
        </p>
      </div>

      <div className="relative mt-6 mb-2">
        {/* Track */}
        <div className="h-px w-full bg-white/12" />
        <div
          className="absolute inset-y-0 left-0 h-px bg-linear-to-r from-warm/30 to-warm"
          style={{ width: `${percent}%` }}
        />
        <span
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm shadow-[0_0_10px_2px_rgba(255,179,71,0.45)]"
          style={{ left: `${percent}%` }}
          role="img"
          aria-label={`Currently ${percent}% through the daylight hours`}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-mist-300">
          <Sunrise className="h-3.5 w-3.5 text-warm" strokeWidth={1.75} aria-hidden />
          <span className="sr-only">Sunrise </span>
          <span className="tabular">{formatHour(today.sunriseEpoch, timezone)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-mist-300">
          <span className="sr-only">Sunset </span>
          <span className="tabular">{formatHour(today.sunsetEpoch, timezone)}</span>
          <Sunset className="h-3.5 w-3.5 text-warm" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
    </Panel>
  );
}
