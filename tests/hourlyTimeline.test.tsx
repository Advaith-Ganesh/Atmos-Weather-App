import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HourlyTimeline } from '../src/components/weather/HourlyTimeline';
import { hourWindow } from '../src/lib/series';
import { londonWeather, renderWithUnits, tokyoWeather } from './helpers/render';

describe('HourlyTimeline', () => {
  it('shows 24 hours of history and 24 ahead', () => {
    const data = londonWeather();
    const { past, future } = hourWindow(data);

    renderWithUnits(<HourlyTimeline data={data} />);

    expect(past).toHaveLength(24);
    expect(future).toHaveLength(24);
    expect(screen.getAllByRole('listitem')).toHaveLength(past.length + future.length);
  });

  // The divider is a visual separator only; the per-hour summaries already say
  // which hours are observed, so announcing it would add noise.
  it('renders the now marker as decoration, outside the list semantics', () => {
    const { container } = renderWithUnits(<HourlyTimeline data={londonWeather()} />);
    const marker = screen.getByText('Now').closest('li');

    expect(marker).toHaveAttribute('aria-hidden');
    expect(container.querySelectorAll('li')).toHaveLength(49);
  });

  // Each column is an icon and a number, which conveys nothing on its own.
  it('gives every hour a spoken summary', () => {
    const data = londonWeather();
    renderWithUnits(<HourlyTimeline data={data} />);

    const list = screen.getByRole('list', { name: /Hourly weather/ });
    const summaries = within(list)
      .getAllByText(/chance of precipitation$/)
      .map((node) => node.textContent);

    expect(summaries).toHaveLength(hourWindow(data).past.length + hourWindow(data).future.length);
    expect(summaries[0]).toMatch(/^\d{2}:\d{2}: .+, -?\d+°C, \d+% chance of precipitation$/);
  });

  it('renders times in the location timezone, not the runtime one', () => {
    const tokyo = tokyoWeather();
    renderWithUnits(<HourlyTimeline data={tokyo} />);

    // The Tokyo fixture's current hour is 13:00 local, so the timeline must
    // contain that hour rather than the London equivalent.
    expect(screen.getAllByText('13:00').length).toBeGreaterThan(0);
  });

  it('labels the strip so its range is clear without reading it', () => {
    renderWithUnits(<HourlyTimeline data={londonWeather()} />);
    expect(
      screen.getByRole('list', { name: 'Hourly weather from 24 hours ago to 24 hours ahead' }),
    ).toBeInTheDocument();
  });
});
