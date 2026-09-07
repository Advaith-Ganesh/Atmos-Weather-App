import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { transformTimeline } from '../src/api/transform';
import { PrecipitationCard } from '../src/components/weather/PrecipitationCard';
import { buildTimeline } from './fixtures/timeline';
import { londonWeather, renderWithUnits } from './helpers/render';

const dry = () =>
  transformTimeline(
    buildTimeline({
      timezone: 'Europe/London',
      offsetHours: 1,
      resolvedAddress: 'London, England, United Kingdom',
      firstDate: '2026-07-14',
      // A clear-sky icon makes the generated probabilities negligible.
      icon: 'clear-day',
      currentHour: 18,
    }),
    'London',
  );

describe('PrecipitationCard', () => {
  it('lists the next twelve hours', () => {
    renderWithUnits(<PrecipitationCard data={londonWeather()} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(12);
  });

  // A bar with no numeric equivalent is invisible to a screen reader, so each
  // hour is a labelled meter carrying its own value.
  it('exposes each hour as a meter with its probability', () => {
    renderWithUnits(<PrecipitationCard data={londonWeather()} />);
    const meters = screen.getAllByRole('meter');

    expect(meters).toHaveLength(12);
    for (const meter of meters) {
      expect(meter).toHaveAttribute('aria-valuemin', '0');
      expect(meter).toHaveAttribute('aria-valuemax', '100');
      const value = Number(meter.getAttribute('aria-valuenow'));
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('names the hour each meter belongs to, in local time', () => {
    renderWithUnits(<PrecipitationCard data={londonWeather()} />);
    expect(screen.getAllByRole('meter')[0]).toHaveAccessibleName(/Chance of precipitation at \d{2}:\d{2}/);
  });

  it('summarises when rain is most likely', () => {
    renderWithUnits(<PrecipitationCard data={londonWeather()} />);
    expect(screen.getByText(/Most likely around \d{2}:\d{2} at \d+%/)).toBeInTheDocument();
  });

  it('says plainly when nothing is expected', () => {
    renderWithUnits(<PrecipitationCard data={dry()} />);
    expect(screen.getByText(/Nothing expected in the next 12 hours/)).toBeInTheDocument();
  });

  it('shows a percentage beside every bar', () => {
    renderWithUnits(<PrecipitationCard data={londonWeather()} />);
    for (const item of screen.getAllByRole('listitem')) {
      expect(within(item).getByText(/^\d+%$/)).toBeInTheDocument();
    }
  });
});
