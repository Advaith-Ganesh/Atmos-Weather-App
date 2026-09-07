import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Header } from '../src/components/layout/Header';
import { STORAGE_KEYS } from '../src/lib/storage';
import { renderWithUnits } from './helpers/render';

const props = {
  onSearch: vi.fn(),
  onUseCurrentLocation: vi.fn(),
  onRefresh: vi.fn(),
  isLocating: false,
  isRefreshing: false,
  canRefresh: true,
};

const renderHeader = (overrides: Partial<typeof props> & { currentLocation?: string } = {}) =>
  renderWithUnits(<Header {...props} {...overrides} />);

afterEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe('Header', () => {
  it('exposes search as a landmark with a labelled field', () => {
    renderHeader();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /search for a location/i })).toBeInTheDocument();
  });

  it('offers both unit switchers as labelled groups', () => {
    renderHeader();
    expect(screen.getByRole('group', { name: 'Temperature unit' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Wind speed unit' })).toBeInTheDocument();
  });

  it('persists a unit change so it survives a reload', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getAllByRole('button', { name: 'Fahrenheit' })[0]);

    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.units) ?? '{}')).toMatchObject({
      temperature: 'F',
    });
  });

  it('reports a submitted search', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    renderHeader({ onSearch });

    await user.type(screen.getByRole('searchbox'), 'Reykjavik{Enter}');
    expect(onSearch).toHaveBeenCalledWith('Reykjavik');
  });

  it('shows the loaded location in the placeholder', () => {
    renderHeader({ currentLocation: 'Tokyo' });
    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', expect.stringContaining('Tokyo'));
  });

  // The controls are rendered twice so they can sit in different places at
  // different widths; only one set is displayed, but both must work.
  it('wires the refresh and locate controls', async () => {
    const onRefresh = vi.fn();
    const onUseCurrentLocation = vi.fn();
    const user = userEvent.setup();
    renderHeader({ onRefresh, onUseCurrentLocation });

    await user.click(screen.getAllByRole('button', { name: 'Refresh weather data' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'Use my current location' })[0]);

    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onUseCurrentLocation).toHaveBeenCalledOnce();
  });

  it('disables refresh when there is nothing loaded to refresh', () => {
    renderHeader({ canRefresh: false });
    for (const button of screen.getAllByRole('button', { name: 'Refresh weather data' })) {
      expect(button).toBeDisabled();
    }
  });

  it('disables the controls while their action is already running', () => {
    renderHeader({ isRefreshing: true, isLocating: true });
    for (const button of screen.getAllByRole('button', { name: 'Refresh weather data' })) {
      expect(button).toBeDisabled();
    }
    for (const button of screen.getAllByRole('button', { name: 'Use my current location' })) {
      expect(button).toBeDisabled();
    }
  });
});
