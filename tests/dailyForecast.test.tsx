import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DailyForecast } from '../src/components/weather/DailyForecast';
import { londonWeather, renderWithUnits } from './helpers/render';

describe('DailyForecast', () => {
  it('lists exactly seven days, starting today', () => {
    renderWithUnits(<DailyForecast data={londonWeather()} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow')).toBeInTheDocument();
  });

  it('starts with every day collapsed', () => {
    renderWithUnits(<DailyForecast data={londonWeather()} />);
    for (const row of screen.getAllByRole('button')) {
      expect(row).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('reveals wind, humidity, UV and sun times when a day is opened', async () => {
    const user = userEvent.setup();
    renderWithUnits(<DailyForecast data={londonWeather()} />);

    await user.click(screen.getByRole('button', { expanded: false, name: /Tomorrow/ }));

    const detail = screen.getByRole('button', { expanded: true }).closest('li');
    expect(detail).not.toBeNull();
    for (const field of ['Conditions', 'Wind', 'Humidity', 'UV index', 'Sunrise', 'Sunset']) {
      expect(within(detail as HTMLElement).getByText(field)).toBeInTheDocument();
    }
  });

  // The panel stays mounted so the height transition has something to animate,
  // so `inert` is what actually keeps it out of the tab order while collapsed.
  it('keeps collapsed detail out of the accessibility tree', async () => {
    const user = userEvent.setup();
    const { container } = renderWithUnits(<DailyForecast data={londonWeather()} />);

    expect(container.querySelectorAll('[inert]')).toHaveLength(7);

    await user.click(screen.getByRole('button', { expanded: false, name: /Today/ }));
    expect(container.querySelectorAll('[inert]')).toHaveLength(6);
  });

  it('closes the open day when it is clicked again', async () => {
    const user = userEvent.setup();
    renderWithUnits(<DailyForecast data={londonWeather()} />);
    const today = screen.getByRole('button', { name: /Today/ });

    await user.click(today);
    expect(today).toHaveAttribute('aria-expanded', 'true');

    await user.click(today);
    expect(today).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens only one day at a time', async () => {
    const user = userEvent.setup();
    renderWithUnits(<DailyForecast data={londonWeather()} />);

    await user.click(screen.getByRole('button', { name: /Today/ }));
    await user.click(screen.getByRole('button', { name: /Tomorrow/ }));

    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1);
  });
});
