# Screenshots

Captures of the running application, taken with Playwright against a Chromium
build at a 2x device pixel ratio.

| File | Shows |
| --- | --- |
| `dashboard.png` | Full dashboard for a rainy location |
| `dashboard-clear.png` | Same layout under clear conditions, showing the condition-driven backdrop |
| `chart-precipitation.png` | 48-hour chart on the precipitation metric, tooltip open |
| `forecast-expanded.png` | 7-day forecast with a day expanded |
| `insights.png` | The two deterministic insight cards |
| `error-state.png` | Error handling for an unresolvable location |
| `mobile.png` | Full dashboard at a 390px viewport |

## Regenerating

These were captured in development against a local stub that returns
Visual Crossing-shaped payloads, because the capture environment had no API
key. The interface, layout and behaviour are the real ones; the weather values
are generated.

To replace them with captures against the live API, run the app with a real
key (`npm run dev`) and retake the same set at the same viewport sizes.
