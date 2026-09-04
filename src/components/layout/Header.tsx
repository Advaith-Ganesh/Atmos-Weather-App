import { LocateFixed, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useUnits } from '../../context/unitsContext';
import { SearchBar } from '../search/SearchBar';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Logo } from './Logo';

interface HeaderProps {
  onSearch: (query: string) => void;
  onUseCurrentLocation: () => void;
  onRefresh: () => void;
  currentLocation?: string;
  isLocating: boolean;
  isRefreshing: boolean;
  canRefresh: boolean;
}

const TEMPERATURE_OPTIONS = [
  { value: 'C', label: '°C', ariaLabel: 'Celsius' },
  { value: 'F', label: '°F', ariaLabel: 'Fahrenheit' },
] as const;

const SPEED_OPTIONS = [
  { value: 'kmh', label: 'km/h', ariaLabel: 'Kilometres per hour' },
  { value: 'mph', label: 'mph', ariaLabel: 'Miles per hour' },
] as const;

export function Header({
  onSearch,
  onUseCurrentLocation,
  onRefresh,
  currentLocation,
  isLocating,
  isRefreshing,
  canRefresh,
}: HeaderProps) {
  const units = useUnits();

  // Rendered twice so the controls can sit next to the wordmark on mobile and
  // at the far right on desktop; only one is ever displayed.
  const actions = (
    <>
      <IconButton
        label="Use my current location"
        onClick={onUseCurrentLocation}
        busy={isLocating}
        icon={<LocateFixed className="h-4 w-4" strokeWidth={1.75} aria-hidden />}
      />
      <IconButton
        label="Refresh weather data"
        onClick={onRefresh}
        busy={isRefreshing}
        disabled={!canRefresh}
        icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={1.75} aria-hidden />}
      />
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-white/6 bg-ink-900/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-5 lg:py-3.5">
        <div className="flex items-center justify-between gap-3 lg:justify-start">
          <a href="/" className="rounded" aria-label="Atmos — reload the app">
            <Logo />
          </a>

          <div className="flex items-center gap-1.5 lg:hidden">{actions}</div>
        </div>

        <div className="lg:mx-auto lg:w-full lg:max-w-md">
          <SearchBar onSearch={onSearch} currentLocation={currentLocation} />
        </div>

        <div className="flex items-center justify-between gap-2 lg:justify-end">
          <div className="flex items-center gap-1.5">
            <SegmentedControl
              options={TEMPERATURE_OPTIONS}
              value={units.temperature}
              onChange={units.setTemperature}
              label="Temperature unit"
              size="sm"
            />
            <SegmentedControl
              options={SPEED_OPTIONS}
              value={units.speed}
              onChange={units.setSpeed}
              label="Wind speed unit"
              size="sm"
            />
          </div>

          <div className="hidden items-center gap-1.5 lg:flex">{actions}</div>
        </div>
      </div>
    </header>
  );
}

interface IconButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
}

function IconButton({ label, icon, onClick, busy, disabled }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={label}
      title={label}
      className="rounded-lg border border-white/8 bg-white/[0.03] p-2 text-mist-300 transition-colors hover:border-white/16 hover:text-mist-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
    </button>
  );
}
