# Architecture

Notes on how Atmos is put together, for anyone reading the code (including me in six months).

## Layers

```
┌─────────────────────────────────────────────┐
│ components/         presentation only       │
├─────────────────────────────────────────────┤
│ hooks/ + context/   state and side effects  │
├─────────────────────────────────────────────┤
│ api/weatherService  caching + de-duplication│
├─────────────────────────────────────────────┤
│ api/visualCrossing  HTTP, URL building      │
│ api/transform       provider → domain model │
├─────────────────────────────────────────────┤
│ types/weather       the only shape the UI   │
│                     ever sees               │
└─────────────────────────────────────────────┘
```

`lib/` sits beside all of this: pure functions with no React and no I/O (units, timezone formatting,
condition mapping, insight rules, series windowing, validation, storage wrappers). That is where most
of the test suite points.

The one rule worth keeping: **no component imports anything from `api/visualCrossingTypes.ts`.**
The provider's shape stops at `transform.ts`.

## Request flow

A search, a saved-location click, a geolocation fix and a page load with `?q=` all end in the same
place — the query string in the URL.

```
user action
   → useLocationQuery writes ?q=… via history.pushState
   → useWeather(query) fires
   → getWeather(query)
       → cache hit?  → return immediately
       → in flight?  → join the existing promise
       → otherwise   → fetchTimeline() → transformTimeline() → cache → return
   → setResult({ query, data, error })
   → components render
```

`useWeather` stores only *settled* results, each tagged with the query it belongs to. "Loading" is
derived — the stored result's query doesn't match the requested one — rather than being a separate
state transition. That keeps the state machine to one write per request and makes a stale response
impossible to render: a response whose request id is no longer current is dropped on arrival.

There is deliberately no `AbortController`. Because the cache can hand the same promise to several
callers, letting any one of them abort would break the others. Discarding late responses achieves the
same user-visible outcome without the shared-state hazard.

## Data transformation

Visual Crossing returns a `days[]` array, each day carrying `hours[]`, plus a `currentConditions`
block and an IANA `timezone`. `transformTimeline` does four things:

1. **Flattens** every day's hours into one epoch-ordered series.
2. **Slices** the days to today-onwards (seven of them), where "today" means the calendar date at the
   *location*, computed with `Intl.DateTimeFormat`, not the browser.
3. **Normalises** every value: clamps percentages to 0–100, replaces nulls with sensible defaults
   (the provider frequently returns `null` for `precip` on future hours), and maps the `icon` string
   to one of nine `ConditionCategory` values.
4. **Names** the location. `resolvedAddress` is split into a heading and a region; when the search was
   by coordinates the provider echoes the coordinates back, so the city name is derived from the
   timezone instead.

Anything the app can't use — an empty `days` array, no hourly records, no day at or after the current
time — throws a `WeatherError`, so the UI has exactly one failure shape to handle.

### The date range

The request asks for `yesterday → +7 days` in **UTC**. A location's local day can sit up to 14 hours
from UTC, so the extra day at each end guarantees that, after re-slicing in the location's timezone,
there are always a full 24 hours of history and seven complete forecast days.

## Time handling

Every timestamp in the domain model is a Unix epoch. Formatting always goes through `lib/time.ts`,
which builds `Intl.DateTimeFormat` instances (cached by zone + options) bound to the location's IANA
timezone.

This is the reason there is no offset arithmetic in the codebase. `tzoffset` from the API is a single
number and would be wrong on either side of a DST boundary; `Intl` knows the actual rules. The tests
cover the London clock change on 29 March 2026, the date rolling over at local midnight in Tokyo
while it is still the previous day in London, and zones that do not observe DST at all.

`daylight()` returns the fraction of the day elapsed between sunrise and sunset, clamped at both ends,
and handles `sunrise === sunset` so polar locations don't divide by zero.

## State

| State | Where it lives | Why |
| --- | --- | --- |
| Selected location | URL (`?q=`) | Shareable, survives reload, back button works |
| Weather data | `useWeather` + module-level TTL cache | Per-view state, shared cache |
| Unit preferences | React context + `localStorage` | Needed by ~10 components |
| Saved locations | `useSavedLocations` + `localStorage` | Small list, no account needed |
| Recent searches | `useRecentSearches` + `localStorage` | Same |
| Chart metric, expanded day | Local component state | Nothing else needs them |

There is no global store. The only genuinely cross-cutting value is unit preference, and a context is
enough for that.

`lib/storage.ts` wraps every `localStorage` read and write in `try`/`catch`: the API throws in Safari
private mode and in embedded browsers with site data disabled, and losing a preference should never
break the page.

## Caching

`TtlCache` (in `lib/cache.ts`) is about forty lines and does two things:

- **Time-to-live**, ten minutes for weather. Visual Crossing bills per request and updates
  observations roughly every fifteen minutes, so this costs almost nothing in freshness.
- **In-flight de-duplication.** Concurrent calls for the same key share one promise. React Strict
  Mode's double-invoked effects hit this immediately in development; it also covers a user clicking
  two saved locations quickly.

Keys are the normalised, lower-cased query, so `London`, `london` and `  London  ` are one entry.
Failed loads are not cached — the pending entry is cleared in a `finally`, so the next attempt
retries. The manual refresh button deletes the entry before requesting.

## Styling

Tailwind v4 with tokens declared in `@theme` in `src/index.css`. The palette is narrow on purpose:
one ink scale, one accent, and a set of condition hues that only ever reach the page backdrop.

Weather influences the environment through CSS custom properties on the backdrop element
(`--sky-top`, `--sky-mid`, `--sky-accent`), selected by a `data-condition` attribute. Panel surfaces
and text colours never change, so contrast is identical in a thunderstorm and in clear skies.

Ambient motion — falling rain and snow, drifting cloud, storm flashes — is plain absolutely
positioned spans driven by one CSS transform keyframe. That is cheap enough for a phone and far
lighter than a canvas or a particle library for an effect this subtle. It is gated twice: the
`usePrefersReducedMotion` hook skips generating particles at all, and a global media query neutralises
any animation that slips through.

## Accessibility

- Semantic landmarks (`header`, `main`, `footer`, labelled `section`s) and a skip link
- Every control is a real `button` or `input`; the unit switchers are `aria-pressed` groups
- The hourly timeline carries a visually hidden per-hour summary, since the visual columns are
  icon-and-number only
- Loading state is an `aria-busy` region with a live announcement, not a spinner
- Errors render in `role="alert"`
- `/` focuses the search field; everything is reachable by tab

One subtlety worth recording: those visually hidden summaries are `position: absolute`, and inside the
horizontally scrolling timeline they originally had no positioned ancestor. Their containing block
became the viewport, so the scroll container's `overflow: hidden` did not clip them and they stretched
the document to ~2,800px on mobile. The fix is `relative` on each timeline column.

## Testing strategy

Tests target the layers where a mistake is silent: conversions, timezone rendering, response
transformation, and the insight rules. Components are tested only where behaviour is non-obvious —
search validation, and that unit preferences actually reach the rendered output.

`tests/fixtures/timeline.ts` builds Visual Crossing-shaped payloads programmatically from a fixed
seed, parameterised by timezone and offset. That gives realistic multi-day, multi-timezone data
without a 200 KB JSON file, and keeps every assertion deterministic.
