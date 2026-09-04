import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { transformTimeline } from '../src/api/transform';
import { CurrentWeather } from '../src/components/weather/CurrentWeather';
import { UnitsProvider } from '../src/context/UnitsProvider';
import { STORAGE_KEYS } from '../src/lib/storage';
import { londonTimeline } from './fixtures/timeline';

const data = transformTimeline(londonTimeline(), 'London');

const renderCard = (props: Partial<Parameters<typeof CurrentWeather>[0]> = {}) =>
  render(
    <UnitsProvider>
      <CurrentWeather data={data} isSaved={false} onToggleSaved={vi.fn()} {...props} />
    </UnitsProvider>,
  );

describe('CurrentWeather', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('shows the place, the condition and the assignment metrics', () => {
    renderCard();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('London');
    expect(screen.getByText('England, United Kingdom')).toBeInTheDocument();
    expect(screen.getByText('Partially cloudy')).toBeInTheDocument();
    expect(screen.getByText(/Feels like/)).toBeInTheDocument();
    expect(screen.getByText('Wind')).toBeInTheDocument();
    expect(screen.getByText('Rain')).toBeInTheDocument();
  });

  it('renders times in the location timezone, not the runtime one', () => {
    renderCard();
    // The fixture's currentConditions is 13:00 local on a Wednesday.
    expect(screen.getByText(/Wed 13:00 local/)).toBeInTheDocument();
  });

  it('honours a stored Fahrenheit preference', () => {
    window.localStorage.setItem(STORAGE_KEYS.units, JSON.stringify({ temperature: 'F', speed: 'mph' }));
    renderCard();

    const celsius = Math.round(data.current.temperature);
    const fahrenheit = Math.round(data.current.temperature * (9 / 5) + 32);
    expect(screen.getByText(`${fahrenheit}°`)).toBeInTheDocument();
    expect(screen.queryByText(`${celsius}°`)).not.toBeInTheDocument();
  });

  it('exposes saving as a toggle button', async () => {
    const onToggleSaved = vi.fn();
    const user = userEvent.setup();
    renderCard({ onToggleSaved });

    const button = screen.getByRole('button', { name: /save London/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(onToggleSaved).toHaveBeenCalledOnce();
  });

  it('flips the button label once the location is saved', () => {
    renderCard({ isSaved: true });
    expect(screen.getByRole('button', { name: /remove London from saved locations/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
