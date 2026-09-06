import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { WeatherBackdrop } from './components/atmosphere/WeatherBackdrop';
import { Header } from './components/layout/Header';
import { LocationBar } from './components/search/LocationBar';
import { CurrentWeather } from './components/weather/CurrentWeather';
import { DailyForecast } from './components/weather/DailyForecast';
import { DaylightCard } from './components/weather/DaylightCard';
import { HourlyTimeline } from './components/weather/HourlyTimeline';
import { ClothingCard, OutdoorCard } from './components/weather/InsightCards';
import { PrecipitationCard } from './components/weather/PrecipitationCard';
import { WeatherDetails } from './components/weather/WeatherDetails';
import { DashboardSkeleton } from './components/ui/DashboardSkeleton';
import { ErrorState } from './components/ui/ErrorState';
import { useGeolocation } from './hooks/useGeolocation';
import { useLocationQuery } from './hooks/useLocationQuery';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useRecentSearches } from './hooks/useRecentSearches';
import { useSavedLocations } from './hooks/useSavedLocations';
import { useWeather } from './hooks/useWeather';
import { isSaved as isLocationSaved, locationId } from './lib/locations';
import { formatTemperature } from './lib/units';
import { useUnits } from './context/unitsContext';
import { isCoordinateQuery } from './lib/validation';
import { Skeleton } from './components/ui/Skeleton';

// Recharts is by far the heaviest dependency and nothing above the fold needs
// it, so the chart loads in its own chunk.
const WeatherChart = lazy(() =>
  import('./components/weather/WeatherChart').then((module) => ({ default: module.WeatherChart })),
);

/** Used when geolocation is denied or unavailable so the app is never empty. */
const FALLBACK_LOCATION = 'London';

export default function App() {
  const { query, rejectedLink, setQuery } = useLocationQuery();
  const { data, error, status, isLoading, isRefreshing, refresh } = useWeather(query);
  const { locate, status: geoStatus } = useGeolocation();
  const { saved, add, remove, move } = useSavedLocations();
  const { recent, record } = useRecentSearches();
  const units = useUnits();
  const online = useOnlineStatus();

  const bootstrapped = useRef(false);
  // Captured once, at mount. Replacing the URL with the fallback clears
  // `rejectedLink`, so the notice below has to remember how this visit started
  // rather than re-deriving it from state that no longer says so.
  const [startedFromRejectedLink] = useState(rejectedLink);

  // First visit with no `?q=`: try the browser's location once, then fall back.
  // A link whose `q` we rejected skips geolocation — the user already asked for
  // a specific place, so a permission prompt would only delay the fallback.
  useEffect(() => {
    if (bootstrapped.current || query) return;
    bootstrapped.current = true;

    if (rejectedLink) {
      setQuery(FALLBACK_LOCATION, { replace: true });
      return;
    }
    void locate().then((coordinates) => setQuery(coordinates ?? FALLBACK_LOCATION, { replace: true }));
  }, [query, rejectedLink, locate, setQuery]);

  // Recent searches store something a human can read back — the resolved city
  // name for a geolocation pin, otherwise exactly what was typed.
  useEffect(() => {
    if (!data || !query) return;
    record(isCoordinateQuery(query) ? data.location.name : query);
  }, [data, query, record]);

  // Coming back online is the one signal that a failed request is now worth
  // repeating, so the user does not have to notice and press retry themselves.
  const failedWhileOffline = status === 'error' && (error?.code === 'OFFLINE' || error?.code === 'NETWORK');
  useEffect(() => {
    if (online && failedWhileOffline) refresh();
  }, [online, failedWhileOffline, refresh]);

  useEffect(() => {
    document.title = data
      ? `${formatTemperature(data.current.temperature, units.temperature, true)} ${data.location.name} — Atmos`
      : 'Atmos — Weather';
  }, [data, units.temperature]);

  const search = useCallback((next: string) => setQuery(next), [setQuery]);

  const useCurrentLocation = useCallback(async () => {
    const coordinates = await locate();
    if (coordinates) setQuery(coordinates);
  }, [locate, setQuery]);

  const showingFallback = query === FALLBACK_LOCATION;
  const notice = startedFromRejectedLink && showingFallback
    ? `That link didn't contain a location we could use, so we are showing ${FALLBACK_LOCATION}.`
    : geoStatus === 'denied' && showingFallback
      ? `Location access was denied, so we are showing ${FALLBACK_LOCATION}. Search for anywhere else above.`
      : null;

  const toggleSaved = useCallback(() => {
    if (!data || !query) return;
    const id = locationId(query);
    if (isLocationSaved(saved, id)) remove(id);
    else add({ id, label: data.location.name, query });
  }, [data, query, saved, add, remove]);

  return (
    <>
      <WeatherBackdrop
        condition={data?.current.condition ?? 'CLOUDY'}
        isDaylight={data?.current.isDaylight ?? true}
      />

      <a
        href="#weather"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink-700 focus:px-4 focus:py-2 focus:text-sm"
      >
        Skip to weather
      </a>

      <Header
        onSearch={search}
        onUseCurrentLocation={useCurrentLocation}
        onRefresh={refresh}
        currentLocation={data?.location.name}
        isLocating={geoStatus === 'locating'}
        isRefreshing={isRefreshing}
        canRefresh={Boolean(data)}
      />

      <main id="weather" className="mx-auto max-w-6xl space-y-4 px-4 pb-16 pt-4">
        <LocationBar
          saved={saved}
          recent={recent}
          activeQuery={query}
          onSelect={search}
          onRemoveSaved={remove}
          onMoveSaved={move}
        />

        {notice && (
          <p className="text-xs text-mist-400" role="status">
            {notice}
          </p>
        )}

        {isLoading && <DashboardSkeleton />}

        {status === 'error' && error && <ErrorState error={error} onRetry={refresh} />}

        {data && (
          <div className={`space-y-4 transition-opacity ${isRefreshing ? 'opacity-60' : ''}`}>
            <CurrentWeather
              data={data}
              isSaved={query ? isLocationSaved(saved, query) : false}
              onToggleSaved={toggleSaved}
            />

            <HourlyTimeline data={data} />

            {/* Two stacked columns rather than full-width rows: pairing a tall
                card with a short one leaves large gaps once the grid stretches
                them to equal height. */}
            <div className="grid items-start gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <Suspense fallback={<ChartFallback />}>
                  <WeatherChart data={data} />
                </Suspense>
                <WeatherDetails data={data} />
              </div>
              <div className="space-y-4">
                <DaylightCard data={data} />
                <PrecipitationCard data={data} />
              </div>
            </div>

            <div className="grid items-start gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DailyForecast data={data} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <ClothingCard data={data} />
                <OutdoorCard data={data} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-mist-400">
        <p>
          Weather data from{' '}
          <a
            href="https://www.visualcrossing.com/"
            target="_blank"
            rel="noreferrer"
            className="text-mist-300 underline underline-offset-2 transition-colors hover:text-mist-100"
          >
            Visual Crossing
          </a>
          . All times shown are local to the selected location.
        </p>
      </footer>
    </>
  );
}

function ChartFallback() {
  return (
    <section className="panel p-4 sm:p-5" aria-busy="true">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-56 w-full" />
    </section>
  );
}
