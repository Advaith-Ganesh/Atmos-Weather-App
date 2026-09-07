import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Panel } from '../src/components/ui/Panel';
import { Skeleton } from '../src/components/ui/Skeleton';
import { renderWithUnits } from './helpers/render';

describe('Panel', () => {
  // Sections are how a screen reader user moves around the dashboard, so the
  // heading has to be wired to the region rather than just looking like one.
  it('exposes a titled panel as a labelled region', () => {
    renderWithUnits(<Panel title="Daylight">content</Panel>);

    const region = screen.getByRole('region', { name: 'Daylight' });
    expect(region).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Daylight' })).toBeInTheDocument();
  });

  it('derives a heading id that the region actually points at', () => {
    renderWithUnits(<Panel title="48-hour trend">content</Panel>);

    const region = screen.getByRole('region', { name: '48-hour trend' });
    const heading = screen.getByRole('heading', { name: '48-hour trend' });
    expect(region).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('accepts an external label when the heading lives elsewhere', () => {
    renderWithUnits(
      <>
        <h2 id="external">Conditions</h2>
        <Panel labelledBy="external">content</Panel>
      </>,
    );
    expect(screen.getByRole('region', { name: 'Conditions' })).toBeInTheDocument();
  });

  it('renders an untitled panel without an empty heading', () => {
    renderWithUnits(<Panel>content</Panel>);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('places the action slot alongside the title', () => {
    renderWithUnits(
      <Panel title="Trend" action={<button type="button">Switch</button>}>
        content
      </Panel>,
    );
    expect(screen.getByRole('button', { name: 'Switch' })).toBeInTheDocument();
  });
});

describe('Skeleton', () => {
  it('is decorative, so it is never announced while loading', () => {
    const { container } = renderWithUnits(<Skeleton className="h-4 w-20" />);
    const block = container.firstElementChild;

    expect(block).toHaveAttribute('aria-hidden');
    expect(block).toHaveClass('h-4', 'w-20');
  });
});
