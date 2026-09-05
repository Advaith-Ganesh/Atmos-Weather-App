# Atmos Weather

A weather app that shows current conditions, the previous and next 24 hours, and a 7-day forecast
for anywhere you search — always in the local time of the place you looked up, not your own.

Built with React, TypeScript and the Visual Crossing Timeline API.

## Features

**The basics**

- Search by city, town, postcode, country, or a combination (`London`, `SW1A 1AA`, `Paris, France`)
- Current conditions: temperature, feels-like, condition, wind speed and direction, rain probability
- The previous 24 hours of observations and the next 24 hours of forecast in one scrollable timeline
- Manual refresh that bypasses the cache
- Browser geolocation on first load, falling back to London if permission is denied

**Beyond that**

- **7-day forecast** with a temperature-range bar per day; click a day for wind, humidity, UV and sun times
- **Interactive 48-hour chart** switching between temperature, rain probability, wind and humidity,
  with a marker on the current hour and tooltips in local time
- **Precipitation view** for the next 12 hours, so you can see at a glance when rain is most likely
- **Daylight track** showing sunrise, sunset, total daylight and where you currently are in the day
- **"What should I wear?"** and **"Outdoor conditions"** — deterministic rules over the forecast
  (see [`src/lib/insights.ts`](src/lib/insights.ts)); no model, no extra API call
- **Saved locations** and **recent searches**, kept in `localStorage`
- **Shareable URLs** — the selected place lives in `?q=`, so a link opens on the same location
- **°C/°F and km/h/mph**, converted properly and remembered between visits
- Condition-driven backdrop (rain, snow, storm, fog) that respects `prefers-reduced-motion`
- No third-party requests at runtime: no font CDN, no analytics, no trackers

## Screenshots

None committed yet. To add your own: run the app with a real key, take full-page captures of the
dashboard on desktop and mobile, drop them in `docs/screenshots/`, and link them here. Placeholder
images would be worse than none.

## Tech stack

| Tool | Why |
| --- | --- |
| React 19 + TypeScript | Component model and a fully typed domain layer |
| Vite | Dev server and build |
| Tailwind CSS v4 | Styling, with design tokens defined in `src/index.css` |
| Recharts | The 48-hour chart (lazy-loaded — it is the heaviest dependency) |
| Lucide React | Icon set |
| Vitest + Testing Library | Unit and component tests |
| oxlint | Linting |

## Architecture

```
UI components
     ↓
React hooks (useWeather, useUnits, useSavedLocations, …)
     ↓
weatherService  ──►  TTL cache + in-flight de-duplication
     ↓
visualCrossing.ts  ──►  Visual Crossing Timeline API
     ↓
transform.ts  ──►  normalised WeatherData
     ↓
UI components
```

Nothing above `src/api` knows that Visual Crossing exists. The provider's response is converted once,
in `src/api/transform.ts`, into the types in `src/types/weather.ts`, and every component reads those.
Swapping providers would mean rewriting two files.

More detail in [`docs/architecture.md`](docs/architecture.md).

## Getting started

```bash
git clone https://github.com/Advaith-Ganesh/Atmos-Weather-App.git
cd Atmos-Weather-App
npm install
cp .env.example .env      # then paste your API key into it
npm run dev
```

The dev server prints a local URL, usually http://localhost:5173.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with a coverage report |
| `npm run lint` | Lint (warnings fail, same as CI) |
| `npm run typecheck` | Type-check without building |

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_VISUAL_CROSSING_API_KEY` | Yes | Your Visual Crossing Timeline API key |
| `VITE_VISUAL_CROSSING_BASE_URL` | No | Override the API base URL — useful for pointing at a proxy or a stub server during development |

`.env` is gitignored; `.env.example` shows the shape.

**A note on `VITE_*` variables.** Vite inlines anything prefixed with `VITE_` into the JavaScript
bundle at build time. That means the key is visible to anyone who opens devtools on a deployed copy —
it is *not* a secret. This is a deliberate trade-off for a client-only app: it keeps the project free
of a backend, and Visual Crossing keys can be rate-limited and rotated. If you deploy this publicly
and care about the quota, put a small proxy in front of the API, keep the key server-side, and point
`VITE_VISUAL_CROSSING_BASE_URL` at the proxy.

## Visual Crossing API setup

1. Sign up at [visualcrossing.com](https://www.visualcrossing.com/sign-up) — the free tier allows
   1,000 records per day, which is plenty for local development.
2. Copy your key from the account page.
3. Paste it into `.env` as `VITE_VISUAL_CROSSING_API_KEY=...`.
4. Restart the dev server — Vite only reads `.env` at startup.

The app makes one request per location, asking for yesterday through seven days ahead with hourly
resolution. Responses are cached for ten minutes, so flipping between saved locations doesn't burn
through the quota.

## Testing

```bash
npm test
```

172 tests covering the parts where mistakes are expensive:

- Unit conversion (°C↔°F, km/h↔mph, distances, precipitation) and compass directions
- Weather condition mapping from the provider's icon set, including the heavy-rain threshold
- Timezone rendering: London vs Tokyo vs New York, DST transitions, date rollover at local midnight
- API response transformation: location parsing, hour flattening, the 7-day slice, malformed payloads
- 24-hour past/future windowing around the current hour
- Daylight progress and duration, including polar edge cases
- Clothing and outdoor-condition rules
- Saved locations and recent searches (dedup, ordering, caps, reordering)
- Search input validation, including rejected characters and overlong queries
- Request building, HTTP status → error mapping, and that the API key never reaches an error message
- Caching: hits, misses, forced refresh, and concurrent de-duplication
- Stored-preference handling: corrupt, tampered and wrong-shaped `localStorage` values
- The fetch state machine, including retry-after-failure and discarding stale responses
- Component tests for the search bar and the current-conditions card

## Project structure

```
src/
  api/           Visual Crossing client, response types, transformer, cached service, error model
  components/
    atmosphere/  Condition-driven background
    layout/      Header and wordmark
    search/      Search bar, saved locations, recent searches
    ui/          Panel, skeletons, segmented control, icons, error state
    weather/     Current conditions, timeline, chart, details, forecast, daylight, insights
  context/       Unit preferences
  hooks/         Data fetching, geolocation, URL state, localStorage-backed lists
  lib/           Conditions, units, time, series windowing, insights, cache, storage, validation
  types/         The normalised weather model
tests/           Vitest suites and a Visual Crossing response fixture builder
docs/            Architecture notes
```

## Technical decisions

**Everything is stored in metric and converted for display.** The API is always asked for
`unitGroup=metric`; switching to °F or mph re-renders from the same data rather than re-fetching.

**All timestamps are Unix epochs rendered through the location's IANA timezone.** There is no manual
offset arithmetic anywhere — `Intl.DateTimeFormat` handles DST correctly, which naive `tzoffset`
maths does not. Search Tokyo from London and every hour, sunrise and day boundary is Tokyo's.

**The date range is requested in UTC with a day of slack on each end.** A location's calendar day can
be 14 hours from UTC, so requesting yesterday→+7 UTC guarantees a full 24 hours of history and seven
forecast days once the series is re-sliced in the location's own timezone.

**`iconSet=icons2`.** The default icon set collapses showers, thunderstorms and snow showers into
plain "rain"/"snow". The richer set is what makes the condition categories worth having.

**Requests aren't cancelled.** The cache de-duplicates concurrent requests for the same location, so
one caller aborting would break the others. Instead, `useWeather` tags each request and discards
responses from superseded ones — same user-visible result, no shared-state hazard.

**No routing library.** One query parameter, read and written with the History API. Adding a router
for a single-screen app would be more code, not less.

**The chart is lazy-loaded.** Recharts roughly doubles the bundle and nothing above the fold needs
it, so it loads in its own chunk (~105 kB gzipped, versus ~79 kB for the rest of the app).

**An animation library was removed rather than kept.** The forecast rows originally expanded with
Framer Motion. That was ~41 kB gzipped — a third of the main bundle — for one accordion, so it was
replaced with a CSS `grid-template-rows: 0fr → 1fr` transition. The collapsed panel stays mounted for
the transition and is marked `inert`, which keeps it out of the tab order and the accessibility tree.

**No webfont.** The design uses the system font stack. That removes a render-blocking third-party
request, the layout shift that comes with it, and the privacy question of sending every visitor's IP
to a font CDN.

## Security

This is a client-only app with no backend, no accounts and no user data of its own, so the surface is
small. The parts that do matter:

- **The API key is not a secret.** Vite inlines `VITE_*` variables into the bundle, so anyone can read
  the key from a deployed copy. The README says so plainly rather than implying otherwise, and the
  mitigation (a proxy that keeps the key server-side, with `VITE_VISUAL_CROSSING_BASE_URL` pointed at
  it) is documented above.
- **Provider errors are never rendered.** Visual Crossing's 401 body echoes the submitted key back.
  Every failure is mapped to a `WeatherError` with a fixed message, and a test asserts the key cannot
  appear in one.
- **Search input is allowlisted, not blocklisted.** Letters, digits, spaces and three punctuation
  marks; everything else is rejected before it reaches the request builder. The same validation runs
  on the `?q=` parameter, because a shared link is untrusted input too.
- **Stored preferences are validated on read.** `localStorage` can be hand-edited or left over from an
  older version, so values are shape-checked with type guards and fall back to defaults instead of
  being cast and trusted.
- **No `dangerouslySetInnerHTML` anywhere.** All provider text renders as React children, which
  escapes it.
- **No third-party runtime requests** — no font CDN, analytics or trackers — so there is nothing to
  leak to and nothing to be compromised through.
- Geolocation is requested once, on demand, via `getCurrentPosition`. There is no `watchPosition`, and
  coordinates are rounded to four decimals (~11 m) before going into the URL or the cache key.

`npm audit` reports no known vulnerabilities in the dependency tree.

## Limitations

- The key is exposed in the client bundle (see the note above).
- Historical data is whatever Visual Crossing returns for the previous day; for some locations the
  earliest hours are modelled rather than observed.
- Searching by coordinates (which is what geolocation does) makes the provider echo the coordinates
  back as the address, so the city name is derived from the IANA timezone. That's accurate for
  Tokyo or Madrid, less so inside large zones such as `America/New_York`.
- Ambiguous searches resolve to whatever Visual Crossing picks — there is no disambiguation list.
- No offline support or service worker.
- The 7-day forecast shows daily aggregates only; there is no hourly drill-down per future day.

## Future improvements

- A small serverless proxy so the key stays server-side, with the base URL pointed at it
- Weather alerts (Visual Crossing returns them; they aren't surfaced yet)
- A location disambiguation list when a search matches several places
- Hourly detail inside an expanded forecast day
- Playwright tests for the flows currently only covered by hand
