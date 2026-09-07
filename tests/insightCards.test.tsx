import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { transformTimeline } from '../src/api/transform';
import { ClothingCard, OutdoorCard } from '../src/components/weather/InsightCards';
import { clothingAdvice, outdoorAssessment } from '../src/lib/insights';
import { hourWindow } from '../src/lib/series';
import { buildTimeline } from './fixtures/timeline';
import { londonWeather, renderWithUnits } from './helpers/render';

const freezing = () =>
  transformTimeline(
    buildTimeline({
      timezone: 'Atlantic/Reykjavik',
      offsetHours: 0,
      resolvedAddress: 'Reykjavik, Iceland',
      firstDate: '2026-07-14',
      icon: 'snow',
      baseTemperature: -6,
    }),
    'Reykjavik',
  );

describe('ClothingCard', () => {
  it('renders the headline and every tip the rules produced', () => {
    const data = londonWeather();
    const advice = clothingAdvice(data.current, hourWindow(data, 0, 6).future);

    renderWithUnits(<ClothingCard data={data} />);

    expect(screen.getByText(advice.headline)).toBeInTheDocument();
    for (const tip of advice.tips) expect(screen.getByText(tip.text)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(advice.tips.length);
  });

  it('reflects a different climate rather than showing fixed copy', () => {
    const { unmount } = renderWithUnits(<ClothingCard data={londonWeather()} />);
    const mild = screen.getByRole('region', { name: /what should i wear/i }).textContent;
    unmount();

    renderWithUnits(<ClothingCard data={freezing()} />);
    expect(screen.getByRole('region', { name: /what should i wear/i }).textContent).not.toBe(mild);
  });
});

describe('OutdoorCard', () => {
  it('shows the rating, score and explanation the rules produced', () => {
    const data = londonWeather();
    const assessment = outdoorAssessment(data.current, hourWindow(data, 0, 6).future);

    renderWithUnits(<OutdoorCard data={data} />);

    expect(screen.getByText(assessment.rating)).toBeInTheDocument();
    expect(screen.getByText(`${assessment.score}/100`)).toBeInTheDocument();
    expect(screen.getByText(assessment.summary)).toBeInTheDocument();
  });

  it('breaks the score down into the four factors it scored', () => {
    renderWithUnits(<OutdoorCard data={londonWeather()} />);
    for (const factor of ['Rain', 'Temperature', 'Wind', 'UV']) {
      expect(screen.getByText(factor)).toBeInTheDocument();
    }
  });

  // The rating is a judgement, so it has to change with the weather rather than
  // being decorative.
  it('rates a cold snowy day differently from a mild one', () => {
    const { unmount } = renderWithUnits(<OutdoorCard data={londonWeather()} />);
    const mild = screen.getByText(/\d+\/100/).textContent;
    unmount();

    renderWithUnits(<OutdoorCard data={freezing()} />);
    expect(screen.getByText(/\d+\/100/).textContent).not.toBe(mild);
  });
});
