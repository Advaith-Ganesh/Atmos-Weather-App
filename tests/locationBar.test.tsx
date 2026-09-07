import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LocationBar } from '../src/components/search/LocationBar';
import type { SavedLocation } from '../src/lib/locations';
import { renderWithUnits } from './helpers/render';

const saved: SavedLocation[] = [
  { id: 'london', label: 'London', query: 'London' },
  { id: 'dubai', label: 'Dubai', query: 'Dubai' },
];

const props = {
  saved,
  recent: ['Tokyo', 'Paris'],
  activeQuery: 'London',
  onSelect: vi.fn(),
  onRemoveSaved: vi.fn(),
  onMoveSaved: vi.fn(),
};

const renderBar = (overrides: Partial<typeof props> = {}) =>
  renderWithUnits(<LocationBar {...props} {...overrides} />);

describe('LocationBar', () => {
  it('renders nothing when there is nothing to show', () => {
    const { container } = renderBar({ saved: [], recent: [] });
    expect(container).toBeEmptyDOMElement();
  });

  it('separates saved locations from recent searches', () => {
    renderBar();
    expect(within(screen.getByRole('list', { name: 'Saved locations' })).getAllByRole('listitem')).toHaveLength(2);
    expect(within(screen.getByRole('list', { name: 'Recent searches' })).getAllByRole('listitem')).toHaveLength(2);
  });

  // A place that is already saved does not need to appear twice.
  it('hides a recent search that is also saved', () => {
    renderBar({ recent: ['Tokyo', 'london'] });
    const recent = screen.getByRole('list', { name: 'Recent searches' });
    expect(within(recent).queryByText(/london/i)).not.toBeInTheDocument();
  });

  it('marks the active location for assistive technology', () => {
    renderBar();
    expect(screen.getByRole('button', { name: 'London' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Dubai' })).not.toHaveAttribute('aria-current');
  });

  it('reports the query to load, not the label', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderBar({ onSelect });

    await user.click(screen.getByRole('button', { name: 'Dubai' }));
    expect(onSelect).toHaveBeenCalledWith('Dubai');
  });

  it('gives removal an unambiguous label naming the place', async () => {
    const onRemoveSaved = vi.fn();
    const user = userEvent.setup();
    renderBar({ onRemoveSaved });

    await user.click(screen.getByRole('button', { name: 'Remove Dubai from saved locations' }));
    expect(onRemoveSaved).toHaveBeenCalledWith('dubai');
  });

  it('offers reordering on every entry except the first', async () => {
    const onMoveSaved = vi.fn();
    const user = userEvent.setup();
    renderBar({ onMoveSaved });

    expect(screen.queryByRole('button', { name: /Move London earlier/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Move Dubai earlier' }));
    expect(onMoveSaved).toHaveBeenCalledWith(1, 0);
  });
});
