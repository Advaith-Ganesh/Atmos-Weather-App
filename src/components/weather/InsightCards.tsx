import {
  CloudFog,
  CloudSnow,
  Shirt,
  Sun,
  Umbrella,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { hourWindow } from '../../lib/series';
import { clothingAdvice, outdoorAssessment, type AdviceIcon, type OutdoorRating } from '../../lib/insights';
import type { WeatherData } from '../../types/weather';
import { Panel } from '../ui/Panel';

const ADVICE_ICONS: Record<AdviceIcon, LucideIcon> = {
  coat: Shirt,
  jacket: Shirt,
  shirt: Shirt,
  umbrella: Umbrella,
  sun: Sun,
  wind: Wind,
  snow: CloudSnow,
  fog: CloudFog,
};

const RATING_STYLES: Record<OutdoorRating, { dot: string; text: string }> = {
  Excellent: { dot: 'bg-emerald-400', text: 'text-emerald-300' },
  Good: { dot: 'bg-teal-300', text: 'text-teal-200' },
  Mixed: { dot: 'bg-amber-300', text: 'text-amber-200' },
  Poor: { dot: 'bg-rose-400', text: 'text-rose-300' },
};

export function ClothingCard({ data }: { data: WeatherData }) {
  const advice = useMemo(() => clothingAdvice(data.current, hourWindow(data, 0, 6).future), [data]);

  return (
    <Panel title="What should I wear?">
      <p className="text-base font-medium text-mist-100">{advice.headline}</p>
      <ul className="mt-4 space-y-2.5">
        {advice.tips.map((tip) => {
          const Icon = ADVICE_ICONS[tip.icon];
          return (
            <li key={tip.id} className="flex items-start gap-2.5 text-sm text-mist-300">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-mist-400" strokeWidth={1.6} aria-hidden />
              {tip.text}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function OutdoorCard({ data }: { data: WeatherData }) {
  const assessment = useMemo(() => outdoorAssessment(data.current, hourWindow(data, 0, 6).future), [data]);
  const style = RATING_STYLES[assessment.rating];

  return (
    <Panel title="Outdoor conditions">
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
        <p className={`text-base font-medium ${style.text}`}>{assessment.rating}</p>
        <p className="tabular ml-auto text-xs text-mist-400">{assessment.score}/100</p>
      </div>

      <p className="mt-2.5 text-sm text-mist-300">{assessment.summary}</p>

      <dl className="mt-4 space-y-2">
        {assessment.factors.map((factor) => (
          <div key={factor.label} className="flex items-center gap-3 text-xs">
            <dt className="w-20 shrink-0 text-mist-400">{factor.label}</dt>
            <dd className="flex flex-1 items-center gap-2.5">
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <span
                  className="block h-1 rounded-full bg-mist-300/60"
                  style={{ width: `${Math.round(100 - Math.min(100, factor.penalty * 2))}%` }}
                />
              </span>
              <span className="w-28 shrink-0 text-right text-mist-300">{factor.detail}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
