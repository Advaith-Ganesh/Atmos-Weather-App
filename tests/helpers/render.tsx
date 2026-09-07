import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { transformTimeline } from '../../src/api/transform';
import { UnitsProvider } from '../../src/context/UnitsProvider';
import type { WeatherData } from '../../src/types/weather';
import { londonTimeline, tokyoTimeline } from '../fixtures/timeline';

/**
 * Almost every component reads unit preferences from context, so wrapping is
 * the default rather than something each test file repeats.
 */
export const renderWithUnits = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: UnitsProvider, ...options });

/** Shared transformed fixtures, so tests assert against the real domain model. */
export const londonWeather = (): WeatherData => transformTimeline(londonTimeline(), 'London');
export const tokyoWeather = (): WeatherData => transformTimeline(tokyoTimeline(), 'Tokyo');
