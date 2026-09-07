import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeatherDetails } from '../src/components/weather/WeatherDetails';
import { STORAGE_KEYS } from '../src/lib/storage';
import { londonWeather, renderWithUnits } from './helpers/render';

const metrics = [
  'Humidity',
  'UV index',
  'Visibility',
  'Pressure',
  'Cloud cover',
  'Wind',
  'Rain chance',
  'Rain total',
];

describe('WeatherDetails', () => {
  it('shows every metric as a described term and value', () => {
    renderWithUnits(<WeatherDetails data={londonWeather()} />);
    for (const metric of metrics) expect(screen.getByText(metric)).toBeInTheDocument();
  });

  it('uses metric units by default', () => {
    renderWithUnits(<WeatherDetails data={londonWeather()} />);
    expect(screen.getByText(/km\/h/)).toBeInTheDocument();
    expect(screen.getByText(/^\d+(\.\d+)? km$/)).toBeInTheDocument();
    expect(screen.getByText(/mm$/)).toBeInTheDocument();
  });

  it('switches distance, speed and rainfall together when the stored unit is imperial', () => {
    window.localStorage.setItem(STORAGE_KEYS.units, JSON.stringify({ temperature: 'F', speed: 'mph' }));
    renderWithUnits(<WeatherDetails data={londonWeather()} />);

    expect(screen.getByText(/mph/)).toBeInTheDocument();
    expect(screen.getByText(/mi$/)).toBeInTheDocument();
    expect(screen.getByText(/in$/)).toBeInTheDocument();
    expect(screen.queryByText(/km\/h/)).not.toBeInTheDocument();

    window.localStorage.clear();
  });

  it('describes the UV index rather than leaving a bare number', () => {
    renderWithUnits(<WeatherDetails data={londonWeather()} />);
    expect(screen.getByText(/^(Low|Moderate|High|Very high|Extreme)$/)).toBeInTheDocument();
  });

  it('names the wind direction in words', () => {
    renderWithUnits(<WeatherDetails data={londonWeather()} />);
    expect(screen.getByText(/^From the [NESW]{1,3}$/)).toBeInTheDocument();
  });
});
