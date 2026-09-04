import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useUnits } from '../../context/unitsContext';
import { hourWindow } from '../../lib/series';
import { formatHour } from '../../lib/time';
import { convertSpeed, convertTemperature, speedSuffix, temperatureSuffix } from '../../lib/units';
import type { WeatherData } from '../../types/weather';
import { Panel } from '../ui/Panel';
import { SegmentedControl } from '../ui/SegmentedControl';

type Metric = 'temperature' | 'precipitation' | 'wind' | 'humidity';

const METRIC_OPTIONS = [
  { value: 'temperature', label: 'Temp' },
  { value: 'precipitation', label: 'Rain' },
  { value: 'wind', label: 'Wind' },
  { value: 'humidity', label: 'Humidity' },
] as const;

const METRIC_COLOURS: Record<Metric, string> = {
  temperature: '#5b9dff',
  precipitation: '#64d2ff',
  wind: '#7ee0c8',
  humidity: '#a88cff',
};

interface ChartPoint {
  epoch: number;
  time: string;
  value: number;
  condition: string;
  isPast: boolean;
}

export function WeatherChart({ data }: { data: WeatherData }) {
  const units = useUnits();
  const [metric, setMetric] = useState<Metric>('temperature');

  const { points, nowEpoch, unitLabel } = useMemo(() => {
    const { past, future } = hourWindow(data);
    const series = [...past, ...future];

    const suffix =
      metric === 'temperature'
        ? temperatureSuffix(units.temperature)
        : metric === 'wind'
          ? ` ${speedSuffix(units.speed)}`
          : '%';

    const value = (hour: (typeof series)[number]) => {
      switch (metric) {
        case 'temperature':
          return Math.round(convertTemperature(hour.temperature, units.temperature) * 10) / 10;
        case 'wind':
          return Math.round(convertSpeed(hour.windSpeed, units.speed));
        case 'precipitation':
          return Math.round(hour.precipProbability);
        case 'humidity':
          return Math.round(hour.humidity);
      }
    };

    return {
      points: series.map<ChartPoint>((hour, index) => ({
        epoch: hour.epoch,
        time: formatHour(hour.epoch, data.location.timezone),
        value: value(hour),
        condition: hour.conditionLabel,
        isPast: index < past.length,
      })),
      nowEpoch: past.at(-1)?.epoch ?? series[0]?.epoch ?? 0,
      unitLabel: suffix,
    };
  }, [data, metric, units.temperature, units.speed]);

  const colour = METRIC_COLOURS[metric];
  const bounded = metric === 'precipitation' || metric === 'humidity';

  return (
    <Panel
      title="48-hour trend"
      action={
        <SegmentedControl
          options={METRIC_OPTIONS}
          value={metric}
          onChange={(next) => setMetric(next as Metric)}
          label="Chart metric"
          size="sm"
        />
      }
    >
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colour} stopOpacity={0.35} />
                <stop offset="100%" stopColor={colour} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="time"
              interval={5}
              tick={{ fill: '#6f7a8f', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={12}
            />
            <YAxis
              domain={bounded ? [0, 100] : ['auto', 'auto']}
              width={44}
              tick={{ fill: '#6f7a8f', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${value}${bounded ? '%' : ''}`}
            />
            <ReferenceLine
              x={points.find((point) => point.epoch === nowEpoch)?.time}
              stroke="rgba(255,255,255,0.35)"
              strokeDasharray="3 3"
              label={{ value: 'now', position: 'insideTopRight', fill: '#9aa4b8', fontSize: 10 }}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
              content={<ChartTooltip unitLabel={unitLabel} />}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colour}
              strokeWidth={2}
              fill={`url(#fill-${metric})`}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

interface ChartTooltipProps {
  unitLabel: string;
  /** Injected by Recharts when it clones the element. */
  active?: boolean;
  payload?: ReadonlyArray<{ payload: ChartPoint }>;
}

function ChartTooltip({ active, payload, unitLabel }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/10 bg-ink-800/95 px-3 py-2 text-xs shadow-lg">
      <p className="tabular text-mist-300">
        {point.time}
        {point.isPast && <span className="ml-1.5 text-mist-400">observed</span>}
      </p>
      <p className="tabular mt-0.5 text-sm font-medium text-mist-100">
        {point.value}
        {unitLabel}
      </p>
      <p className="mt-0.5 text-mist-400">{point.condition}</p>
    </div>
  );
}
