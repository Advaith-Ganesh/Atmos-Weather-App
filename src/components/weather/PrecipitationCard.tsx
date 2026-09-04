import { useUnits } from '../../context/unitsContext';
import { hourWindow } from '../../lib/series';
import { formatHour } from '../../lib/time';
import { formatPrecipitation } from '../../lib/units';
import type { WeatherData } from '../../types/weather';
import { Panel } from '../ui/Panel';

const HOURS_AHEAD = 12;
/** Below this the provider's own probability is noise, not a forecast. */
const NOTABLE_PROBABILITY = 15;

export function PrecipitationCard({ data }: { data: WeatherData }) {
  const units = useUnits();
  const hours = hourWindow(data, 0, HOURS_AHEAD).future;
  const peak = hours.reduce((best, hour) => (hour.precipProbability > best.precipProbability ? hour : best), hours[0]);
  const total = hours.reduce((sum, hour) => sum + hour.precipitation, 0);

  const summary =
    !peak || peak.precipProbability < NOTABLE_PROBABILITY
      ? `Nothing expected in the next ${HOURS_AHEAD} hours.`
      : `Most likely around ${formatHour(peak.epoch, data.location.timezone)} at ${Math.round(
          peak.precipProbability,
        )}%${total >= 0.1 ? `, about ${formatPrecipitation(total, units.speed)} in total` : ''}.`;

  return (
    <Panel title={`Precipitation · next ${HOURS_AHEAD}h`}>
      <p className="mb-4 text-sm text-mist-300">{summary}</p>

      <ol className="space-y-1.5">
        {hours.map((hour) => {
          const probability = Math.round(hour.precipProbability);
          return (
            <li key={hour.epoch} className="flex items-center gap-3">
              <span className="tabular w-10 shrink-0 text-[11px] text-mist-400">
                {formatHour(hour.epoch, data.location.timezone)}
              </span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]"
                role="meter"
                aria-valuenow={probability}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Chance of precipitation at ${formatHour(hour.epoch, data.location.timezone)}`}
              >
                <div
                  className="h-full rounded-full bg-cool transition-[width] duration-500"
                  style={{ width: `${Math.max(probability, 1)}%`, opacity: probability < 10 ? 0.3 : 1 }}
                />
              </div>
              <span className="tabular w-9 shrink-0 text-right text-[11px] text-mist-300">{probability}%</span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
