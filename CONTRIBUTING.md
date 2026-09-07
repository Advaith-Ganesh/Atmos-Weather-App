# Contributing

This is a personal portfolio project rather than a community one, but the setup is documented so it
is easy to pick up — including by me, six months from now.

## Getting set up

```bash
npm install
cp .env.example .env      # add a Visual Crossing key
npm run dev
```

Node 20 or newer. A free key from [visualcrossing.com](https://www.visualcrossing.com/sign-up)
covers 1,000 records per day.

## Before you push

CI runs exactly these four, in this order, and any failure blocks the build:

```bash
npm run lint        # oxlint, warnings included
npm run typecheck   # tsc -b --force
npm test            # vitest run
npm run build       # tsc -b && vite build
```

## Conventions

**Commit messages** follow Conventional Commits — `feat:`, `fix:`, `refactor:`, `test:`, `docs:`,
`ci:`, `perf:`, `a11y:`, `chore:`. Say what changed and why; the diff already shows how.

**The provider boundary is the one rule worth enforcing.** Nothing outside `src/api` may import from
`visualCrossingTypes.ts`. Components read the normalised model in `src/types/weather.ts` and nothing
else. If a component needs a field the model does not carry, add it to the model and populate it in
`transform.ts`.

**Time is always a Unix epoch rendered through the location's IANA timezone**, via `src/lib/time.ts`.
Do not reach for `tzoffset` or manual offset maths — it is wrong across DST boundaries.

**Store metric, convert at the edge.** Values live in °C, km/h, mm and km; conversion happens in
`src/lib/units.ts` at render time, never in the data layer.

**Pure logic belongs in `src/lib/`.** Anything without React or I/O goes there, which is what makes
it directly testable.

## Tests

Tests live in `tests/`, mirroring the module they cover. `tests/fixtures/timeline.ts` builds
Visual Crossing-shaped payloads from a fixed seed — parameterised by timezone, offset, base
temperature and condition — so multi-day, multi-zone assertions stay deterministic without a large
JSON blob. `tests/helpers/render.tsx` wraps components in the units provider.

Write tests for behaviour the application actually has. A helper that exists only so a test can call
it is worse than no test.

## Accessibility

Every visual-only element needs a text equivalent — the chart has a hidden data table, the hourly
strip has per-hour summaries, the precipitation bars are labelled meters. Anything animated must be
gated behind `prefers-reduced-motion`. Keep the app fully keyboard operable.
