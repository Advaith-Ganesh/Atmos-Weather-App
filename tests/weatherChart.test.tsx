import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { transformTimeline } from '../src/api/transform';
import { WeatherChart } from '../src/components/weather/WeatherChart';
import { UnitsProvider } from '../src/context/UnitsProvider';
import { hourWindow } from '../src/lib/series';
import { londonTimeline } from './fixtures/timeline';

const data = transformTimeline(londonTimeline(), 'London');

beforeAll(() => {
  // Recharts measures its container; jsdom reports zero for everything, which
  // would leave the SVG unrendered. Only the table is asserted on, but the
  // component still has to mount without warning.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 224 });
});

const renderChart = () =>
  render(
    <UnitsProvider>
      <WeatherChart data={data} />
    </UnitsProvider>,
  );

describe('WeatherChart accessibility', () => {
  it('publishes the series as a table, since the SVG conveys nothing', () => {
    renderChart();
    const table = screen.getByRole('table');

    // 48 hours of data plus the header row.
    expect(within(table).getAllByRole('row')).toHaveLength(hourWindow(data).past.length + hourWindow(data).future.length + 1);
    expect(within(table).getByRole('columnheader', { name: /time/i })).toBeInTheDocument();
  });

  it('summarises the range in the caption so it can be skimmed without reading every row', () => {
    renderChart();
    const caption = screen.getByRole('table').querySelector('caption');
    expect(caption?.textContent).toMatch(/48 hours/);
    expect(caption?.textContent).toMatch(/Europe\/London/);
    expect(caption?.textContent).toMatch(/Highest/);
    expect(caption?.textContent).toMatch(/lowest/i);
  });

  it('marks observed hours so past and forecast are distinguishable', () => {
    renderChart();
    expect(screen.getAllByRole('rowheader', { name: /observed/ }).length).toBeGreaterThan(0);
  });

  it('re-labels the table when the metric changes', async () => {
    const user = userEvent.setup();
    renderChart();

    expect(screen.getByRole('columnheader', { name: 'Temp' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Humidity' }));

    expect(screen.getByRole('columnheader', { name: 'Humidity' })).toBeInTheDocument();
    expect(screen.getByRole('table').querySelector('caption')?.textContent).toMatch(/Humidity over 48 hours/);
  });

  it('hides the decorative chart from assistive technology', () => {
    const { container } = renderChart();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
