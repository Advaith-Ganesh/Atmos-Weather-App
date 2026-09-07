# Security Policy

## Scope

Atmos is a client-only single-page application. There is no backend, no accounts, no server-side
storage and no user data beyond preferences held in the visitor's own browser. That keeps the attack
surface small, but a few properties are worth stating explicitly.

## The API key is not a secret

Vite inlines every `VITE_*` variable into the JavaScript bundle at build time. The Visual Crossing
key in a deployed copy of this app is readable by anyone who opens developer tools.

This is a deliberate trade-off, not an oversight: the project has no backend by design, and Visual
Crossing keys are rate-limited and rotatable. **Do not treat the key as confidential.**

If you deploy this publicly and care about your quota, put a small proxy in front of the API, hold
the key server-side, and point `VITE_VISUAL_CROSSING_BASE_URL` at the proxy. No application code
needs to change.

## What the implementation does guarantee

| Property | Where |
| --- | --- |
| Provider response bodies are never rendered — a Visual Crossing 401 echoes the submitted key back, so every failure maps to a fixed message instead | `src/api/errors.ts`, `src/api/visualCrossing.ts` |
| Search input is allowlisted (letters, digits, spaces, `,` `.` `'` `-`), not blocklisted | `src/lib/validation.ts` |
| The `?q=` parameter runs the same validation, because a shared link is untrusted input | `src/hooks/useLocationQuery.ts` |
| Stored preferences are shape-checked with type guards and fall back to defaults rather than being cast and trusted | `src/lib/storage.ts`, `src/lib/locations.ts` |
| No `dangerouslySetInnerHTML` anywhere; all provider text renders as escaped React children | repo-wide |
| No third-party runtime requests — no font CDN, analytics or trackers | `index.html` |
| Geolocation is requested once on demand, never watched, and coordinates are rounded to four decimals (~11 m) before entering the URL or cache key | `src/hooks/useGeolocation.ts` |

Several of these are covered by tests, including an assertion that the API key can never appear in a
user-facing error message.

## Dependencies

`npm audit` is expected to report zero known vulnerabilities. CI installs with `npm ci` against the
committed lockfile.

## Reporting a vulnerability

This is a personal portfolio project, not a production service. If you find a security problem,
please open an issue describing it, or contact the repository owner through their GitHub profile.

Please do not include a working API key, a token, or any other credential in a public issue.
