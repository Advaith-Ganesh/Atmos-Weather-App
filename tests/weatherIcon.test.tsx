import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeatherIcon } from '../src/components/ui/WeatherIcon';
import type { ConditionCategory } from '../src/types/weather';

const categories: ConditionCategory[] = [
  'CLEAR',
  'PARTLY_CLOUDY',
  'CLOUDY',
  'FOG',
  'RAIN',
  'HEAVY_RAIN',
  'SNOW',
  'THUNDERSTORM',
  'WIND',
];

const svgOf = (container: HTMLElement) => container.querySelector('svg');

describe('WeatherIcon', () => {
  it.each(categories)('renders an icon for %s', (condition) => {
    const { container } = render(<WeatherIcon condition={condition} />);
    expect(svgOf(container)).toBeTruthy();
  });

  // The label always comes from the surrounding text, so a decorative icon
  // announcing itself would just duplicate it.
  it.each(categories)('keeps %s out of the accessibility tree', (condition) => {
    const { container } = render(<WeatherIcon condition={condition} />);
    expect(svgOf(container)).toHaveAttribute('aria-hidden');
  });

  it('swaps to a night glyph for the conditions that have one', () => {
    const day = render(<WeatherIcon condition="CLEAR" isDaylight />).container.innerHTML;
    const night = render(<WeatherIcon condition="CLEAR" isDaylight={false} />).container.innerHTML;
    expect(day).not.toBe(night);
  });

  it('uses the same glyph day and night where no night variant exists', () => {
    const day = render(<WeatherIcon condition="RAIN" isDaylight />).container.innerHTML;
    const night = render(<WeatherIcon condition="RAIN" isDaylight={false} />).container.innerHTML;
    expect(day).toBe(night);
  });

  it('passes className and strokeWidth through to the svg', () => {
    const { container } = render(<WeatherIcon condition="SNOW" className="h-6 w-6" strokeWidth={2} />);
    expect(svgOf(container)).toHaveClass('h-6', 'w-6');
    expect(svgOf(container)).toHaveAttribute('stroke-width', '2');
  });
});
