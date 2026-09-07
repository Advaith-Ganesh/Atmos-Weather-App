import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WeatherBackdrop } from '../src/components/atmosphere/WeatherBackdrop';
import type { ConditionCategory } from '../src/types/weather';

const setReducedMotion = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  });
};

const particles = (container: HTMLElement) => container.querySelectorAll('span[style*="atmos-fall"]');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('WeatherBackdrop', () => {
  it('is decorative and never announced', () => {
    setReducedMotion(false);
    const { container } = render(<WeatherBackdrop condition="CLEAR" isDaylight />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden');
  });

  // The condition drives CSS custom properties rather than any panel or text
  // colour, so contrast never depends on the weather.
  it.each(['CLEAR', 'RAIN', 'SNOW', 'THUNDERSTORM', 'FOG'] as ConditionCategory[])(
    'exposes %s to CSS as a data attribute',
    (condition) => {
      setReducedMotion(false);
      const { container } = render(<WeatherBackdrop condition={condition} isDaylight />);
      expect(container.firstElementChild).toHaveAttribute('data-condition', condition);
    },
  );

  it('distinguishes day from night for the palette', () => {
    setReducedMotion(false);
    const { container } = render(<WeatherBackdrop condition="CLEAR" isDaylight={false} />);
    expect(container.firstElementChild).toHaveAttribute('data-daylight', 'false');
  });

  it.each(['RAIN', 'HEAVY_RAIN', 'SNOW', 'THUNDERSTORM'] as ConditionCategory[])(
    'renders falling particles for %s',
    (condition) => {
      setReducedMotion(false);
      const { container } = render(<WeatherBackdrop condition={condition} isDaylight />);
      expect(particles(container).length).toBeGreaterThan(0);
    },
  );

  it('renders no particles for dry conditions', () => {
    setReducedMotion(false);
    const { container } = render(<WeatherBackdrop condition="CLEAR" isDaylight />);
    expect(particles(container)).toHaveLength(0);
  });

  it('uses more particles for heavy rain than for rain', () => {
    setReducedMotion(false);
    const rain = render(<WeatherBackdrop condition="RAIN" isDaylight />);
    const heavy = render(<WeatherBackdrop condition="HEAVY_RAIN" isDaylight />);
    expect(particles(heavy.container).length).toBeGreaterThan(particles(rain.container).length);
  });

  // Gating at the source matters: skipping the media query alone would still
  // mount and lay out dozens of animated nodes.
  it('generates nothing at all when reduced motion is preferred', () => {
    setReducedMotion(true);
    const { container } = render(<WeatherBackdrop condition="THUNDERSTORM" isDaylight />);
    expect(particles(container)).toHaveLength(0);
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });
});
