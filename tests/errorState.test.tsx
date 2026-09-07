import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WeatherError, type WeatherErrorCode } from '../src/api/errors';
import { ErrorState } from '../src/components/ui/ErrorState';
import { renderWithUnits } from './helpers/render';

const codes: WeatherErrorCode[] = [
  'MISSING_API_KEY',
  'INVALID_API_KEY',
  'EMPTY_QUERY',
  'LOCATION_NOT_FOUND',
  'RATE_LIMITED',
  'NETWORK',
  'OFFLINE',
  'PROVIDER_UNAVAILABLE',
  'NO_DATA',
  'UNKNOWN',
];

describe('ErrorState', () => {
  it.each(codes)('announces %s with a human-readable message', (code) => {
    const { unmount } = renderWithUnits(<ErrorState error={new WeatherError(code)} />);

    const alert = screen.getByRole('alert');
    expect(alert.textContent?.trim().length).toBeGreaterThan(10);
    expect(alert.textContent).not.toMatch(/undefined|\[object|Error:/);
    unmount();
  });

  it('offers a retry for failures that retrying could fix', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderWithUnits(<ErrorState error={new WeatherError('NETWORK')} onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  // Retrying cannot fix a key that is absent or wrong, so the button would only
  // invite the user to fail repeatedly. Setup steps are shown instead.
  it.each(['MISSING_API_KEY', 'INVALID_API_KEY'] as const)('shows setup steps instead of retry for %s', (code) => {
    renderWithUnits(<ErrorState error={new WeatherError(code)} onRetry={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    expect(screen.getByText('cp .env.example .env')).toBeInTheDocument();
  });

  it('omits the retry button when no handler is given', () => {
    renderWithUnits(<ErrorState error={new WeatherError('UNKNOWN')} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
