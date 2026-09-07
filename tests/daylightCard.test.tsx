import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { transformTimeline } from '../src/api/transform';
import { DaylightCard } from '../src/components/weather/DaylightCard';
import { buildTimeline } from './fixtures/timeline';
import { londonWeather, renderWithUnits } from './helpers/render';

/** Places `currentConditions` at a chosen local hour so progress is predictable. */
const atLocalHour = (currentHour: number) =>
  transformTimeline(
    buildTimeline({
      timezone: 'Europe/London',
      offsetHours: 1,
      resolvedAddress: 'London, England, United Kingdom',
      firstDate: '2026-07-14',
      currentHour,
    }),
    'London',
  );

describe('DaylightCard', () => {
  it('shows sunrise and sunset in the location timezone', () => {
    renderWithUnits(<DaylightCard data={londonWeather()} />);

    // The fixture puts sunrise at 05:00 and sunset at 21:00 local.
    expect(screen.getByText('05:00')).toBeInTheDocument();
    expect(screen.getByText('21:00')).toBeInTheDocument();
  });

  it('reports the total daylight for the day', () => {
    renderWithUnits(<DaylightCard data={londonWeather()} />);
    expect(screen.getByText('16h 0m')).toBeInTheDocument();
  });

  it('reports the light remaining while the sun is still up', () => {
    renderWithUnits(<DaylightCard data={atLocalHour(13)} />);
    expect(screen.getByText(/8h 0m of light left/)).toBeInTheDocument();
  });

  it('says so once the sun has set', () => {
    renderWithUnits(<DaylightCard data={atLocalHour(22)} />);
    expect(screen.getByText('After sunset')).toBeInTheDocument();
  });

  // The marker is the only thing conveying position in the day, so it carries
  // the percentage as text for anyone who cannot see it.
  it('exposes the position through the day as a label', () => {
    renderWithUnits(<DaylightCard data={atLocalHour(13)} />);
    expect(screen.getByRole('img', { name: /50% through the daylight hours/ })).toBeInTheDocument();
  });

  it('clamps the marker before sunrise and after sunset', () => {
    renderWithUnits(<DaylightCard data={atLocalHour(3)} />);
    expect(screen.getByRole('img', { name: /0% through the daylight hours/ })).toBeInTheDocument();
  });
});
