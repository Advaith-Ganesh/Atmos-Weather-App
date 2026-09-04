import { AlertTriangle, KeyRound, RefreshCw, SearchX, WifiOff } from 'lucide-react';
import type { WeatherError, WeatherErrorCode } from '../../api/errors';

const ICONS: Partial<Record<WeatherErrorCode, typeof AlertTriangle>> = {
  MISSING_API_KEY: KeyRound,
  INVALID_API_KEY: KeyRound,
  LOCATION_NOT_FOUND: SearchX,
  NETWORK: WifiOff,
};

/** Only shown for the two key-related failures, which are a setup problem. */
const SETUP_STEPS = ['cp .env.example .env', 'Add your key to VITE_VISUAL_CROSSING_API_KEY', 'Restart the dev server'];

interface ErrorStateProps {
  error: WeatherError;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const Icon = ICONS[error.code] ?? AlertTriangle;
  const isSetupIssue = error.code === 'MISSING_API_KEY' || error.code === 'INVALID_API_KEY';

  return (
    <section className="panel flex flex-col items-center px-6 py-14 text-center" role="alert">
      <Icon className="h-7 w-7 text-mist-400" strokeWidth={1.4} aria-hidden />
      <p className="mt-4 max-w-md text-sm text-mist-200">{error.message}</p>

      {isSetupIssue && (
        <ol className="mt-5 space-y-1.5 text-left text-xs text-mist-400">
          {SETUP_STEPS.map((step, index) => (
            <li key={step} className="flex gap-2">
              <span className="tabular text-mist-400/60">{index + 1}.</span>
              <code className="font-mono">{step}</code>
            </li>
          ))}
        </ol>
      )}

      {onRetry && !isSetupIssue && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-mist-200 transition-colors hover:border-white/20 hover:text-mist-100"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          Try again
        </button>
      )}
    </section>
  );
}
