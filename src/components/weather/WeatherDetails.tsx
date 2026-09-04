import { Cloud, Compass, Droplets, Eye, Gauge, Sun, Umbrella, Waves } from 'lucide-react';
import type { ReactNode } from 'react';
import { useUnits } from '../../context/unitsContext';
import { hourWindow } from '../../lib/series';
import { formatDistance, formatPrecipitation, formatSpeed, windDirectionLabel } from '../../lib/units';
import type { WeatherData } from '../../types/weather';
import { Panel } from '../ui/Panel';

const uvDescription = (uv: number) =>
  uv >= 11 ? 'Extreme' : uv >= 8 ? 'Very high' : uv >= 6 ? 'High' : uv >= 3 ? 'Moderate' : 'Low';

const pressureTrend = (hPa: number) => (hPa >= 1023 ? 'High' : hPa <= 1009 ? 'Low' : 'Normal');

const visibilityDescription = (km: number) => (km >= 10 ? 'Clear' : km >= 4 ? 'Moderate' : km >= 1 ? 'Poor' : 'Very poor');

export function WeatherDetails({ data }: { data: WeatherData }) {
  const units = useUnits();
  const { current } = data;
  const next24h = hourWindow(data, 0, 24).future;
  const expectedRain = next24h.reduce((sum, hour) => sum + hour.precipitation, 0);

  return (
    <Panel title="Conditions">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
        <Metric
          icon={<Droplets className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
          label="Humidity"
          value={`${Math.round(current.humidity)}%`}
          note={`Dew point ${Math.round(current.dewPoint)}°C`}
        />
        <Metric
          icon={<Sun className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
          label="UV index"
          value={`${Math.round(current.uvIndex)}`}
          note={uvDescription(current.uvIndex)}
        />
        <Metric
          icon={<Eye className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
          label="Visibility"
          value={formatDistance(current.visibility, units.speed)}
          note={visibilityDescription(current.visibility)}
        />
        <Metric
          icon={<Gauge className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
          label="Pressure"
          value={`${Math.round(current.pressure)} hPa`}
          note={pressureTrend(current.pressure)}
        />
        <Metric
          icon={<Cloud className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
          label="Cloud cover"
          value={`${Math.round(current.cloudCover)}%`}
        />
        <Metric
          icon={<Compass className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
          label="Wind"
          value={formatSpeed(current.windSpeed, units.speed)}
          note={`From the ${windDirectionLabel(current.windDirection)}`}
        />
        <Metric
          icon={<Umbrella className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
          label="Rain chance"
          value={`${Math.round(current.precipProbability)}%`}
          note="Right now"
        />
        <Metric
          icon={<Waves className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
          label="Rain total"
          value={formatPrecipitation(expectedRain, units.speed)}
          note="Next 24 hours"
        />
      </dl>
    </Panel>
  );
}

interface MetricProps {
  icon: ReactNode;
  label: string;
  value: string;
  note?: string;
}

function Metric({ icon, label, value, note }: MetricProps) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-mist-400">
        {icon}
        {label}
      </dt>
      <dd className="tabular mt-1.5 text-lg font-light text-mist-100">{value}</dd>
      {note && <p className="mt-0.5 text-[11px] text-mist-400">{note}</p>}
    </div>
  );
}
